import asyncio
import os
import sys
import traceback
import json
import aiohttp
from datetime import datetime

# Windows fix
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from dotenv import load_dotenv
load_dotenv()

from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import silero, deepgram, openai, groq

AGENT_NAME = "rookies-agent"

# ── Context trim limit (keeps token count low → no rate limits) ──────────────
MAX_CONTEXT_MESSAGES = 12   # keep last N messages (system + alternating turns)

# ── Time-aware greeting ───────────────────────────────────────────────────────
def get_greeting() -> str:
    h = datetime.now().hour
    if h < 12:
        period = "morning"
    elif h < 17:
        period = "afternoon"
    else:
        period = "evening"
    return f"Good {period}! I'm Rookies AI. How can I help you today?"

# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "You are Rookies AI, a voice assistant for business management. "
    "ABSOLUTE RULE: Ask ONLY ONE question per reply. Never ask two questions at once. "
    "Wait for the user's answer before asking the next question. "
    "STRICT RULES: "
    "1. ONLY list inventory items from get_inventory — never invent items. "
    "   When the user asks for the menu, call get_inventory and read EVERY item name and price aloud. "
    "2. Get customer name → phone BEFORE taking any order. "
    "3. After adding customer → navigate_to('/dashboard/customers'). "
    "4. After creating order → navigate_to('/dashboard/orders'). "
    "5. After adding inventory → navigate_to('/dashboard/inventory'). "
    "6. Confirm order total before calling create_order. "
    "7. INVENTORY ADD — collect ONE field per turn in order: "
    "   name → SKU(skip ok) → quantity → unit → cost_price(skip ok) → sell_price(REQUIRED) → low_stock_at(skip ok) → confirm → call add_inventory ONCE. "
    "   NEVER call add_inventory without name+stock+unit+sell_price. "
    "   NEVER call get_inventory after adding. "
    "8. Keep replies under 20 words except when reading the full menu."
)

# In 0.12.x, tools must inherit from llm.FunctionContext
class RookiesAssistant(llm.FunctionContext):
    def __init__(self, business_id: str, ctx: JobContext):
        super().__init__()
        self.business_id = business_id
        self.ctx = ctx
        self.api_base = os.getenv("ROOKIES_API_URL", "http://localhost:3000/api/agent")
        self.secret = os.getenv("ROOKIES_AGENT_SECRET")
        # 60-second inventory cache to prevent repeated fetches / token waste
        self._inventory_cache: str | None = None
        self._inventory_cache_ts: float = 0
        # Set after assistant is created so tools can call assistant.say() directly
        self.assistant: VoiceAssistant | None = None

    async def _call_api(self, action: str, data: dict = None):
        print(f"[agent] Calling API: {action} (Biz: {self.business_id}) with data: {data}")
        url = f"{self.api_base}/{action}"
        headers = {
            "x-agent-secret": self.secret,
            "Content-Type": "application/json"
        }
        payload = {"businessId": self.business_id, **(data or {})}
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload) as resp:
                if resp.status != 200:
                    return f"Error: {await resp.text()}"
                return await resp.json()

    @llm.ai_callable(description="Navigate the user interface to a specific page.")
    async def navigate_to(self, path: str):
        """
        Paths like '/dashboard/customers', '/dashboard/orders', etc.
        """
        payload = json.dumps({"type": "navigation", "path": path}).encode('utf-8')
        await self.ctx.room.local_participant.publish_data(payload)
        return f"Navigating to {path}."

    # In 0.12.x, the decorator is @llm.ai_callable
    @llm.ai_callable(description="Get business stats like today's revenue.")
    async def get_stats(self):
        result = await self._call_api("dashboard-stats")
        return f"Revenue: Rs {result['todayRevenue']}."

    @llm.ai_callable(description="Add a new customer to the database.")
    async def add_customer(
        self,
        name: str,
        phone: str = None,
        email: str = None,
        address: str = None,
        notes: str = None
    ):
        result = await self._call_api("add-customer", {
            "name": name,
            "phone": phone,
            "email": email,
            "address": address,
            "notes": notes
        })
        if isinstance(result, str) and result.startswith("Error"):
            return result
        return f"Customer {name} added successfully."

    # ── Menu / inventory listing (cached, force-spoken via TTS) ──────────────────
    @llm.ai_callable(description="Get and read out the full menu or inventory list to the user.")
    async def get_inventory(self):
        import time
        now = time.monotonic()
        # Serve from cache if fresh
        if self._inventory_cache and (now - self._inventory_cache_ts) < 60:
            menu_text = self._inventory_cache
            print("[agent] inventory: (from cache)")
        else:
            result = await self._call_api("menu")
            print(f"[agent] inventory raw: {result}")
            if isinstance(result, str):
                menu_text = result
            elif not result:
                menu_text = "The inventory is empty."
            else:
                available = [i for i in result if i.get("quantity", 0) > 0]
                if not available:
                    menu_text = "All items are currently out of stock."
                else:
                    parts = [f"{i['name']} at Rs {i['price']}" for i in available]
                    if len(parts) == 1:
                        spoken = parts[0]
                    elif len(parts) == 2:
                        spoken = f"{parts[0]} and {parts[1]}"
                    else:
                        spoken = ", ".join(parts[:-1]) + f", and {parts[-1]}"
                    menu_text = f"Here is our menu: {spoken}."
            self._inventory_cache = menu_text
            self._inventory_cache_ts = now

        # ─ GODMODE: Force TTS to speak the menu directly, skip LLM re-generation ─
        if self.assistant:
            asyncio.ensure_future(self.assistant.say(menu_text, allow_interruptions=True))
            return "Menu has been announced."

        # Fallback if assistant ref not set yet
        return menu_text

    @llm.ai_callable(description="Create a new order for a customer.")
    async def create_order(
        self,
        customer_name: str,
        items: str,
        total_amount: float,
        customer_phone: str = None,
        notes: str = None
    ):
        """
        items should be a JSON string representing a list of objects with 'id', 'name', and 'quantity'.
        Example: '[{"id": "uuid", "name": "Cake", "quantity": 1}]'
        """
        try:
            parsed_items = json.loads(items)
        except Exception:
            return "Error: Invalid items format. Please provide a valid JSON list string."

        result = await self._call_api("create-order", {
            "customerName": customer_name,
            "customerPhone": customer_phone,
            "items": parsed_items,
            "totalAmount": total_amount,
            "notes": notes
        })
        if isinstance(result, str) and result.startswith("Error"):
            return result
        return f"Order created successfully for {customer_name}. Total: Rs {total_amount}."

    @llm.ai_callable(
        description=(
            "FINAL STEP: Add a confirmed new item to inventory. "
            "ONLY call this after collecting ALL required info from the user: "
            "name, quantity, unit, and sell price. "
            "Optional fields: SKU, cost price, low stock alert level (user can say skip). "
            "Do NOT call with missing name, price, or stock."
        )
    )
    async def add_inventory(
        self,
        name: str,
        price: float = 0.0,        # required — 0 triggers guard below
        stock: int = 0,             # required — 0 triggers guard below
        unit: str = "units",
        sku: str = None,
        cost_price: float = None,   # Optional — null/omit when user says skip
        low_stock_at: int = None,   # Optional — null/omit when user says skip
    ):
        # ── Guard: required fields not yet collected ───────────────────────────
        if not name or not name.strip():
            return "I still need the item name. What would you like to call this item?"
        if price <= 0:
            return f"I still need the sell price for {name}. How much does it sell for in Rs?"
        if stock < 0:
            return f"I still need the stock quantity for {name}. How many units do you have?"

        # ── Safety cast for optional fields (guard against any edge case) ─────
        parsed_cost:  float | None = float(cost_price)  if cost_price  else None
        parsed_alert: int   | None = int(low_stock_at)  if low_stock_at else None

        payload = {
            "name":  name,
            "price": price,
            "stock": stock,
            "unit":  unit,
        }
        if sku and str(sku).strip().lower() not in ("skip", "none", "null", ""):
            payload["sku"] = sku
        if parsed_cost is not None:
            payload["costPrice"] = parsed_cost
        if parsed_alert is not None:
            payload["lowStockAt"] = parsed_alert

        # ── Duplicate check: fetch current inventory and look for same name ───
        existing = await self._call_api("menu")
        if isinstance(existing, list):
            match = next(
                (i for i in existing if i.get("name", "").lower() == name.lower()),
                None
            )
            if match:
                return (
                    f"'{name}' is already in the inventory at Rs {match['price']} "
                    f"with {match['quantity']} {match['unit']} in stock. "
                    f"No duplicate was created."
                )

        result = await self._call_api("add-inventory", payload)
        if isinstance(result, str) and result.startswith("Error"):
            return result

        # Invalidate cache so next menu request shows the new item
        self._inventory_cache = None
        self._inventory_cache_ts = 0

        details = [f"Rs {price}/{unit}", f"{stock} in stock"]
        if sku:
            details.append(f"SKU: {sku}")
        if parsed_alert:
            details.append(f"alert at {parsed_alert}")
        return f"Added '{name}' to inventory — " + ", ".join(details) + "."


