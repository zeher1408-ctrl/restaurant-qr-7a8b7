"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type OrderItem = {
  id: number;
  dish_name: string;
  size: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type Order = {
  id: number;
  table_id: number;
  table_number: number;
  guest_name: string | null;
  guest_phone: string | null;
  notes: string | null;
  status: "NEW" | "COOKING" | "READY" | "SERVED";
  created_at: string;
  items: OrderItem[];
};

export default function KitchenKDS() {
  const { data: orders, mutate } = useSWR<Order[]>("/api/orders", fetcher, { refreshInterval: 3000 });
  const [filter, setFilter] = useState<string>("all");
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-GB", { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId: number, status: string) => {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    mutate();
  };

  const getElapsedTime = (createdStr: string) => {
    const elapsedSecs = Math.max(0, Math.floor((Date.now() - new Date(createdStr).getTime()) / 1000));
    const mins = Math.floor(elapsedSecs / 60);
    const secs = elapsedSecs % 60;
    return {
      formatted: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
      mins,
    };
  };

  const allOrders = orders || [];
  const newOrders = allOrders.filter(o => o.status === "NEW");
  const cookingOrders = allOrders.filter(o => o.status === "COOKING");
  const readyOrders = allOrders.filter(o => o.status === "READY");
  const delayedOrders = cookingOrders.filter(o => getElapsedTime(o.created_at).mins >= 15);

  return (
    <div className="bg-[#F8F9FF] text-[#0F172A] antialiased min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Station Status */}
          <div className="flex items-center gap-5 shrink-0">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-sm tracking-tight">
                D.CC
              </div>
              <div>
                <div className="font-bold text-slate-900 tracking-tight text-base leading-none">D.CC Kitchen</div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">Station HYD-01</div>
              </div>
            </Link>
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Main Hot Line • Station Active</span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-sm font-medium">
            <Link href="/dashboard" className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>Dashboard</span>
            </Link>
            <Link href="/floor" className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">table_restaurant</span>
              <span>Floor Map</span>
            </Link>
            <span className="px-3.5 py-1.5 rounded-lg bg-white text-slate-900 font-semibold flex items-center gap-1.5 transition-colors shadow-xs">
              <span className="material-symbols-outlined text-[18px] text-orange-600">soup_kitchen</span>
              <span>Kitchen KDS</span>
            </span>
            <Link href="/table/4" className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Guest View</span>
            </Link>
          </nav>

          {/* Right Staff Info & Live Telemetry */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
              <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
              <span>{currentTime || "22:00:00"}</span>
            </div>
            <div className="hidden xl:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800">Vikram M.</span>
              <span className="text-[11px] text-slate-400">Head Chef</span>
            </div>
          </div>
        </div>
      </header>

      {/* Subheader / Station Bar & Filters */}
      <section className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">outdoor_grill</span>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 leading-tight">Main Hot Line • Tandoor &amp; Gravy Section</div>
                <div className="text-xs text-slate-500 font-medium">Head Chef: Vikram M. • Pass #1</div>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Live Orders:</span>
                <span className="font-bold text-slate-900 text-sm">{newOrders.length + cookingOrders.length}</span>
              </div>
              {delayedOrders.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                  <span className="material-symbols-outlined text-sm text-rose-600">warning</span>
                  <span>Delayed: {delayedOrders.length} Orders (&gt;15m)</span>
                </div>
              )}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0">
            <button
              onClick={() => setFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shrink-0 ${
                filter === "all" ? "bg-orange-600 text-white" : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <span>All Dishes</span>
              <span className="px-1.5 py-0.5 rounded-lg bg-white/20 text-[11px] font-mono leading-none">
                {newOrders.length + cookingOrders.length + readyOrders.length}
              </span>
            </button>
            <button
              onClick={() => setFilter("karahi")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors shrink-0 ${
                filter === "karahi" ? "bg-orange-600 text-white" : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <span>Karahi &amp; Curries</span>
            </button>
            <button
              onClick={() => setFilter("tandoor")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors shrink-0 ${
                filter === "tandoor" ? "bg-orange-600 text-white" : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              <span>Tandoor &amp; Naan</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3-Column Workflow Kanban */}
      <main className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ================= COLUMN 1: NEW ================= */}
          <section className="flex flex-col gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">NEW</h2>
                  <p className="text-xs text-slate-500">Awaiting Prep Intake</p>
                </div>
              </div>
              <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold font-mono flex items-center justify-center">
                {newOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {newOrders.map((order) => {
                const elapsed = getElapsedTime(order.created_at);
                return (
                  <div key={order.id} className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-slate-300 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-extrabold text-slate-900">#{order.id}</span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold uppercase">
                              Table {order.table_number || order.table_id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                            {order.guest_name ? `${order.guest_name} • Dine-in` : "Dine-in Order"}
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-mono font-bold">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          <span>{elapsed.formatted}</span>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 py-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="py-3">
                            <div className="text-xs font-bold text-slate-900">
                              {item.quantity}x {item.dish_name} {item.size ? `(${item.size})` : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <div className="mt-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-medium text-amber-900">
                          Extra / Note: {order.notes}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => updateStatus(order.id, "COOKING")}
                      className="w-full mt-2 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Start Cooking</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                );
              })}
              {newOrders.length === 0 && (
                <div className="bg-white/60 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                  No new tickets waiting
                </div>
              )}
            </div>
          </section>

          {/* ================= COLUMN 2: COOKING ================= */}
          <section className="flex flex-col gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">COOKING</h2>
                  <p className="text-xs text-slate-500">Live on Range &amp; Tandoor</p>
                </div>
              </div>
              <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 text-xs font-bold font-mono flex items-center justify-center">
                {cookingOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {cookingOrders.map((order) => {
                const elapsed = getElapsedTime(order.created_at);
                const isDelayed = elapsed.mins >= 15;
                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl p-5 overflow-hidden flex flex-col justify-between ${
                      isDelayed ? "border-2 border-rose-300" : "border border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    {isDelayed && (
                      <div className="-mx-5 -mt-5 mb-4 bg-rose-50 border-b border-rose-200 px-5 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-rose-700 text-xs font-bold">
                          <span className="material-symbols-outlined text-sm text-rose-600">warning</span>
                          <span className="uppercase tracking-wider">Delayed Order</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-rose-700">PRIORITY 1</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-extrabold text-slate-900">#{order.id}</span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold uppercase">
                              Table {order.table_number || order.table_id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                            {order.guest_name ? `${order.guest_name} • Cooking` : "Cooking in progress"}
                          </div>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold ${
                          isDelayed ? "bg-rose-100 text-rose-800" : "bg-amber-50 text-amber-800"
                        }`}>
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          <span>{elapsed.formatted}</span>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 py-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="py-3">
                            <div className="text-xs font-bold text-slate-900">
                              {item.quantity}x {item.dish_name} {item.size ? `(${item.size})` : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <div className="mt-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-medium text-amber-900">
                          Extra / Note: {order.notes}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => updateStatus(order.id, "READY")}
                      className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>Mark Ready</span>
                    </button>
                  </div>
                );
              })}
              {cookingOrders.length === 0 && (
                <div className="bg-white/60 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                  No orders currently cooking
                </div>
              )}
            </div>
          </section>

          {/* ================= COLUMN 3: READY ================= */}
          <section className="flex flex-col gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">READY</h2>
                  <p className="text-xs text-slate-500">Awaiting Runner Pickup</p>
                </div>
              </div>
              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold font-mono flex items-center justify-center">
                {readyOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {readyOrders.map((order) => (
                <div key={order.id} className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-slate-300 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-extrabold text-slate-900">#{order.id}</span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold uppercase">
                            Table {order.table_number || order.table_id}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">Ready for service</div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-mono font-bold">
                        <span className="material-symbols-outlined text-sm">done_all</span>
                        <span>Ready</span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 py-1">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-slate-600">
                          <div className="text-xs font-semibold">{item.quantity}x {item.dish_name}</div>
                          <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => updateStatus(order.id, "SERVED")}
                    className="w-full mt-3 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">outbox</span>
                    <span>Dispatch / Clear</span>
                  </button>
                </div>
              ))}
              {readyOrders.length === 0 && (
                <div className="bg-white/60 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                  No orders ready for pickup
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer Summary Ribbon */}
      <footer className="mt-auto border-t border-slate-200/90 bg-white py-4">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Thresholds:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>&lt;5m Fast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
              <span>5-10m Standard</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>10-15m Watch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span className="text-rose-700 font-semibold">&gt;15m Critical</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 uppercase tracking-wider text-[11px]">Active Orders:</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{allOrders.length}</span>
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-baseline gap-2">
              <span className="text-slate-400 uppercase tracking-wider text-[11px]">Station:</span>
              <span className="font-bold text-emerald-600 font-mono text-sm">HYD-01 Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
