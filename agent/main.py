import asyncio
import os
import sys
import traceback
import json
import aiohttp

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

SYSTEM_PROMPT = (
    "You are Rookies AI, a professional voice assistant. "
    "You help manage inventory, orders, and customers. "
    "STRICT RULE: When asked for the menu or inventory, ONLY list items returned by the get_inventory tool. "
    "DO NOT make up items like pizza, burgers, or anything else if they are not in the list. "
    "If the inventory is empty, say so honestly. Do not hallucinate. "
    "STRICT WORKFLOW: Always collect and verify customer details (Name, Phone, etc.) BEFORE taking any order details. "
    "Even if the user starts by saying they want to order something, first ask for their name and contact information if not already known. "
    "When creating a customer, navigate to /dashboard/customers. After success, stay there or show confirmation. "
    "After creating an order successfully, navigate to /dashboard/orders. "
    "Always confirm the total amount with the user before placing the order. "
    "Keep answers very short and friendly."
)

# In 0.12.x, tools must inherit from llm.FunctionContext
class RookiesAssistant(llm.FunctionContext):
    def __init__(self, business_id: str, ctx: JobContext):
        super().__init__()
        self.business_id = business_id
        self.ctx = ctx
        self.api_base = os.getenv("ROOKIES_API_URL", "http://localhost:3000/api/agent")
        self.secret = os.getenv("ROOKIES_AGENT_SECRET")

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

    @llm.ai_callable(description="Get the list of items in the menu or inventory.")
    async def get_inventory(self):
        result = await self._call_api("menu")
        print(f"[agent] get_inventory result: {result}")
        if isinstance(result, str) and result.startswith("Error"):
            return result
        
        if not result or (isinstance(result, list) and len(result) == 0):
            return "The inventory is currently empty. Please add items to your inventory on the website first."
            
        items_text = "\n".join([f"- {i['name']}: Rs {i['price']} ({i['quantity']} {i['unit']} left)" for i in result])
        return f"Here is the menu:\n{items_text}"

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
        max_nested_fnc_calls=5,
    )

    @assistant.on("user_transcript")
    def on_user_transcript(transcript: str, is_final: bool):
        if is_final:
            print(f"> USER SAID: {transcript}")

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
