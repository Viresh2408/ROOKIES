# Orders & Delivery Flow

This doc summarizes how orders are ingested, stored in Supabase, shown in the dashboard, and moved through delivery with OTP verification.

## Data model (Supabase `orders`)
Key columns currently used by the app:
- `id` (uuid, PK)
- `business_id` (text)
- `customer_name`, `customer_phone` (text)
- `items` (jsonb)
- `total_amount` (numeric/decimal)
- `delivery_time` (text) — optional scheduling string
- `status` (text) — lifecycle values: `PLACED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED` (legacy values like `pending`/`completed` are normalized in code)
- Delivery tracking: `delivery_started_at` (timestamptz), `estimated_delivery_time` (timestamptz), `otp` (text), `otp_verified` (boolean)
- Metadata: `source`, `note`, `created_at`

## Order ingestion
- Endpoint: `/api/webhooks/n8n` POST — [app/api/webhooks/n8n/route.ts](../app/api/webhooks/n8n/route.ts)
- Behavior (type = `order`): inserts into `orders` with provided customer, items, `total_amount`, `delivery_time`, `source`; defaults status to `pending` (later normalized to `PLACED` in reads).
- Other supported types: `delivery` (mock payload only), `payment` (status update placeholder).

## Dashboard: list & status changes
- Server action: `getOrdersForUser` — [app/(dashboard)/dashboard/orders/actions.ts](../app/(dashboard)/dashboard/orders/actions.ts)
  - Reads Supabase `orders`, filters to active statuses, orders by `created_at` desc.
  - Normalizes status to the supported set and safely converts date strings to ISO to avoid SSR crashes.
  - Maps `note` or `items` JSON into the UI-friendly `notes` field.
- UI: Orders page — [app/(dashboard)/dashboard/orders/page.tsx](../app/(dashboard)/dashboard/orders/page.tsx) renders `OrdersList` with the fetched data; the client component handles transitions.
- Status transition API: `/api/orders/update-status` POST — [app/api/orders/update-status/route.ts](../app/api/orders/update-status/route.ts)
  - Valid `nextStatus`: `PLACED` → `PREPARING` → `READY` → `OUT_FOR_DELIVERY` → `DELIVERED` (forward-only guard).
  - Updates `status` in Supabase; rejects unknown transitions.
- Start delivery special-case: if a card is `READY`, the UI calls `/api/orders/start-delivery` (see below) instead of `update-status`.

## Delivery start & OTP completion
- Start delivery API: `/api/orders/start-delivery` POST — [app/api/orders/start-delivery/route.ts](../app/api/orders/start-delivery/route.ts)
  - Validates payload (`orderId`), checks current `status` is `READY`.
  - Sets `status` = `OUT_FOR_DELIVERY`, stamps `delivery_started_at` (now), `estimated_delivery_time` (now + 30m), generates a 4-digit `otp`, resets `otp_verified`.
- Delivery list server action: `getDeliveryOrders` — [app/(dashboard)/delivery/actions.ts](../app/(dashboard)/delivery/actions.ts)
  - Reads Supabase `orders` where status in (`READY`, `OUT_FOR_DELIVERY`); normalizes status and dates.
- Delivery UI: [app/(dashboard)/delivery/page.tsx](../app/(dashboard)/delivery/page.tsx) and [app/(dashboard)/delivery/_components/DeliveryCard.tsx](../app/(dashboard)/delivery/_components/DeliveryCard.tsx)
  - Shows ready/out-for-delivery orders, allows starting delivery, displays progress/ETA, and opens OTP modal.
- OTP verification API: `/api/orders/verify-otp` POST — [app/api/orders/verify-otp/route.ts](../app/api/orders/verify-otp/route.ts)
  - Validates payload (`orderId`, `otp`), requires `status` = `OUT_FOR_DELIVERY`.
  - Confirms `otp` matches; sets `status` = `DELIVERED` and `otp_verified` = true.

## Public fetch API (list)
- `/api/orders` GET — [app/api/orders/route.ts](../app/api/orders/route.ts) returns latest 50 orders directly from Supabase, ordered by `created_at` desc.

## Operational notes
- Supabase admin client is used on the server with `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
- Prisma is currently bypassed for order/delivery flows to avoid schema drift with the Supabase `orders` table.
- Date handling: server actions convert free-form text dates to ISO when possible; invalid dates are null to avoid `Invalid time value` during SSR.
- Status normalization handles legacy values (`pending` → `PLACED`, `completed` → `DELIVERED`).

## End-to-end lifecycle
1) n8n (or another source) POSTs to `/api/webhooks/n8n` with order details → row created in `orders` (status `pending`).
2) Dashboard fetch (`getOrdersForUser`) normalizes status to `PLACED` and displays the card.
3) Operator advances status via `update-status` (PLACED → PREPARING → READY).
4) From READY, operator clicks Start Delivery → `/api/orders/start-delivery` stamps timestamps, generates OTP, moves to `OUT_FOR_DELIVERY`.
5) Delivery view shows live card; OTP modal POSTs to `/api/orders/verify-otp` → marks `DELIVERED` + `otp_verified`.
6) Delivered orders drop out of the delivery list; they remain in the orders list as `DELIVERED`.
