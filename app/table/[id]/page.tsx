"use client";

import { useState, useEffect } from "react";
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

type OrderItem = {
  dishId: number;
  dishName: string;
  size: string | null;
  qty: number;
  unitPrice: number;
};

export default function TablePage({ params }: { params: { id: string } }) {
  const tableId = Number(params.id) || 4;
  const { data: dishes } = useSWR<Dish[]>("/api/dishes", fetcher);

  // Active bottom navigation tab
  const [activeTab, setActiveTab] = useState<"menu" | "orders" | "bill">("menu");

  // Menu state
  const [selectedPortion, setSelectedPortion] = useState<string>("Medium");
  const [portionPrice, setPortionPrice] = useState<number>(1850);
  const [heroQty, setHeroQty] = useState<number>(1);
  const [cart, setCart] = useState<OrderItem[]>([
    { dishId: 1, dishName: "Chicken Karahi", size: "Medium", qty: 1, unitPrice: 1850 },
    { dishId: 3, dishName: "Butter Naan", size: null, qty: 4, unitPrice: 100 },
    { dishId: 4, dishName: "Fresh Mint Raita", size: null, qty: 1, unitPrice: 150 },
  ]);

  // Order state
  const [orderPlaced, setOrderPlaced] = useState<boolean>(true);
  const [orderStatus, setOrderStatus] = useState<"NEW" | "COOKING" | "READY" | "SERVED">("COOKING");

  // Call waiter state
  const [callNotification, setCallNotification] = useState<string | null>(null);

  // Wi-Fi copy state
  const [wifiCopied, setWifiCopied] = useState<boolean>(false);
  const [wifiConnected, setWifiConnected] = useState<boolean>(false);

  // Upsell added state
  const [upsellAdded, setUpsellAdded] = useState<boolean>(false);

  // Bill & Split state
  const [splitWays, setSplitWays] = useState<number>(2);
  const [tipPct, setTipPct] = useState<number>(10);
  const [paymentChoice, setPaymentChoice] = useState<string>("card");
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Delicious Karahi"]);
  const [payStatus, setPayStatus] = useState<string>("idle");

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const gst = Math.round(subtotal * 0.05);
  const totalBill = subtotal + gst;

  const perPersonBase = splitWays > 0 ? Math.round(totalBill / splitWays) : totalBill;
  const tipAmount = tipPct > 0 ? Math.round((perPersonBase * tipPct) / 100) : 0;
  const finalPayable = perPersonBase + tipAmount;

  const callWaiter = async (type: string = "water") => {
    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, type }),
      });
      setCallNotification(`Server Rajesh notified for Table ${tableId}`);
      setTimeout(() => setCallNotification(null), 4000);
    } catch {
      setCallNotification("Server notified");
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

  const addHeroToCart = () => {
    setCart(prev => {
      const existing = prev.find(i => i.dishId === 1 && i.size === selectedPortion);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, qty: i.qty + heroQty } : i);
      }
      return [...prev, { dishId: 1, dishName: "Chicken Karahi", size: selectedPortion, qty: heroQty, unitPrice: portionPrice }];
    });
    setActiveTab("orders");
    setOrderPlaced(true);
  };

  const addPairing = (name: string, price: number) => {
    setCart(prev => [...prev, { dishId: Date.now(), dishName: name, size: null, qty: 1, unitPrice: price }]);
  };

  const handleProcessPayment = () => {
    setPayStatus("processing");
    setTimeout(() => {
      setPayStatus("success");
    }, 1200);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

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
              <span className="text-[11px] text-slate-500 font-medium">Station HYD-01</span>
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
        {/* Call notification toast */}
        {callNotification && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-fade-in">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
            <span>{callNotification}</span>
          </div>
        )}

        {/* ================= TAB 1: MENU ================= */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="material-symbols-outlined text-emerald-600 text-[16px]">wifi</span>
                <span className="font-medium text-slate-700">Connected to Table {tableId}</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-600 font-medium">Live Order Mode</span>
              </div>
            </div>

            {/* Clean Search Input */}
            <div className="relative flex items-center w-full">
              <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[18px] pointer-events-none">search</span>
              <input
                className="w-full h-10 pl-10 pr-9 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-medium outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="Search dishes, drinks, spices..."
                type="search"
              />
              <button aria-label="Filter" className="absolute right-2 flex items-center justify-center w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-[16px]">tune</span>
              </button>
            </div>

            {/* Category Navigation Pills */}
            <nav aria-label="Categories" className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
              <button className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs hover:border-slate-300 transition-colors">
                Starters
              </button>
              <button className="shrink-0 px-3.5 py-1.5 rounded-xl bg-orange-600 text-white font-semibold text-xs">
                Mains
              </button>
              <button className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs hover:border-slate-300 transition-colors">
                Breads &amp; Rice
              </button>
              <button className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs hover:border-slate-300 transition-colors">
                Desserts
              </button>
              <button className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs hover:border-slate-300 transition-colors">
                Beverages
              </button>
            </nav>

            {/* Main Dish Hero Card */}
            <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="relative w-full h-52 bg-slate-100 overflow-hidden">
                <img
                  alt="Chicken Karahi served steaming hot in traditional wok"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80"
                />
                <button
                  aria-label="Favorite Dish"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 text-slate-600 flex items-center justify-center hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">favorite</span>
                </button>
              </div>

              <div className="p-4 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">Chicken Karahi</h1>
                    <p className="text-xs text-slate-500 font-medium">Cooked in Pure Butter &amp; Tomato Gravy</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 line-through block">Rs 2,100</span>
                    <span className="text-xl font-bold text-slate-900 leading-tight">Rs {portionPrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1 text-amber-600 font-semibold">
                    <span className="material-symbols-outlined text-[15px]">star</span>
                    <span>4.9</span>
                    <span className="text-slate-400 font-normal">(184)</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1 text-slate-500">
                    <span className="material-symbols-outlined text-[15px] text-slate-400">timer</span>
                    <span>20-25 mins</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Succulent chicken pieces braised in an authentic iron wok with ripe tomatoes, ginger juliennes, crushed coriander seeds, and fragrant green chillies.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-600">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 font-medium">
                    <span className="material-symbols-outlined text-[14px] text-orange-600">local_fire_department</span>
                    <span>Medium Spice</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600">
                    <span className="material-symbols-outlined text-[14px] text-amber-600">egg_alt</span>
                    <span>Dairy</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600">
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">eco</span>
                    <span>Gluten-Free Gravy</span>
                  </div>
                </div>

                {/* Portion Segmented Control */}
                <div className="border-t border-slate-100 pt-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Portion Size</span>
                    <span className="text-slate-400 text-[11px]">Select portion</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => { setSelectedPortion("Small"); setPortionPrice(1200); }}
                      className={`py-2 px-1 rounded-lg text-center text-xs transition-all ${
                        selectedPortion === "Small" ? "bg-white text-orange-600 font-bold shadow-xs" : "text-slate-600 font-medium"
                      }`}
                    >
                      <span className="block font-semibold">Small</span>
                      <span className="block text-[10px] text-slate-500">Rs 1,200</span>
                    </button>
                    <button
                      onClick={() => { setSelectedPortion("Medium"); setPortionPrice(1850); }}
                      className={`py-2 px-1 rounded-lg text-center text-xs transition-all ${
                        selectedPortion === "Medium" ? "bg-white text-orange-600 font-bold shadow-xs" : "text-slate-600 font-medium"
                      }`}
                    >
                      <span className="block font-bold">Medium</span>
                      <span className="block text-[10px] text-orange-600/80">Rs 1,850</span>
                    </button>
                    <button
                      onClick={() => { setSelectedPortion("Large"); setPortionPrice(2500); }}
                      className={`py-2 px-1 rounded-lg text-center text-xs transition-all ${
                        selectedPortion === "Large" ? "bg-white text-orange-600 font-bold shadow-xs" : "text-slate-600 font-medium"
                      }`}
                    >
                      <span className="block font-semibold">Large</span>
                      <span className="block text-[10px] text-slate-500">Rs 2,500</span>
                    </button>
                  </div>
                </div>

                {/* Quantity Selector Row */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-slate-700">Quantity</span>
                  <div className="flex items-center bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => setHeroQty(q => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">remove</span>
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-slate-900">{heroQty}</span>
                    <button
                      onClick={() => setHeroQty(q => q + 1)}
                      className="w-8 h-8 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>

            {/* Paired With Section */}
            <section className="space-y-3 pt-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Best Paired With</h2>
                <p className="text-[11px] text-slate-500">Recommended Pairings • Fresh Tandoor &amp; Sides</p>
              </div>

              <article className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shrink-0">
                    🍞 Naan
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate">Garlic Naan</h3>
                    <p className="text-[11px] text-slate-500 truncate">Butter brushed</p>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">Rs 100</span>
                  </div>
                </div>
                <button
                  onClick={() => addPairing("Garlic Naan", 100)}
                  className="shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 text-slate-700 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span> Add
                </button>
              </article>

              <article className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0">
                    🥣 Raita
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate">Fresh Mint Raita</h3>
                    <p className="text-[11px] text-slate-500 truncate">Chilled roasted cumin</p>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">Rs 150</span>
                  </div>
                </div>
                <button
                  onClick={() => addPairing("Fresh Mint Raita", 150)}
                  className="shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 text-slate-700 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span> Add
                </button>
              </article>
            </section>
          </div>
        )}

        {/* ================= TAB 2: LIVE ORDERS ================= */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Unified Order Status & Progress Card */}
            <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">skillet</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-900 text-sm truncate">Order #DC-8042</span>
                    <span className="text-[11px] text-slate-500 font-medium">Table {tableId} • Live Kitchen</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 text-xs font-semibold flex-shrink-0">
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                  <span>~8 mins</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your food is cooking</h2>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="material-symbols-outlined text-[17px] text-orange-600 flex-shrink-0">restaurant</span>
                  <span>Chef Farhan is currently simmering your Chicken Karahi on the tawa.</span>
                </div>
              </div>

              {/* 3-Stage Stepper */}
              <div className="w-full flex flex-col gap-2 pt-1">
                <div className="grid grid-cols-3 relative items-center text-center">
                  <div className="absolute top-4 left-[20%] right-[20%] h-0.5 bg-slate-100 -z-0">
                    <div className="h-full bg-orange-500 transition-all duration-700 w-1/2"></div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[17px] font-bold">check</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">NEW</span>
                      <span className="text-[10px] text-slate-500 font-medium">Received</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center animate-pulse">
                      <span className="material-symbols-outlined text-[17px]">local_fire_department</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-orange-600 block leading-tight">COOKING</span>
                      <span className="text-[10px] text-orange-600 font-medium">In Progress</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[17px]">dinner_dining</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block leading-tight">READY</span>
                      <span className="text-[10px] text-slate-400 font-medium">To Serve</span>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-700" style={{ width: "68%" }}></div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 pt-0.5">
                  <span>Kitchen progress</span>
                  <span className="font-semibold text-orange-600">68% completed</span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="border-t border-slate-100 pt-3 flex flex-col divide-y divide-slate-100">
                {cart.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-orange-500" : "bg-emerald-500"} flex-shrink-0`}></span>
                      <span className="text-xs font-medium text-slate-800 truncate">
                        {item.qty}x {item.dishName} {item.size ? `(${item.size})` : ""}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold ${idx === 0 ? "text-orange-600" : "text-emerald-600"} flex-shrink-0`}>
                      {idx === 0 ? "Cooking" : "In Tandoor"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fast Dining Wi-Fi Access Card */}
            <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">wifi</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">Fast Dining Wi-Fi</div>
                  <div className="text-[11px] text-slate-500">High Speed Guest Wi-Fi • 5 GHz</div>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-y border-slate-100">
                <div className="flex flex-col text-xs gap-0.5">
                  <span className="text-slate-500">SSID: <strong className="text-slate-900 font-semibold">Table-Guest-5G</strong></span>
                  <span className="text-slate-500">Pass: <strong className="text-orange-600 font-semibold">karahi2025</strong></span>
                </div>
                <button
                  onClick={handleCopyWifi}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                  <span>{wifiCopied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
              <button
                onClick={() => setWifiConnected(true)}
                className={`w-full h-10 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-98 transition-all ${
                  wifiConnected ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 hover:bg-slate-200/80 text-slate-800"
                }`}
              >
                <span className="material-symbols-outlined text-[18px] text-blue-600">
                  {wifiConnected ? "check_circle" : "sensors"}
                </span>
                <span>{wifiConnected ? "Connected to Table-Guest-5G" : "Tap to Connect Automatically"}</span>
              </button>
            </div>

            {/* Today's Sweet Special (Upsell Card) */}
            <div className="w-full bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col shadow-xs">
              <div className="relative w-full h-40 bg-slate-100 overflow-hidden">
                <img
                  alt="Royal Gulab Jamun"
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80"
                />
                <div className="absolute bottom-2.5 right-3 bg-white/95 backdrop-blur-sm border border-slate-200/80 px-2.5 py-1 rounded-xl flex items-baseline gap-1.5">
                  <span className="text-xs font-bold text-slate-900">Rs 450</span>
                  <span className="text-[10px] text-slate-400 line-through">Rs 550</span>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-2.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Royal Gulab Jamun (2 pcs)</h3>
                  <p className="text-[11px] text-slate-500">Chef&apos;s Special • 18% off with dinner combo</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Warm fried milk dumplings drenched in fragrant saffron-cardamom syrup with crushed emerald pistachios.
                </p>
                <button
                  onClick={() => {
                    setUpsellAdded(true);
                    setCart(prev => [...prev, { dishId: 7, dishName: "Royal Gulab Jamun", size: null, qty: 1, unitPrice: 450 }]);
                  }}
                  disabled={upsellAdded}
                  className={`w-full h-11 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all mt-1 ${
                    upsellAdded ? "bg-emerald-600 text-white" : "bg-orange-600 hover:bg-orange-700 text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {upsellAdded ? "check_circle" : "add_circle"}
                  </span>
                  <span>{upsellAdded ? "Added to Kitchen Ticket!" : "Add to Existing Order (Rs 450)"}</span>
                </button>
              </div>
            </div>

            {/* Quick Hospitality Helper Bar */}
            <button
              onClick={() => callWaiter("water")}
              className="w-full py-3.5 px-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 text-slate-700 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-orange-600 text-[19px]">notifications_active</span>
              <span className="text-xs font-semibold text-slate-800">Need Water or Napkins? Call Waiter</span>
            </button>
          </div>
        )}

        {/* ================= TAB 3: BILL & SPLIT ================= */}
        {activeTab === "bill" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="material-symbols-outlined text-emerald-600 text-[16px]">wifi</span>
                <span className="font-medium text-slate-700">Table {tableId} Bill &amp; Checkout</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-600 font-medium">Live Order Mode</span>
              </div>
            </div>

            {/* Order & Bill Summary Card */}
            <article className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">D.CC Spice Root Bistro</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Dine-in • Table {tableId} • Server: Rajesh S.</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-orange-600 font-mono">#DC-8042</span>
                  <span className="text-[11px] text-slate-400 block">Dine-in</span>
                </div>
              </div>

              <div className="space-y-2 py-1">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-700 font-bold text-[11px] border border-orange-200/60">
                        {item.qty}x
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 truncate block">
                          {item.dishName} {item.size ? `(${item.size})` : ""}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      Rs {(item.unitPrice * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">Rs {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <span>GST (5%)</span>
                    <span className="material-symbols-outlined text-[13px] text-slate-400">info</span>
                  </div>
                  <span className="font-semibold text-slate-900">Rs {gst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900 text-sm">Total Bill</span>
                  <span className="text-xl font-bold text-orange-600 leading-tight">Rs {totalBill.toLocaleString()}</span>
                </div>
              </div>
            </article>

            {/* Split Bill Segmented Selector */}
            <article className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-orange-600 text-[18px]">call_split</span>
                  <span className="text-xs font-bold text-slate-900">Split the Bill</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100/90 rounded-xl">
                <button
                  onClick={() => setSplitWays(1)}
                  className={`py-2 px-1 rounded-xl text-center text-xs transition-all ${
                    splitWays === 1 ? "bg-white text-orange-600 font-bold border border-slate-200/60 shadow-xs" : "text-slate-600 font-medium"
                  }`}
                >
                  <span className="block font-semibold">Whole</span>
                  <span className="block text-[10px] text-slate-400">Full</span>
                </button>
                <button
                  onClick={() => setSplitWays(2)}
                  className={`py-2 px-1 rounded-xl text-center text-xs transition-all ${
                    splitWays === 2 ? "bg-white text-orange-600 font-bold border border-slate-200/60 shadow-xs" : "text-slate-600 font-medium"
                  }`}
                >
                  <span className="block font-bold">Split 2</span>
                  <span className="block text-[10px] text-orange-600/80">2 Ways</span>
                </button>
                <button
                  onClick={() => setSplitWays(3)}
                  className={`py-2 px-1 rounded-xl text-center text-xs transition-all ${
                    splitWays === 3 ? "bg-white text-orange-600 font-bold border border-slate-200/60 shadow-xs" : "text-slate-600 font-medium"
                  }`}
                >
                  <span className="block font-semibold">Split 3</span>
                  <span className="block text-[10px] text-slate-400">3 Ways</span>
                </button>
                <button
                  onClick={() => setSplitWays(4)}
                  className={`py-2 px-1 rounded-xl text-center text-xs transition-all ${
                    splitWays === 4 ? "bg-white text-orange-600 font-bold border border-slate-200/60 shadow-xs" : "text-slate-600 font-medium"
                  }`}
                >
                  <span className="block font-semibold">Split 4</span>
                  <span className="block text-[10px] text-slate-400">4 Ways</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">group</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Your Equal Share</span>
                    <span className="text-[10px] text-slate-500">Per Person Share</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-orange-600 block leading-tight">
                    Rs {perPersonBase.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">Base share</span>
                </div>
              </div>
            </article>

            {/* Tip Selector */}
            <article className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">volunteer_activism</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900">Add Tip for Staff</span>
                    <span className="text-[10px] text-slate-400 block">Rajesh S. • Floor Lead</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[0, 5, 10, 15].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setTipPct(pct)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      tipPct === pct ? "bg-orange-50 border-orange-200 text-orange-600 font-bold" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="font-bold text-xs">{pct}%</span>
                    <span className="text-[10px] text-slate-400">
                      Rs {Math.round((perPersonBase * pct) / 100)}
                    </span>
                  </button>
                ))}
              </div>
            </article>

            {/* Payment Method Selection */}
            <article className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-900">Payment Method</span>
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified_user</span>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { id: "card", title: "Credit or Debit Card", subtitle: "Visa, Mastercard, RuPay & Amex", icon: "credit_card" },
                  { id: "upi", title: "UPI & Instant Wallet", subtitle: "GPay, PhonePe, Paytm, Cred", icon: "qr_code_scanner" },
                  { id: "netbanking", title: "NetBanking / Transfer", subtitle: "Instant IMPS or Direct Gateway", icon: "account_balance" },
                  { id: "cash", title: "Cash to Waiter", subtitle: "Server comes to your table with folio", icon: "payments" },
                ].map(m => (
                  <label
                    key={m.id}
                    onClick={() => setPaymentChoice(m.id)}
                    className={`flex items-center justify-between py-3 px-2 -mx-2 rounded-xl cursor-pointer transition-colors ${
                      paymentChoice === m.id ? "bg-orange-50/40" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{m.title}</span>
                        <span className="text-[11px] text-slate-500">{m.subtitle}</span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={paymentChoice === m.id}
                      onChange={() => setPaymentChoice(m.id)}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </article>

            {/* Dining Experience & Review Widget */}
            <article className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Dining Experience</h3>
                <p className="text-[11px] text-slate-500">How was your dining experience tonight?</p>
              </div>

              <div className="flex items-center justify-center gap-2.5 py-2 border-y border-slate-100">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="star-btn transition-transform hover:scale-110 focus:outline-none"
                  >
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

              <div className="flex flex-wrap gap-1.5">
                {["Fast Service", "Delicious Karahi", "Clean Ambience"].map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 ${
                        isSelected ? "bg-orange-600 text-white font-semibold" : "bg-slate-50 border border-slate-200 text-slate-700"
                      }`}
                    >
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>

              <input
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs font-medium outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="Leave a compliment for the chef or server..."
                type="text"
              />
            </article>
          </div>
        )}
      </main>

      {/* Sticky Bottom Checkout CTA Bar (for Bill Tab) */}
      {activeTab === "bill" && (
        <aside className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 pt-1 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto bg-white rounded-2xl p-3 border border-slate-200 shadow-lg space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-slate-500">Amount Payable (Share + Tip)</span>
              <span className="text-lg font-bold text-slate-900 leading-tight">
                Rs {finalPayable.toLocaleString()}
              </span>
            </div>
            <button
              onClick={handleProcessPayment}
              className={`w-full h-11 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all ${
                payStatus === "success" ? "bg-emerald-600" : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {payStatus === "success" ? "check_circle" : "credit_card"}
              </span>
              <span>
                {payStatus === "processing" ? "Processing..." : payStatus === "success" ? "Payment Authorized! ✓" : `Pay Now (Rs ${finalPayable.toLocaleString()})`}
              </span>
            </button>
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px]">
              <span className="material-symbols-outlined text-[12px] text-slate-400">lock</span>
              <span>256-bit Encrypted Checkout • RBI Compliant</span>
            </div>
          </div>
        </aside>
      )}

      {/* Sticky Bottom Order Summary & CTA Bar (for Menu Tab) */}
      {activeTab === "menu" && (
        <aside className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 pt-1 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-lg flex items-center justify-between gap-3">
            <div className="flex flex-col pl-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-medium text-slate-500 truncate">
                  {cart.length} {cart.length === 1 ? "item" : "items"} in order
                </span>
              </div>
              <span className="text-base font-bold text-slate-900 leading-tight">
                Rs {subtotal.toLocaleString()}
              </span>
            </div>
            <button
              onClick={addHeroToCart}
              className="flex-1 max-w-[210px] h-11 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <span className="truncate">Add to Order</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </aside>
      )}

      {/* Bottom Navigation Tab Bar */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-white border-t border-slate-200">
        <div className="h-16 max-w-lg mx-auto px-4 flex items-center justify-around">
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] transition-colors active:scale-95 ${
              activeTab === "menu" ? "text-orange-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">restaurant_menu</span>
            <span className="text-[11px] mt-0.5">Menu</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] transition-colors active:scale-95 relative ${
              activeTab === "orders" ? "text-orange-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span className="text-[11px] mt-0.5">Orders</span>
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab("bill")}
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] transition-colors active:scale-95 ${
              activeTab === "bill" ? "text-orange-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">payments</span>
            <span className="text-[11px] mt-0.5">Bill</span>
          </button>

          <button
            onClick={() => callWaiter("help")}
            className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] text-slate-500 hover:text-slate-800 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">concierge</span>
            <span className="text-[11px] mt-0.5">Service</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
