import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  const { rows } = await query(`SELECT * FROM dishes ORDER BY id ASC`);
  return NextResponse.json(rows);
}

// PATCH: update dish price or name
export async function PATCH(request: Request) {
  const { id, price, name } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Dish id required" }, { status: 400 });
  }
  if (price !== undefined) {
    await query(`UPDATE dishes SET price = $1 WHERE id = $2`, [price, id]);
  }
  if (name !== undefined) {
    await query(`UPDATE dishes SET name = $1 WHERE id = $2`, [name, id]);
  }
  return NextResponse.json({ ok: true });
}

// POST: create a new dish
export async function POST(request: Request) {
  const { name, description, price, allergens, spice_level, sizes } = await request.json();
  if (!name || !price) {
    return NextResponse.json({ error: "Name and price required" }, { status: 400 });
  }
  const { rows } = await query(
    `INSERT INTO dishes (name, description, price, allergens, spice_level, sizes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [name, description || "", price, allergens || [], spice_level || 0, sizes || []]
  );
  return NextResponse.json({ id: rows[0].id });
}
