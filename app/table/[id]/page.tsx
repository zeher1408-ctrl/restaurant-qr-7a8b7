"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Dish = {
  id: number; name: string; description: string; price: number;
  allergens: string[]; spice_level: number; sizes: string[];
};
type CartItem = {
  dishId: number; dishName: string; size: string | null; qty: number; unitPrice: number;
};

const SPICE = ["🟢 Mild", "🟡 Medium", "🔴 Hot", "🔥 Extra Hot"];

export default function TablePage({ params }: { params: { id: string } }) {
  const tableId = Number(params.id);
  const { data: dishes } = useSWR<Dish[]>("/api/dishes", fetcher);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [callSent, setCallSent] = useState<string | null>(null);
  const [bill, setBill] = useState<any>(null);
  const [splitCount, setSplitCount] = useState(1);
  const [tipPct, setTipPct] = useState(0);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewDone, setReviewDone] = useState(false);

  // Poll order status every 3s while there's an active order
  useEffect(() => {
    if (!orderId) return;
    const iv = setInterval(async () => {
      const res = await fetch(`/api/orders?tableId=${tableId}`);
      const orders = await res.json();
      const o = orders.find((x: any) => x.id === orderId);
      if (o) setOrderStatus(o.status);
    }, 3000);
    return () => clearInterval(iv);
  }, [orderId, tableId]);

  const addToCart = (dish: Dish, size: string | null) => {
    setCart(prev => {
      const existing = prev.find(c => c.dishId === dish.id && c.size === size);
      if (existing) {
        return prev.map(c =>
          c.dishId === dish.id && c.size === size ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { dishId: dish.id, dishName: dish.name, size, qty: 1, unitPrice: dish.price }];
    });
  };

  const removeFromCart = (dishId: number, size: string | null) => {
    setCart(prev => prev.filter(c => !(c.dishId === dishId && c.size === size)));
  };

  const placeOrder = async () => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId, items: cart }),
    });
    const { orderId: id } = await res.json();
    setOrderId(id);
    setOrderStatus("NEW");
    setCart([]);
  };

  const callWaiter = async (type: string) => {
    await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId, type }),
    });
    setCallSent(type);
    setTimeout(() => setCallSent(null), 3000);
  };

  const loadBill = async () => {
    if (!orderId) return;
    const res = await fetch(`/api/bill/${orderId}`);
    setBill(await res.json());
  };

  const submitReview = async () => {
    if (!reviewRating) return;
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId, orderId, rating: reviewRating }),
    });
    setReviewDone(true);
  };

  const cartTotal = cart.reduce((s, c) => s + c.unitPrice * c.qty, 0);

  const statusEmoji: Record<string, string> = {
    NEW: "🆕 Order placed — waiting for kitchen",
    COOKING: "🔥 Your food is cooking",
    READY: "✅ Your food is ready!",
    SERVED: "🍽️ Enjoy your meal!",
  };

  return (
    <main className="max-w-lg mx-auto p-4 pb-32">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Table {tableId}</h1>
        <p className="text-gray-500">Scan. Order. Eat.</p>
      </header>

      {/* TODAY'S SPECIAL */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
        <p className="font-semibold text-amber-800">🌟 Today&apos;s Special</p>
        <p className="text-amber-700">Gulab Jamun — Rs 450</p>
      </div>

      {/* MENU */}
      <section className="space-y-3 mb-6">
        <h2 className="text-lg font-semibold border-b pb-1">Menu</h2>
        {dishes?.map(d => (
          <div key={d.id} className="border rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{d.name}</h3>
                <p className="text-sm text-gray-500">{d.description}</p>
                <p className="text-sm mt-1">
                  {d.allergens?.length ? `⚠️ ${d.allergens.join(", ")}` : ""}
                  {d.spice_level > 0 ? ` · ${SPICE[d.spice_level]}` : ""}
                </p>
              </div>
              <span className="font-semibold whitespace-nowrap ml-2">Rs {d.price}</span>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {d.sizes?.length ? (
                d.sizes.map(sz => (
                  <button key={sz} onClick={() => addToCart(d, sz)}
                    className="bg-blue-600 text-white text-sm px-3 py-1 rounded">
                    Add {sz}
                  </button>
                ))
              ) : (
                <button onClick={() => addToCart(d, null)}
                  className="bg-blue-600 text-white text-sm px-3 py-1 rounded">
                  Add to order
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* CART */}
      {cart.length > 0 && (
        <section className="border-t pt-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Your Order</h2>
          <ul className="space-y-1">
            {cart.map(c => (
              <li key={`${c.dishId}-${c.size}`} className="flex justify-between items-center">
                <span>{c.dishName} {c.size ? `(${c.size})` : ""} × {c.qty}</span>
                <span className="flex items-center gap-2">
                  Rs {c.unitPrice * c.qty}
                  <button onClick={() => removeFromCart(c.dishId, c.size)}
                    className="text-red-500 text-sm">✕</button>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-bold mt-2 pt-2 border-t">
            <span>Total</span><span>Rs {cartTotal}</span>
          </div>
          <button onClick={placeOrder}
            className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg font-semibold">
            Place Order
          </button>
        </section>
      )}

      {/* LIVE STATUS */}
      {orderStatus && (
        <section className="bg-stone-100 rounded-lg p-4 mb-6 text-center">
          <p className="text-lg">{statusEmoji[orderStatus] ?? orderStatus}</p>
        </section>
      )}

      {/* CALL WAITER */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Need Something?</h2>
        {callSent && <p className="text-green-600 mb-2 text-sm">✓ {callSent} request sent!</p>}
        <div className="flex gap-2">
          <button onClick={() => callWaiter("water")}
            className="flex-1 border rounded py-2 hover:bg-stone-100">💧 Water</button>
          <button onClick={() => callWaiter("bill")}
            className="flex-1 border rounded py-2 hover:bg-stone-100">🧾 Bill</button>
          <button onClick={() => callWaiter("help")}
            className="flex-1 border rounded py-2 hover:bg-stone-100">🙋 Help</button>
        </div>
      </section>

      {/* BILL */}
      {orderId && orderStatus === "SERVED" && !bill && (
        <button onClick={loadBill}
          className="w-full border rounded-lg py-2 mb-6 font-semibold hover:bg-stone-100">
          View Bill
        </button>
      )}

      {bill && (
        <section className="border rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Bill — Order #{bill.orderId}</h2>
          <ul className="space-y-1 text-sm">
            {bill.items.map((it: any, i: number) => (
              <li key={i} className="flex justify-between">
                <span>{it.dish_name} {it.size ? `(${it.size})` : ""} × {it.quantity}</span>
                <span>Rs {it.total_price}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-bold mt-2 pt-2 border-t">
            <span>Total</span><span>Rs {bill.total}</span>
          </div>

          {/* Split */}
          <div className="mt-3">
            <p className="text-sm font-medium mb-1">Split bill</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => setSplitCount(n)}
                  className={`flex-1 border rounded py-1 text-sm ${splitCount === n ? "bg-blue-600 text-white" : ""}`}>
                  {n === 1 ? "Whole" : `${n} ways`}
                </button>
              ))}
            </div>
            {splitCount > 1 && (
              <p className="text-sm mt-1 text-gray-600">
                Rs {Math.ceil(bill.total / splitCount)} each
              </p>
            )}
          </div>

          {/* Tip */}
          <div className="mt-3">
            <p className="text-sm font-medium mb-1">Add tip</p>
            <div className="flex gap-2">
              {[0, 5, 10, 15].map(pct => (
                <button key={pct} onClick={() => setTipPct(pct)}
                  className={`flex-1 border rounded py-1 text-sm ${tipPct === pct ? "bg-blue-600 text-white" : ""}`}>
                  {pct === 0 ? "None" : `${pct}%`}
                </button>
              ))}
            </div>
            {tipPct > 0 && (
              <p className="text-sm mt-1 text-gray-600">
                Tip: Rs {Math.round(bill.total * tipPct / 100)} ·
                Grand total: Rs {bill.total + Math.round(bill.total * tipPct / 100)}
              </p>
            )}
          </div>

          {/* Pay (placeholder — Stripe wired later) */}
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Pay with</p>
            <div className="grid grid-cols-2 gap-2">
              {["💵 Cash", "🏦 Bank Transfer", "💳 Card", "📱 Apple / Google Pay"].map(m => (
                <button key={m} className="border rounded py-2 text-sm hover:bg-stone-100">
                  {m}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REVIEW */}
      {bill && !reviewDone && (
        <section className="border rounded-lg p-4 mb-6 text-center">
          <h2 className="font-semibold mb-2">Leave a Review</h2>
          <div className="flex justify-center gap-1 text-3xl mb-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setReviewRating(n)}
                className={n <= reviewRating ? "text-yellow-400" : "text-gray-300"}>
                ★
              </button>
            ))}
          </div>
          <button onClick={submitReview}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold">
            Submit
          </button>
        </section>
      )}
      {reviewDone && (
        <p className="text-center text-green-600 font-medium">Thank you for your review! 🎉</p>
      )}

      {/* Wi-Fi hint */}
      <footer className="text-center text-xs text-gray-400 mt-8">
        📶 Wi-Fi: <span className="font-mono">Table-Guest</span> · No password
      </footer>
    </main>
  );
}
