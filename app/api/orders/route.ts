import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST: create order
export async function POST(request: Request) {
  const { tableId, items, guestName, guestPhone, notes } = await request.json();
  // items = [{ dishId, dishName, size, qty, unitPrice }]

  if (!tableId || !items?.length) {
    return NextResponse.json({ error: "tableId and items required" }, { status: 400 });
  }
  if (!guestName?.trim() || !guestPhone?.trim()) {
    return NextResponse.json({ error: "Guest name and phone number required" }, { status: 400 });
  }

  const { rows } = await query(
    `INSERT INTO orders (table_id, guest_name, guest_phone, notes) VALUES ($1, $2, $3, $4) RETURNING id`,
    [tableId, guestName.trim(), guestPhone.trim(), notes?.trim() || null]
  );
  const orderId = rows[0].id;

  for (const it of items) {
    await query(
      `INSERT INTO order_items (order_id, dish_id, dish_name, size, quantity, unit_price, total_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [orderId, it.dishId, it.dishName, it.size || null, it.qty, it.unitPrice, it.unitPrice * it.qty]
    );
  }

  return NextResponse.json({ orderId });
}

// GET: list orders, optionally filter by ?status= or ?tableId=
export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const tableId = url.searchParams.get("tableId");

  let sql = `SELECT o.*, t.number AS table_number FROM orders o JOIN tables t ON o.table_id = t.id WHERE 1=1`;
  const params: any[] = [];

  if (status) {
    params.push(status);
    sql += ` AND o.status = $${params.length}`;
  }
  if (tableId) {
    params.push(tableId);
    sql += ` AND o.table_id = $${params.length}`;
  }

  sql += ` ORDER BY o.created_at DESC`;

  const { rows: orders } = await query(sql, params);

  // Attach items to each order
  for (const o of orders) {
    const { rows: items } = await query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [o.id]
    );
    o.items = items;
  }

  return NextResponse.json(orders);
}

// PATCH: update order status
export async function PATCH(request: Request) {
  const { orderId, status } = await request.json();
  const valid = ["NEW", "COOKING", "READY", "SERVED"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  await query(`UPDATE orders SET status = $1 WHERE id = $2`, [status, orderId]);
  return NextResponse.json({ ok: true });
}
