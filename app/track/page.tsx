"use client";

/**
 * /track — Customer order tracking page.
 * Allows customers to look up their order by secure_slug OR customer_phone.
 * Queries /api/order-status for safe public fields.
 */

import { useState, FormEvent } from "react";

interface OrderInfo {
  payment_status: string;
  product_type:   string;
  tier:           string;
  // customer_name intentionally omitted — not returned by public /api/order-status (GDPR/DPDP)
  secure_slug?:   string;
  created_at?:    string;
}

const PRODUCTION_HOURS = 48;

function statusLabel(status: string): { text: string; color: string; bg: string } {
  const map: Record<string, { text: string; color: string; bg: string }> = {
    paid:      { text: "✅ Payment Confirmed",  color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    pending:   { text: "⏳ Payment Pending",    color: "#FFB800", bg: "rgba(255,184,0,0.12)" },
    created:   { text: "⏳ Awaiting Payment",   color: "#FFB800", bg: "rgba(255,184,0,0.12)" },
    failed:    { text: "❌ Payment Failed",     color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    fulfilled: { text: "🎬 Gift Delivered",     color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  };
  return map[status] ?? { text: status, color: "#888", bg: "rgba(255,255,255,0.06)" };
}

export default function TrackPage() {
  const [query,   setQuery]   = useState("");
  const [loading, setLoading] = useState(false);
  const [order,   setOrder]   = useState<OrderInfo | null>(null);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const trimmed = query.trim().toLowerCase().replace(/\s+/g, "");

      // Try by slug first
      const res = await fetch(`/api/order-status?slug=${encodeURIComponent(trimmed)}`);

      if (res.ok) {
        setOrder(await res.json());
      } else if (res.status === 404) {
        // Try phone number lookup
        const phoneRes = await fetch(
          `/api/order-status?phone=${encodeURIComponent(trimmed)}`
        );
        if (phoneRes.ok) {
          setOrder(await phoneRes.json());
        } else {
          setError("No order found. Please check your Order ID or phone number.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const statusInfo = order ? statusLabel(order.payment_status) : null;

  const estReadyAt = order?.created_at
    ? new Date(new Date(order.created_at).getTime() + PRODUCTION_HOURS * 3_600_000)
    : null;
  const hoursLeft = estReadyAt
    ? Math.max(0, Math.ceil((estReadyAt.getTime() - Date.now()) / 3_600_000))
    : null;

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16 text-white"
      style={{ background: "linear-gradient(135deg, #0A0A0B 0%, #12121A 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,184,0,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl mb-3">🎁</div>
          <h1 className="text-3xl font-black">Track Your Order</h1>
          <p className="text-sm" style={{ color: "#9B9BAA" }}>
            Enter your Order ID or registered phone number
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order ID (e.g. OFJFITOF) or phone number"
            className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none placeholder-[#4A4A58] text-white"
            style={{
              background: "#1A1A24",
              border: "1px solid rgba(255,184,0,0.15)",
            }}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="w-full py-3.5 rounded-2xl text-sm font-black transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #FFD700 0%, #FF9A3C 100%)",
              color: "#0A0A0B",
            }}
          >
            {loading ? "Searching…" : "Track Order →"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div
            className="rounded-2xl p-4 text-sm text-center font-medium"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {error}
          </div>
        )}

        {/* Order result */}
        {order && statusInfo && (
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: "linear-gradient(145deg, #1A1A24, #111116)",
              border: "1px solid rgba(255,184,0,0.12)",
            }}
          >
            {/* Status badge */}
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: statusInfo.bg, color: statusInfo.color }}
              >
                {statusInfo.text}
              </span>
            </div>

            {/* Order details */}
            <div className="space-y-2.5 text-sm divide-y divide-white/5">
              <Detail label="Product"   value={order.product_type} />
              <Detail label="Tier"      value={order.tier} highlight />
              {order.secure_slug && (
                <Detail label="Order ID" value={order.secure_slug.toUpperCase()} mono />
              )}
              {order.payment_status === "paid" && hoursLeft !== null && (
                <Detail
                  label="Est. Ready"
                  value={hoursLeft > 0 ? `~${hoursLeft} hours` : "Very soon!"}
                  highlight
                />
              )}
            </div>

            {/* Play link (only if paid) */}
            {order.payment_status === "paid" && order.secure_slug && (
              <a
                href={`/play/${order.secure_slug}`}
                className="block text-center py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "rgba(255,184,0,0.12)", color: "#FFB800" }}
              >
                🎬 Open Gift Experience
              </a>
            )}
          </div>
        )}

        {/* WhatsApp support */}
        <a
          href="https://wa.me/916396151569?text=Hi! I need help with my GiftUnlock order."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "#25D366", color: "#fff" }}
        >
          💬 Need help? Chat on WhatsApp
        </a>

        <p className="text-center text-xs" style={{ color: "#252530" }}>
          GiftUnlock.in — Made with ❤️ in India
        </p>
      </div>
    </main>
  );
}

/* ── Detail row helper ──────────────────────────────────── */
function Detail({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-center pt-2.5 first:pt-0">
      <span className="text-xs" style={{ color: "#4A4A58" }}>
        {label}
      </span>
      <span
        className={`text-xs font-semibold ${mono ? "font-mono" : ""}`}
        style={{ color: highlight ? "#FFB800" : "#fff" }}
      >
        {value}
      </span>
    </div>
  );
}