# ── Context trimmer — keeps token count low to avoid rate limits ──────────────
MAX_CONTEXT_MESSAGES = 6   # keep only the last N non-system messages (lower = fewer tokens)

def trim_context(assistant: VoiceAssistant):
    """Trim old conversation messages so the context window stays small."""
    try:
        ctx    = assistant.chat_ctx
        msgs   = ctx.messages
        system = [m for m in msgs if m.role == "system"]
        convo  = [m for m in msgs if m.role != "system"]
        if len(convo) > MAX_CONTEXT_MESSAGES:
            ctx.messages = system + convo[-MAX_CONTEXT_MESSAGES:]
    except Exception:
        pass  # never crash the pipeline over trimming


async def entrypoint(ctx: JobContext):
    # Try multiple sources for business_id
    business_id = ctx.job.metadata or ctx.room.metadata
    
    if not business_id:
        print("[agent] WARNING: No business_id found in metadata. Using 'default'.")
        business_id = "default"
    else:
        print(f"[agent] Starting session for business: {business_id}")

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    rookies = RookiesAssistant(business_id, ctx)

    # VoiceAssistant 0.12.x configuration
    assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=groq.STT(model="whisper-large-v3-turbo"),
        llm=openai.LLM(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY"),
            model="llama-3.1-8b-instant"
        ),
        tts=deepgram.TTS(model="aura-asteria-en"),
        fnc_ctx=rookies,
        chat_ctx=llm.ChatContext().append(role="system", text=SYSTEM_PROMPT),
        max_nested_fnc_calls=2,
    )
    # Wire assistant ref so tools can call say() directly
    rookies.assistant = assistant

    # ── Trim context on every final transcript to prevent rate limits ───────────
    @assistant.on("user_transcript")
    def on_user_transcript(transcript: str, is_final: bool):
        if is_final:
            print(f"> USER: {transcript}")
            trim_context(assistant)

    try:
        assistant.start(ctx.room)
        print("[agent] Assistant started. Sending greeting...")
        await assistant.say(
            "Hi, I am Rookies AI. How can I help you today?",
            allow_interruptions=True
        )
        
        # Keep the session alive in 0.12.x
        await asyncio.sleep(999999)
    except Exception as e:
        print(f"[agent] Assistant failed: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name=AGENT_NAME,
        )
    )
