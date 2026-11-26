"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Call = {
  id: number;
  table_id: number;
  table_number: number;
  type: "water" | "bill" | "help";
  status: "NEW" | "ON_THE_WAY" | "DONE";
  created_at: string;
};

type Order = {
  id: number;
  table_id: number;
  table_number: number;
  status: string;
  items: { dish_name: string; quantity: number; total_price: number }[];
};

export default function FloorMap() {
  const { data: calls, mutate: mutateCalls } = useSWR<Call[]>("/api/calls", fetcher, { refreshInterval: 2500 });
  const { data: orders } = useSWR<Order[]>("/api/orders", fetcher, { refreshInterval: 4000 });
  const [selectedTable, setSelectedTable] = useState<number>(4);

  const activeCalls = calls?.filter(c => c.status !== "DONE") || [];
  const focusCall = activeCalls.find(c => (c.table_number || c.table_id) === selectedTable) || activeCalls[0];

  const updateCallStatus = async (callId: number, status: string) => {
    await fetch("/api/calls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId, status }),
    });
    mutateCalls();
  };

  const tableList = Array.from({ length: 10 }, (_, i) => i + 1);

  const getTableStatus = (tNum: number) => {
    const hasCall = activeCalls.find(c => (c.table_number || c.table_id) === tNum);
    if (hasCall) return { type: "alert", label: hasCall.type === "water" ? "Water Call" : hasCall.type === "bill" ? "Bill Call" : "Needs Help", call: hasCall };
    const hasOrder = orders?.find(o => (o.table_number || o.table_id) === tNum && o.status !== "SERVED");
    if (hasOrder) return { type: "occupied", label: hasOrder.status === "COOKING" ? "Mains" : "Dining", order: hasOrder };
    if (tNum === 6) return { type: "reserved", label: "Reserved" };
    return { type: "available", label: "Available" };
  };

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] antialiased min-h-screen">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-sm tracking-tight">
                D.CC
              </div>
              <div>
                <div className="font-bold text-slate-900 tracking-tight text-base leading-none">D.CC Kitchen</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">Station HYD-01</div>
              </div>
            </Link>
            <div className="hidden sm:inline-flex items-center gap-2 text-emerald-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Service • Dinner</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-sm font-medium">
            <Link href="/dashboard" className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>Dashboard</span>
            </Link>
            <span className="px-3.5 py-1.5 rounded-lg bg-white text-slate-900 shadow-xs font-semibold flex items-center gap-1.5 transition-colors">
              <span className="material-symbols-outlined text-[18px] text-orange-600">table_restaurant</span>
              <span>Floor Map</span>
            </span>
            <Link href="/kitchen" className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">soup_kitchen</span>
              <span>Kitchen KDS</span>
            </Link>
            <Link href="/table/4" className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Guest View</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800">Arjun Mehta</span>
              <span className="text-[11px] text-slate-400">Floor Steward</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">Zone A • Main Dining Hall</span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Dining Floor Plan</h1>
            <p className="text-xs text-slate-500 mt-0.5">Real-time table occupancy, guest turn counters, and instant service dispatch.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
              <span className="material-symbols-outlined text-base text-slate-400">schedule</span>
              <span>Dinner Service</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-xs font-semibold text-orange-700">
              <span className="material-symbols-outlined text-base text-orange-600">notifications_active</span>
              <span>{activeCalls.length} Pending {activeCalls.length === 1 ? "Call" : "Calls"}</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Left 8 cols, Right 4 cols */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Floor Canvas & KPIs */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              {/* Landmarks */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-4 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-slate-400">soup_kitchen</span>
                  <span>Kitchen Pass-Through</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-800">
                  <span className="material-symbols-outlined text-sm text-amber-600">local_bar</span>
                  <span>Beverage Station</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-slate-400">door_front</span>
                  <span>Hostess Entry</span>
                </div>
              </div>

              {/* Tables Grid (T-01 to T-10) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 py-5">
                {tableList.map(tNum => {
                  const info = getTableStatus(tNum);
                  const isSelected = selectedTable === tNum;

                  if (info.type === "alert") {
                    return (
                      <div
                        key={tNum}
                        onClick={() => setSelectedTable(tNum)}
                        className={`bg-orange-50/40 border-2 border-orange-500 rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between h-40 ${
                          isSelected ? "ring-2 ring-orange-400 shadow-md" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-base font-bold text-orange-600 flex items-center gap-1.5">
                              <span>T-0{tNum}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                              <span className="material-symbols-outlined text-xs">group</span>
                              <span>Table {tNum}</span>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-600 text-white text-[11px] font-bold animate-pulse">
                            <span className="material-symbols-outlined text-xs">notifications</span>
                            {info.label}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-orange-200/80 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-orange-700 uppercase tracking-wider block font-semibold">Status</span>
                            <span className="font-bold text-orange-600">{info.call?.status === "ON_THE_WAY" ? "On The Way" : "Calling"}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Assigned</span>
                            <span className="text-slate-800 font-semibold">Rajesh S.</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (info.type === "available") {
                    return (
                      <div
                        key={tNum}
                        onClick={() => setSelectedTable(tNum)}
                        className="bg-emerald-50/30 border border-dashed border-emerald-300 rounded-xl p-4 transition-colors cursor-pointer flex flex-col justify-between h-40 hover:border-emerald-400"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-base font-bold text-emerald-800">T-0{tNum}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Ready for guests</div>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Available
                          </span>
                        </div>
                        <div className="pt-3 border-t border-emerald-100 flex items-center gap-1.5 text-emerald-800">
                          <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                          <span className="text-xs font-semibold">Clean &amp; Set</span>
                        </div>
                      </div>
                    );
                  }

                  if (info.type === "reserved") {
                    return (
                      <div
                        key={tNum}
                        onClick={() => setSelectedTable(tNum)}
                        className="bg-amber-50/20 border border-amber-200 hover:border-amber-300 rounded-xl p-4 transition-colors cursor-pointer flex flex-col justify-between h-40"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-base font-bold text-amber-700">T-0{tNum}</div>
                            <div className="text-xs text-slate-400 mt-0.5">4 Guests</div>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Reserved
                          </span>
                        </div>
                        <div className="pt-3 border-t border-amber-100">
                          <div className="text-xs font-semibold text-slate-800 truncate">Dinner Reservation</div>
                          <div className="text-[11px] text-amber-700 mt-0.5">Arriving soon</div>
                        </div>
                      </div>
                    );
                  }

                  // Default occupied
                  return (
                    <div
                      key={tNum}
                      onClick={() => setSelectedTable(tNum)}
                      className={`bg-white border rounded-xl p-4 transition-colors cursor-pointer flex flex-col justify-between h-40 ${
                        isSelected ? "border-orange-500 shadow-sm" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-base font-bold text-slate-900">T-0{tNum}</div>
                          <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                            <span className="material-symbols-outlined text-xs">group</span>
                            <span>Dining</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          {info.label}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Order</span>
                          <span className="font-bold text-slate-900">Active</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Service</span>
                          <span className="text-slate-600 font-medium">Seated</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend Bar */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                    <span>Occupied</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-orange-700 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                    <span>Needs Service ({activeCalls.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                    <span>Reserved (1)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom KPI Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Turn Time</span>
                  <span className="material-symbols-outlined text-base text-blue-600">hourglass_empty</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">42 Min</div>
                <div className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">trending_down</span>
                  <span>Optimal dining pace</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Active Tables</span>
                  <span className="material-symbols-outlined text-base text-emerald-600">payments</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">8 / 10 Tables</div>
                <div className="text-xs text-slate-500 mt-1">Zone A Occupancy 80%</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Wait Staff on Duty</span>
                  <span className="material-symbols-outlined text-base text-amber-600">badge</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">5 Staff</div>
                <div className="text-xs text-slate-500 mt-1">Lead: Arjun Mehta</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Table Focus Card & Live Service Calls */}
          <div className="lg:col-span-4 space-y-6">
            {/* Table Focus Card */}
            <div className="bg-white border border-orange-300 rounded-2xl p-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">campaign</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Table {selectedTable} Focus</h3>
                    <p className="text-xs font-semibold text-orange-600 mt-0.5">
                      {focusCall ? `${focusCall.type.toUpperCase()} requested` : "Normal dining in progress"}
                    </p>
                  </div>
                </div>
                {focusCall && <span className="text-[11px] text-slate-400 font-medium">Active</span>}
              </div>

              <div className="py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                  RS
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Rajesh S.</span>
                    <span className="text-[11px] text-slate-400">Head Captain</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-medium text-emerald-700">
                      {focusCall?.status === "ON_THE_WAY" ? "On The Way" : "Assigned"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {focusCall ? (
                <div className="grid grid-cols-2 gap-2 pt-4">
                  <button
                    onClick={() => updateCallStatus(focusCall.id, "ON_THE_WAY")}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">thumb_up</span>
                    <span>On The Way</span>
                  </button>
                  <button
                    onClick={() => updateCallStatus(focusCall.id, "DONE")}
                    className="px-3 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">task_alt</span>
                    <span>Resolve Alert</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 pt-3 text-center">No active call for Table {selectedTable}</p>
              )}
            </div>

            {/* Live Calls Feed Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Live Calls Feed</h3>
                <p className="text-xs text-slate-500 mt-0.5">Recent table requests &amp; service logs</p>
              </div>

              <div className="divide-y divide-slate-100">
                {activeCalls.map(c => (
                  <div key={c.id} className="py-3.5 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 flex-shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-base">
                        {c.type === "water" ? "water_drop" : c.type === "bill" ? "receipt_long" : "room_service"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Table {c.table_number || c.table_id} • {c.type.toUpperCase()}</span>
                        <span className="text-[11px] font-semibold text-orange-600">Pending</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">Server dispatched to table.</p>
                    </div>
                  </div>
                ))}
                {activeCalls.length === 0 && (
                  <p className="py-6 text-center text-xs text-slate-400">All tables serviced. No pending calls.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
