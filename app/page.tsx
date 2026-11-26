import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8F9FF] text-slate-900 flex flex-col items-center justify-center p-6 selection:bg-orange-100 selection:text-orange-900">
      <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-extrabold text-xl shadow-xs">
          D.CC
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">D.CC Kitchen &amp; Bistro</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Complete digital dining operating system — Guest QR, Kitchen KDS, Floor Map &amp; Billing.
          </p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          <Link
            href="/table/4"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all text-left flex items-start gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">smartphone</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Guest Experience</h2>
              <p className="text-xs text-slate-500 mt-0.5">Table 4 Menu, live tracking &amp; split bill</p>
            </div>
          </Link>

          <Link
            href="/kitchen"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all text-left flex items-start gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">soup_kitchen</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Kitchen KDS</h2>
              <p className="text-xs text-slate-500 mt-0.5">Kanban tickets &amp; order workflow</p>
            </div>
          </Link>

          <Link
            href="/floor"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all text-left flex items-start gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">table_restaurant</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Floor Map</h2>
              <p className="text-xs text-slate-500 mt-0.5">Live table calls &amp; steward dispatch</p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all text-left flex items-start gap-3 group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">analytics</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Live Dashboard</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time revenue &amp; guest flow</p>
            </div>
          </Link>
        </div>

        {/* Table QRs Accordion */}
        <details className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer">
          <summary className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-600 text-lg">qr_code_2</span>
              <span>View Table QR Codes (T-01 to T-10)</span>
            </span>
            <span className="text-slate-400 text-xs">Expand</span>
          </summary>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-100">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <Link
                key={n}
                href={`/table/${n}`}
                className="border border-slate-200 hover:border-orange-300 rounded-xl p-2.5 text-center transition-all bg-slate-50/50"
              >
                <p className="text-xs font-bold text-slate-800 mb-1">Table {n}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/qr/${n}`} alt={`QR Table ${n}`} className="mx-auto w-20 h-20" />
                <span className="text-[10px] text-orange-600 font-semibold block mt-1">Open Tab</span>
              </Link>
            ))}
          </div>
        </details>
      </div>
    </main>
  );
}
