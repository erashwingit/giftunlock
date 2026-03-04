import Link from "next/link";
import { ReactNode } from "react";
import LogoutButton from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/admin/orders",  label: "Orders",      icon: "📦" },
  { href: "/admin/promos",  label: "Promo Codes",  icon: "🏷️" },
  { href: "/admin/storage", label: "Storage",      icon: "💾" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: "#0A0A0B" }}
    >
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className="w-56 shrink-0 flex flex-col py-6 px-3 gap-1"
        style={{
          background:  "linear-gradient(180deg, #111116, #0E0E14)",
          borderRight: "1px solid rgba(255,184,0,0.08)",
        }}
      >
        {/* Brand */}
        <div className="px-3 pb-6">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)" }}
            >
              🎁
            </div>
            <div>
              <p className="text-xs font-black text-white leading-none">GiftUnlock</p>
              <p className="text-[10px] font-semibold" style={{ color: "#4A4A58" }}>
                Admin
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-white/5"
              style={{ color: "#9090A0" }}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="pt-4 border-t" style={{ borderColor: "rgba(255,184,0,0.08)" }}>
          <LogoutButton />
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
