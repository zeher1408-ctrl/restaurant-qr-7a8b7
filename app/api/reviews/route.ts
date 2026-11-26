import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST: submit a review after payment
export async function POST(request: Request) {
  const { tableId, orderId, rating, comment } = await request.json();
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating 1-5 required" }, { status: 400 });
  }
  await query(
    `INSERT INTO reviews (table_id, order_id, rating, comment) VALUES ($1,$2,$3,$4)`,
    [tableId, orderId, rating, comment || null]
  );
  return NextResponse.json({ ok: true });
}

// GET: list reviews
export async function GET() {
  const { rows } = await query(
    `SELECT r.*, t.number AS table_number
     FROM reviews r
     LEFT JOIN tables t ON r.table_id = t.id
     ORDER BY r.created_at DESC LIMIT 50`
  );
  return NextResponse.json(rows);
}
