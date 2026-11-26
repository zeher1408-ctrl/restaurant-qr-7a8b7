"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type Stats = {
  liveOrders: number;
  activeTables: number;
  todaySales: number;
  hourlyFlow: { hour: number; count: number }[];
};

type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
  allergens: string[];
  spice_level: number;
  sizes: string[];
};

type Review = {
  id: number;
  table_id: number;
  table_number: number;
  rating: number;
  comment: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const { data: stats } = useSWR<Stats>("/api/dashboard", fetcher, { refreshInterval: 5000 });
  const { data: dishes, mutate: mutateDishes } = useSWR<Dish[]>("/api/dishes", fetcher);
  const { data: reviews } = useSWR<Review[]>("/api/reviews", fetcher, { refreshInterval: 6000 });

  const [activeTab, setActiveTab] = useState<"overview" | "menu" | "tables" | "reviews">("overview");
  const [editingPrice, setEditingPrice] = useState<{ [key: number]: number }>({});
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [newDish, setNewDish] = useState({ name: "", description: "", price: 450 });
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleUpdatePrice = async (dishId: number) => {
    const newPrice = editingPrice[dishId];
    if (newPrice === undefined) return;
    await fetch("/api/dishes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dishId, price: newPrice }),
    });
    setSaveSuccess(`Updated price for dish #${dishId}`);
    setTimeout(() => setSaveSuccess(null), 3000);
    mutateDishes();
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDish.name || !newDish.price) return;
    await fetch("/api/dishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDish),
    });
    setIsAddingDish(false);
    setNewDish({ name: "", description: "", price: 450 });
    mutateDishes();
  };

  const reviewCount = reviews?.length ?? 0;
  const avgRating = reviewCount > 0
    ? (reviews!.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)
    : "0.0";

  const hourlyFlow = stats?.hourlyFlow ?? [];
  const maxHourCount = hourlyFlow.length > 0
    ? Math.max(...hourlyFlow.map(h => Number(h.count)), 1)
    : 1;

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] antialiased min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-sm tracking-tight">
                D.CC
              </div>
              <div>
                <div className="font-bold text-slate-900 tracking-tight text-base leading-none">D.CC Admin</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">Manager Station • Live</div>
              </div>
            </Link>
            <div className="hidden sm:inline-flex items-center gap-2 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-sm font-medium">
            <span className="px-3.5 py-1.5 rounded-lg bg-white text-slate-900 shadow-xs font-semibold flex items-center gap-1.5 transition-colors">
              <span className="material-symbols-outlined text-[18px] text-orange-600">dashboard</span>
              <span>Dashboard</span>
            </span>
            <Link href="/floor" className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">table_restaurant</span>
              <span>Floor Map</span>
            </Link>
            <Link href="/kitchen" className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">soup_kitchen</span>
              <span>Kitchen KDS</span>
            </Link>
            <Link href="/table/4" className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Guest View</span>
            </Link>
          </nav>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-800 block">General Manager</span>
            <span className="text-[11px] text-slate-400">HYD-01 Flagship</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today Sales</span>
              <span className="material-symbols-outlined text-lg text-emerald-600">payments</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              Rs {(stats?.todaySales ?? 0).toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              Live daily total
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Orders</span>
              <span className="material-symbols-outlined text-lg text-orange-600">soup_kitchen</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats?.liveOrders ?? 0}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">
              Active in kitchen pass
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tables Active</span>
              <span className="material-symbols-outlined text-lg text-blue-600">table_bar</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {stats?.activeTables ?? 0} / 10
            </div>
            <div className="text-xs font-medium text-blue-600 mt-1">
              {((stats?.activeTables ?? 0) * 10)}% Hall Occupancy
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer Rating</span>
              <span className="material-symbols-outlined text-lg text-amber-500">star</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-1">
              <span>{avgRating}</span>
              <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
            </div>
            <div className="text-xs font-medium text-amber-600 mt-1">
              {reviewCount} Verified {reviewCount === 1 ? "Review" : "Reviews"}
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "overview", label: "Overview & Flow", icon: "analytics" },
              { id: "menu", label: "Menu Management", icon: "restaurant_menu" },
              { id: "tables", label: "Tables & QR Codes", icon: "qr_code_2" },
              { id: "reviews", label: "Guest Reviews", icon: "rate_review" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === tab.id
                    ? "bg-orange-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === "menu" && (
            <button
              onClick={() => setIsAddingDish(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span className="material-symbols-outlined text-[17px]">add_circle</span>
              <span>Add New Dish</span>
            </button>
          )}
        </div>

        {/* Toast */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* ================= TAB 1: OVERVIEW & FLOW ================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Guest Order Flow (Today)</h3>
                  <p className="text-xs text-slate-500">Order traffic distribution by hour</p>
                </div>
              </div>

              {hourlyFlow.length === 0 ? (
                <div className="h-44 flex items-center justify-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                  No orders today yet.
                </div>
              ) : (
                <div className="flex items-end gap-2 h-44 pt-4 border-b border-slate-100">
                  {hourlyFlow.map((h: any) => (
                    <div key={h.hour} className="flex flex-col items-center flex-1 group">
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-600 transition-colors mb-1">
                        {h.count}
                      </span>
                      <div
                        className="w-full bg-orange-500 hover:bg-orange-600 rounded-t transition-all"
                        style={{ height: `${Math.max(12, (Number(h.count) / maxHourCount) * 100)}%` }}
                      />
                      <span className="text-[11px] font-semibold text-slate-500 mt-2">{h.hour}:00</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: MENU MANAGEMENT ================= */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            {isAddingDish && (
              <form onSubmit={handleAddDish} className="bg-white border border-orange-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Add New Dish to Supabase</h3>
                  <button type="button" onClick={() => setIsAddingDish(false)} className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 uppercase">Dish Name</label>
                    <input
                      required
                      value={newDish.name}
                      onChange={e => setNewDish({ ...newDish, name: e.target.value })}
                      placeholder="e.g. Mutton Rogan Josh"
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 uppercase">Price (Rs)</label>
                    <input
                      required
                      type="number"
                      value={newDish.price}
                      onChange={e => setNewDish({ ...newDish, price: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 uppercase">Description</label>
                    <input
                      value={newDish.description}
                      onChange={e => setNewDish({ ...newDish, description: e.target.value })}
                      placeholder="e.g. Slow cooked Kashmiri gravy"
                      className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddingDish(false)} className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-semibold">
                    Save Dish
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Dish</th>
                    <th className="py-3 px-4">Allergens</th>
                    <th className="py-3 px-4">Live Price</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dishes?.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">#{d.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{d.name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{d.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 font-medium text-[10px]">
                          {d.allergens?.length ? d.allergens.join(", ") : "None"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700">Rs</span>
                          <input
                            type="number"
                            defaultValue={d.price}
                            onChange={e => setEditingPrice({ ...editingPrice, [d.id]: Number(e.target.value) })}
                            className="w-20 px-2 py-1 border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-orange-500"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleUpdatePrice(d.id)}
                          className="px-3 py-1 bg-slate-100 hover:bg-orange-600 hover:text-white rounded-lg font-semibold text-slate-700 transition-colors"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: TABLES & QR CODES ================= */}
        {activeTab === "tables" && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <div key={n} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-xs flex flex-col justify-between h-56">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-900">Table {n}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/qr/${n}`} alt={`QR Table ${n}`} className="mx-auto w-24 h-24 my-2" />
                </div>
                <div className="flex gap-1.5">
                  <a
                    href={`/api/qr/${n}`}
                    download={`table-${n}-qr.svg`}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 transition-colors"
                  >
                    SVG
                  </a>
                  <Link
                    href={`/table/${n}`}
                    target="_blank"
                    className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-xl text-[11px] font-semibold text-white transition-colors"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= TAB 4: GUEST REVIEWS ================= */}
        {activeTab === "reviews" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Guest Reviews &amp; Feedback</h3>
                <p className="text-xs text-slate-500">Real-time ratings submitted via the guest payment folio</p>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                <span className="material-symbols-outlined text-lg">star</span>
                <span>{avgRating} Average</span>
              </div>
            </div>

            {!reviews || reviews.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No guest reviews yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <div key={rev.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold">
                          Table {rev.table_number || rev.table_id}
                        </span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, s) => (
                            <span key={s} className="material-symbols-outlined text-sm">star</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{rev.comment || "5-star rating"}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(rev.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
