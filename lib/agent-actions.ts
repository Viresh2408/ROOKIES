import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getDashboardStats(businessId: string) {
  const allOrders = await prisma.order.findMany({
    where: { business_id: businessId },
    select: {
      id: true,
      total_amount: true,
      status: true,
      created_at: true
    }
  });

  const orderCount = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const pendingCount = allOrders.filter((o) => o.status === "pending" || o.status === "PLACED").length;
  
  // Today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = allOrders.filter(o => new Date(o.created_at) >= today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return {
    orderCount,
    totalRevenue,
    pendingCount,
    todayOrderCount: todayOrders.length,
    todayRevenue
  };
}

export async function getInventoryItems(businessId: string, filter: 'low' | 'all' = 'all') {
  console.log(`[agent-actions] getInventoryItems for biz: ${businessId}, filter: ${filter}`);
  const where: any = { businessId };
  if (filter === 'low') {
    where.quantity = { lte: 10 }; // items with 10 or fewer units in stock
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { name: 'asc' }
  });

  console.log(`[agent-actions] Found ${items.length} items for business ${businessId}`);
  if (items.length === 0) {
    const totalCount = await prisma.inventoryItem.count();
    console.log(`[agent-actions] TOTAL items in DB: ${totalCount}`);
  }

  return items.map(i => ({
    id: i.id,
    name: i.name,
    sku: i.sku ?? null,
    quantity: i.quantity,
    unit: i.unit,
    costPrice: Number(i.costPrice) || 0,
    price: Number(i.sellPrice) || 0,
    lowStockAt: i.lowStockAt ?? null,
  }));
}

export async function getTopCustomers(businessId: string, limit: number = 5) {
  const orders = await prisma.order.findMany({
    where: { business_id: businessId },
    select: {
      customer_name: true,
      customer_phone: true,
      total_amount: true,
    }
  });

  const customerMap = new Map<string, { name: string, spent: number, count: number }>();
  for (const o of orders) {
    const id = o.customer_phone || o.customer_name || 'Unknown';
    const existing = customerMap.get(id);
    const amount = Number(o.total_amount) || 0;
    if (existing) {
      existing.spent += amount;
      existing.count += 1;
    } else {
      customerMap.set(id, { name: o.customer_name || 'Unknown', spent: amount, count: 1 });
    }
  }

  return Array.from(customerMap.values())
    .sort((a, b) => b.spent - a.spent)
    .slice(0, limit);
}

export async function createOrder(businessId: string, data: any) {
  const { customerName, customerPhone, items, totalAmount, notes } = data;

  // Find or create customer
  let customer = await prisma.customer.findFirst({
    where: { businessId, phone: customerPhone }
  });

  if (!customer && (customerName || customerPhone)) {
    customer = await prisma.customer.create({
      data: {
        businessId,
        name: customerName || 'Voice Customer',
        phone: customerPhone,
      }
    });
  }

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        business_id: businessId,
        customer_id: customer?.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        items: items,
        total_amount: new Prisma.Decimal(totalAmount),
        note: notes,
        source: "voice_agent",
        status: "PLACED",
      }
    });

    // Deduct inventory
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.id) {
          await tx.inventoryItem.update({
            where: { id: item.id },
            data: {
              quantity: {
                decrement: item.quantity || 1
              }
            }
          });
        }
      }
    }

    return newOrder;
  });

  return order;
}

export async function updateOrderStatus(orderId: string, status: string) {
  return await prisma.order.update({
    where: { id: orderId },
    data: { status }
  });
}

export async function createInventoryItem(businessId: string, data: any) {
  return await prisma.inventoryItem.create({
    data: {
      businessId,
      name: data.name,
      sku: data.sku ?? null,
      sellPrice: data.price != null ? new Prisma.Decimal(data.price) : null,
      costPrice: data.costPrice != null ? new Prisma.Decimal(data.costPrice) : null,
      quantity: data.stock ?? 0,
      unit: data.unit ?? 'units',
      lowStockAt: data.lowStockAt ?? null,
    }
  });
}

export async function updateInventoryItem(itemId: string, data: any) {
  const updateData: any = {};
  if (data.price !== undefined) updateData.sellPrice = new Prisma.Decimal(data.price);
  if (data.stock !== undefined) updateData.quantity = data.stock;
  if (data.name !== undefined) updateData.name = data.name;

  return await prisma.inventoryItem.update({
    where: { id: itemId },
    data: updateData
  });
}

export async function deleteInventoryItem(itemId: string) {
  return await prisma.inventoryItem.delete({
    where: { id: itemId }
  });
}

export async function createCustomer(businessId: string, data: any) {
  return await prisma.customer.create({
    data: {
      businessId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      notes: data.notes,
    }
  });
}
