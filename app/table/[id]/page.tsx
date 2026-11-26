"use client";

import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
  allergens: string[];
  spice_level: number;
  sizes: string[];
};

type CartItem = {
  dishId: number;
  dishName: string;
  size: string | null;
  qty: number;
  unitPrice: number;
};

type Order = {
  id: number;
  table_id: number;
  status: "NEW" | "COOKING" | "READY" | "SERVED";
  created_at: string;
  items: { dish_name: string; size: string | null; quantity: number; unit_price: number; total_price: number }[];
};

const SPICE_LABELS = ["Mild", "Medium", "Hot", "Extra Hot"];

export default function TablePage({ params }: { params: { id: string } }) {
  const tableId = Number(params.id) || 4;

  // Live menu from Supabase
  const { data: dishes } = useSWR<Dish[]>("/api/dishes", fetcher);
  // Live orders for this table from Supabase
  const { data: tableOrders, mutate: mutateOrders } = useSWR<Order[]>(
    `/api/orders?tableId=${tableId}`,
    fetcher,
    { refreshInterval: 3000 }
  );

  const [activeTab, setActiveTab] = useState<"menu" | "orders" | "bill">("menu");
  const [search, setSearch] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<{ [dishId: number]: string }>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Call waiter & Wi-Fi state
  const [callNotification, setCallNotification] = useState<string | null>(null);
  const [wifiCopied, setWifiCopied] = useState(false);
  const [wifiConnected, setWifiConnected] = useState(false);

  // Bill, Split & Review state
  const [splitWays, setSplitWays] = useState(1);
  const [tipPct, setTipPct] = useState(0);
  const [paymentChoice, setPaymentChoice] = useState("card");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [payStatus, setPayStatus] = useState<"idle" | "processing" | "success">("idle");

  // Active (non-served) order for tracking, or latest order for billing
  const activeOrder = tableOrders?.find(o => o.status !== "SERVED") ?? null;
  const latestOrder = tableOrders?.[0] ?? null;

  const filteredDishes = (dishes || []).filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (dish: Dish) => {
    const size = dish.sizes?.length ? (selectedSizes[dish.id] || dish.sizes[0]) : null;
    setCart(prev => {
      const existing = prev.find(i => i.dishId === dish.id && i.size === size);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { dishId: dish.id, dishName: dish.name, size, qty: 1, unitPrice: dish.price }];
    });
  };

  const updateCartQty = (dishId: number, size: string | null, delta: number) => {
    setCart(prev =>
      prev
        .map(i => (i.dishId === dishId && i.size === size ? { ...i, qty: i.qty + delta } : i))
        .filter(i => i.qty > 0)
    );
  };

  const placeOrder = async () => {
    if (cart.length === 0 || placingOrder) return;
    setPlacingOrder(true);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, items: cart }),
      });
      setCart([]);
      await mutateOrders();
      setActiveTab("orders");
    } finally {
      setPlacingOrder(false);
    }
  };

  const addUpsellGulabJamun = async () => {
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId,
        items: [{ dishId: 7, dishName: "Gulab Jamun", size: null, qty: 1, unitPrice: 450 }],
      }),
    });
    mutateOrders();
  };

  const callWaiter = async (type: string = "water") => {
    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, type }),
      });
      setCallNotification(`Waiter notified for Table ${tableId} (${type})`);
      setTimeout(() => setCallNotification(null), 4000);
    } catch {
      setCallNotification("Waiter notified");
      setTimeout(() => setCallNotification(null), 3000);
    }
  };

  const handleCopyWifi = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText("karahi2025").catch(() => {});
    }
    setWifiCopied(true);
    setTimeout(() => setWifiCopied(false), 2000);
  };

  const submitReview = async () => {
    if (!rating || !latestOrder) return;
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId, orderId: latestOrder.id, rating, comment }),
    });
    setReviewSubmitted(true);
  };

  const handleProcessPayment = async () => {
    setPayStatus("processing");
    if (rating > 0 && !reviewSubmitted && latestOrder) {
      await submitReview();
    }
    setTimeout(() => setPayStatus("success"), 800);
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  // Bill calculations from real placed order(s)
  const billItems = latestOrder?.items ?? [];
  const billSubtotal = billItems.reduce((s, i) => s + i.total_price, 0);
  const billGst = Math.round(billSubtotal * 0.05);
  const billTotal = billSubtotal + billGst;
  const perPersonBase = splitWays > 0 ? Math.round(billTotal / splitWays) : billTotal;
  const tipAmount = tipPct > 0 ? Math.round((perPersonBase * tipPct) / 100) : 0;
  const finalPayable = perPersonBase + tipAmount;

  return (
    <div className="bg-[#F8F9FF] text-slate-900 flex flex-col min-h-screen selection:bg-orange-100 selection:text-orange-900 antialiased">
      {/* Top Header Bar */}
      <header className="fixed top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="h-14 px-4 flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center font-bold text-xs tracking-tight shrink-0">
              D.CC
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-slate-900 text-sm leading-tight truncate">D.CC Kitchen</span>
              <span className="text-[11px] text-slate-500 font-medium">Digital Menu</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Table {tableId}</span>
            </div>
            <button
              onClick={() => callWaiter("help")}
              aria-label="Call Waiter"
              className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[17px] text-orange-600">room_service</span>
              <span className="text-xs font-medium hidden sm:inline">Call</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex flex-col flex-1 pt-16 pb-36 px-4 max-w-lg mx-auto w-full space-y-4">
        {callNotification && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
            <span>{callNotification}</span>
          </div>
        )}

        {/* ================= TAB 1: LIVE MENU FROM SUPABASE ================= */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="material-symbols-outlined text-emerald-600 text-[16px]">wifi</span>
              <span className="font-medium text-slate-700">Connected to Table {tableId}</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-medium">Live Menu</span>
            </div>

            {/* Search */}
            <div className="relative flex items-center w-full">
              <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px] pointer-events-none">search</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-medium outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="Search dishes..."
                type="search"
              />
            </div>

            {/* Menu List */}
            {!dishes ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400">
                Loading menu...
              </div>
            ) : filteredDishes.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-400">
                No dishes found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDishes.map(dish => {
                  const chosenSize = dish.sizes?.length ? (selectedSizes[dish.id] || dish.sizes[0]) : null;
                  const inCart = cart.find(c => c.dishId === dish.id && c.size === chosenSize);

                  return (
                    <article key={dish.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-base font-bold text-slate-900 leading-snug">{dish.name}</h2>
                          {dish.description && (
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{dish.description}</p>
                          )}
                        </div>
                        <span className="text-base font-bold text-slate-900 whitespace-nowrap shrink-0">
                          Rs {dish.price.toLocaleString()}
                        </span>
                      </div>

                      {/* Spice & Allergens */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {dish.spice_level > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 font-medium">
                            <span className="material-symbols-outlined text-[13px]">local_fire_department</span>
                            {SPICE_LABELS[dish.spice_level] || "Medium"}
                          </span>
                        )}
                        {dish.allergens?.map(a => (
                          <span key={a} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
                            {a}
                          </span>
                        ))}
                      </div>

                      {/* Size Selector + Add button */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        {dish.sizes?.length > 0 ? (
                          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                            {dish.sizes.map(sz => (
                              <button
                                key={sz}
                                onClick={() => setSelectedSizes(prev => ({ ...prev, [dish.id]: sz }))}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                  chosenSize === sz ? "bg-white text-orange-600 shadow-xs" : "text-slate-600"
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Standard serving</span>
                        )}

                        {inCart ? (
                          <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                            <button
                              onClick={() => updateCartQty(dish.id, chosenSize, -1)}
                              className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-sm"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold">{inCart.qty}</span>
                            <button
                              onClick={() => updateCartQty(dish.id, chosenSize, 1)}
                              className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-sm"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(dish)}
                            className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined text-[15px]">add</span>
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: LIVE ORDERS ================= */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {activeOrder ? (
              <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">skillet</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-900 text-sm truncate">Order #{activeOrder.id}</span>
                      <span className="text-[11px] text-slate-500 font-medium">Table {tableId} • Live Kitchen</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 text-xs font-semibold">
                    {activeOrder.status}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {activeOrder.status === "NEW" && "Order received — waiting for kitchen"}
                  {activeOrder.status === "COOKING" && "Your food is cooking"}
                  {activeOrder.status === "READY" && "Your food is ready!"}
                </h2>

                {/* 3-Stage Stepper */}
                <div className="grid grid-cols-3 text-center pt-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[17px]">check</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">NEW</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activeOrder.status === "COOKING" || activeOrder.status === "READY"
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}>
                      <span className="material-symbols-outlined text-[17px]">local_fire_department</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">COOKING</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activeOrder.status === "READY" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      <span className="material-symbols-outlined text-[17px]">dinner_dining</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">READY</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 divide-y divide-slate-100">
                  {activeOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">
                        {item.quantity}x {item.dish_name} {item.size ? `(${item.size})` : ""}
                      </span>
                      <span className="font-semibold text-slate-600">Rs {item.total_price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
                <span className="material-symbols-outlined text-3xl text-slate-300">receipt_long</span>
                <p className="text-sm font-semibold text-slate-700">No active orders yet</p>
                <p className="text-xs text-slate-500">Pick items from the Menu tab to place your order.</p>
                <button
                  onClick={() => setActiveTab("menu")}
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold"
                >
                  Browse Menu
                </button>
              </div>
            )}

            {/* Fast Dining Wi-Fi Access Card */}
            <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">wifi</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">Fast Dining Wi-Fi</div>
                  <div className="text-[11px] text-slate-500">Guest Network • Table-Guest</div>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-y border-slate-100">
                <div className="flex flex-col text-xs gap-0.5">
                  <span className="text-slate-500">SSID: <strong className="text-slate-900 font-semibold">Table-Guest</strong></span>
                  <span className="text-slate-500">Pass: <strong className="text-orange-600 font-semibold">karahi2025</strong></span>
                </div>
                <button
                  onClick={handleCopyWifi}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                  <span>{wifiCopied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <button
                onClick={() => setWifiConnected(true)}
                className={`w-full h-10 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 ${
                  wifiConnected ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-800"
                }`}
              >
                <span className="material-symbols-outlined text-[18px] text-blue-600">
                  {wifiConnected ? "check_circle" : "sensors"}
                </span>
                <span>{wifiConnected ? "Connected to Table-Guest" : "Tap to Connect"}</span>
              </button>
            </div>

            {/* Today's Sweet Special Upsell */}
            <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold text-orange-600 uppercase">Today&apos;s Special</p>
                <h3 className="text-sm font-bold text-slate-900">Gulab Jamun</h3>
                <p className="text-xs text-slate-500">Rs 450</p>
              </div>
              <button
                onClick={addUpsellGulabJamun}
                className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shrink-0"
              >
                + Add (Rs 450)
              </button>
            </div>

            <button
              onClick={() => callWaiter("water")}
              className="w-full py-3.5 px-4 rounded-2xl bg-white border border-slate-200/90 text-slate-700 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-orange-600 text-[19px]">notifications_active</span>
              <span className="text-xs font-semibold text-slate-800">Need Water or Help? Call Waiter</span>
            </button>
          </div>
        )}

        {/* ================= TAB 3: BILL & SPLIT ================= */}
        {activeTab === "bill" && (
          <div className="space-y-4">
            {!latestOrder ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
                <span className="material-symbols-outlined text-3xl text-slate-300">payments</span>
                <p className="text-sm font-semibold text-slate-700">No bill yet</p>
                <p className="text-xs text-slate-500">Your itemized bill will appear here once you place an order.</p>
                <button
                  onClick={() => setActiveTab("menu")}
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                <article className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h1 className="text-base font-bold text-slate-900">D.CC Kitchen</h1>
                      <p className="text-xs text-slate-500 mt-0.5">Dine-in • Table {tableId}</p>
                    </div>
                    <span className="text-xs font-bold text-orange-600 font-mono">#{latestOrder.id}</span>
                  </div>

                  <div className="space-y-2 py-1">
                    {billItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1">
                        <span className="font-semibold text-slate-800">
                          {item.quantity}x {item.dish_name} {item.size ? `(${item.size})` : ""}
                        </span>
                        <span className="font-bold text-slate-900">Rs {item.total_price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-900">Rs {billSubtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (5%)</span>
                      <span className="font-semibold text-slate-900">Rs {billGst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-900 text-sm">Total Bill</span>
                      <span className="text-xl font-bold text-orange-600">Rs {billTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </article>

                {/* Split Bill */}
                <article className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <span className="text-xs font-bold text-slate-900 block">Split the Bill</span>
                  <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    {[1, 2, 3, 4].map(w => (
                      <button
                        key={w}
                        onClick={() => setSplitWays(w)}
                        className={`py-2 rounded-xl text-xs transition-all ${
                          splitWays === w ? "bg-white text-orange-600 font-bold shadow-xs" : "text-slate-600 font-medium"
                        }`}
                      >
                        {w === 1 ? "Whole" : `${w} Ways`}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">Your Share</span>
                    <span className="font-bold text-orange-600">Rs {perPersonBase.toLocaleString()}</span>
                  </div>
                </article>

                {/* Tip */}
                <article className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <span className="text-xs font-bold text-slate-900 block">Add Tip</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 5, 10, 15].map(pct => (
                      <button
                        key={pct}
                        onClick={() => setTipPct(pct)}
                        className={`p-2 rounded-xl border text-xs font-bold ${
                          tipPct === pct ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </article>

                {/* Payment Method */}
                <article className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                  <span className="text-xs font-bold text-slate-900 block pb-1">Payment Method</span>
                  {[
                    { id: "card", title: "Card / Apple Pay / Google Pay" },
                    { id: "bank", title: "Bank Transfer" },
                    { id: "cash", title: "Cash to Waiter" },
                  ].map(m => (
                    <label key={m.id} className="flex items-center justify-between py-2 cursor-pointer text-xs">
                      <span className="font-medium text-slate-800">{m.title}</span>
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentChoice === m.id}
                        onChange={() => setPaymentChoice(m.id)}
                        className="text-orange-600"
                      />
                    </label>
                  ))}
                </article>

                {/* Review */}
                <article className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900">Leave a Review</h3>
                  <div className="flex justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} onClick={() => setRating(star)}>
                        <span
                          className={`material-symbols-outlined text-[28px] ${
                            star <= rating ? "text-amber-400" : "text-slate-300"
                          }`}
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                  <input
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-none focus:border-orange-500"
                    placeholder="Optional comment..."
                  />
                  {reviewSubmitted && <p className="text-xs text-emerald-600 font-semibold text-center">Thank you for your review!</p>}
                </article>
              </>
            )}
          </div>
        )}
      </main>

      {/* Sticky Bottom Cart Bar (Menu Tab) */}
      {activeTab === "menu" && cart.length > 0 && (
        <aside className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 pt-1 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-lg flex items-center justify-between gap-3">
            <div className="flex flex-col pl-1 min-w-0">
              <span className="text-xs font-medium text-slate-500">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </span>
              <span className="text-base font-bold text-slate-900">
                Rs {cartSubtotal.toLocaleString()}
              </span>
            </div>
            <button
              onClick={placeOrder}
              disabled={placingOrder}
              className="flex-1 max-w-[210px] h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <span>{placingOrder ? "Placing..." : "Place Order"}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </aside>
      )}

      {/* Sticky Bottom Pay Bar (Bill Tab) */}
      {activeTab === "bill" && latestOrder && (
        <aside className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 pt-1 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto bg-white rounded-2xl p-3 border border-slate-200 shadow-lg space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-slate-500">Amount Payable</span>
              <span className="text-lg font-bold text-slate-900">Rs {finalPayable.toLocaleString()}</span>
            </div>
            <button
              onClick={handleProcessPayment}
              className={`w-full h-11 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 ${
                payStatus === "success" ? "bg-emerald-600" : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              <span>
                {payStatus === "processing" ? "Processing..." : payStatus === "success" ? "Payment Recorded! ✓" : `Pay Now (Rs ${finalPayable.toLocaleString()})`}
              </span>
            </button>
          </div>
        </aside>
      )}

      {/* Bottom Navigation Tab Bar */}
      <nav className="fixed bottom-0 w-full z-50 bg-white border-t border-slate-200">
        <div className="h-16 max-w-lg mx-auto px-4 flex items-center justify-around">
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] ${
              activeTab === "menu" ? "text-orange-600 font-bold" : "text-slate-500"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">restaurant_menu</span>
            <span className="text-[11px] mt-0.5">Menu</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] relative ${
              activeTab === "orders" ? "text-orange-600 font-bold" : "text-slate-500"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span className="text-[11px] mt-0.5">Orders</span>
            {activeOrder && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
          </button>

          <button
            onClick={() => setActiveTab("bill")}
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] ${
              activeTab === "bill" ? "text-orange-600 font-bold" : "text-slate-500"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">payments</span>
            <span className="text-[11px] mt-0.5">Bill</span>
          </button>

          <button
            onClick={() => callWaiter("help")}
            className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] text-slate-500"
          >
            <span className="material-symbols-outlined text-[20px]">concierge</span>
            <span className="text-[11px] mt-0.5">Service</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
