import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(
  request: Request,
  { params }: { params: { tableId: string } }
) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const base = process.env.NEXT_PUBLIC_BASE_URL || (host ? `${proto}://${host}` : "http://localhost:3000");
  const url = `${base}/table/${params.tableId}`;
  const svg = await QRCode.toString(url, { type: "svg", width: 300 });

  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
