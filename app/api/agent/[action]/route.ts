import { NextResponse } from "next/server";
import * as actions from "@/lib/agent-actions";

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  try {
    const { action } = await params;
    const secret = req.headers.get('x-agent-secret');
    if (secret !== process.env.ROOKIES_AGENT_SECRET) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await req.json();
    const { businessId, ...rest } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
    }

    const HANDLERS: Record<string, (bizId: string, data: any) => Promise<any>> = {
      'dashboard-stats': (bizId) => actions.getDashboardStats(bizId),
      'inventory': (bizId, data) => actions.getInventoryItems(bizId, data.filter),
      'top-customers': (bizId, data) => actions.getTopCustomers(bizId, data.limit),
      'create-order': (bizId, data) => actions.createOrder(bizId, data),
      'update-order': (bizId, data) => actions.updateOrderStatus(data.orderId, data.status),
      'add-inventory': (bizId, data) => actions.createInventoryItem(bizId, data),
      'update-inventory': (bizId, data) => actions.updateInventoryItem(data.itemId, data.data),
      'delete-inventory': (bizId, data) => actions.deleteInventoryItem(data.itemId),
      'add-customer': (bizId, data) => actions.createCustomer(bizId, data),
      'menu': (bizId) => actions.getInventoryItems(bizId, 'all'),
    };

    const handler = HANDLERS[action];
    if (!handler) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const result = await handler(businessId, rest);
    console.log(`[api/agent/${action}] result length:`, Array.isArray(result) ? result.length : 'N/A');
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[agent/${params.action}] error:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
