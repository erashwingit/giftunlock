"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface OrderStatus {
  payment_status: string;
  order_status:   string | null;
  product_type:   string;
  tier:           string;
  customer_name:  string;
}

const STEPS = [
  { key: "placed",     label: "Order Placed",         icon: "🛒" },
  { key: "paid",       label: "Payment Confirmed",     icon: "✅" },
  { key: "crafting",   label: "Being Crafted",         icon: "🎨" },
  { key: "dispatched", label: "Dispatched",            icon: "🚚" },
];

function resolveStepIndex(order: OrderStatus): number {
  if (order.order_status === "fulfilled")       return 3;
  if (order.order_status === "processing")      return 2;
  if (order.payment_status === "paid")          return 1;
  return 0;
}

/**
 * /track/[slug] — public order tracking page.
 * Polls /api/order-status every 30 s.
 * Only exposes: customer_name, product_type, tier, payment_status, order_status.
 */
export default function TrackSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug]   = useState<string | null>(null);
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /* Resolve async params */
  useEffect(() => {
    params.then(p => setSlug(p.slug.toLowerCase()));
  }, [params]);

  const fetchStatus = useCallback(async (s: string) => {
    try {
      const res = await fetch(`/api/order-status?slug=${encodeURIComponent(s)}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Order not found. Please check your order ID.");
        return;
      }
      setOrder(await res.json());
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError("Could not reach the server. Please try again.");
    }
  }, []);

  /* Initial fetch + polling every 30 s */
  useEffect(() => {
    if (!slug) return;
    fetchStatus(slug);
    const t = setInterval(() => fetchStatus(slug), 30_000);
    return () => clearInterval(t);
  }, [slug, fetchStatus]);

  /* ── Render ── */
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "#0A0A0B", color: "#fff" }}>
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto"
            style={{ background: "rgba(255,184,0,0.12)", border: "1px solid rgba(255,184,0,0.3)" }}>
            📦
          </div>
          <h1 className="text-3xl font-black">Order Tracking</h1>
          {slug && (
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: "#4A4A58" }}>
              {slug.toUpperCase()}
            </p>
          )}
        </div>

        {/* Loading */}
        {!order && !error && (
          <div className="text-center py-10" style={{ color: "#4A4A58" }}>
            <span className="animate-pulse text-4xl">⏳</span>
            <p className="mt-3 text-sm">Looking up your order…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl p-5 text-center space-y-3"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
            <Link href="/track"
              className="inline-block text-xs px-4 py-2 rounded-xl font-bold"
              style={{ background: "rgba(255,184,0,0.1)", color: "#FFB800" }}>
              ← Try another order ID
            </Link>
          </div>
        )}

        {/* Order card */}
        {order && (
          <>
            <div className="rounded-2xl p-5 space-y-1"
              style={{ background: "linear-gradient(145deg,#1A1A24,#111116)", border: "1px solid rgba(255,184,0,0.12)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#4A4A58" }}>Order for</p>
              <p className="text-lg font-black">{order.customer_name}</p>
              <p className="text-sm" style={{ color: "#9B9BAA" }}>
                {order.product_type} · <span style={{ color: order.tier === "NFC VIP" ? "#a855f7" : "#FFB800" }}>{order.tier}</span>
              </p>
            </div>

            {/* 4-step timeline */}
            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const active  = i === resolveStepIndex(order);
                const done    = i < resolveStepIndex(order);
                return (
                  <div key={step.key}
                    className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                    style={{
                      background: active ? "rgba(255,184,0,0.08)" : done ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.02)",
                      border:     active ? "1px solid rgba(255,184,0,0.3)" : done ? "1px solid rgba(34,197,94,0.15)" : "1px solid rgba(255,255,255,0.04)",
                    }}>
                    <span className="text-2xl flex-shrink-0"
                      style={{ opacity: done || active ? 1 : 0.25 }}>
                      {done ? "✅" : step.icon}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-sm"
                        style={{ color: active ? "#FFB800" : done ? "#22c55e" : "#4A4A58" }}>
                        {step.label}
                      </p>
                      {active && (
                        <p className="text-xs mt-0.5" style={{ color: "#9B9BAA" }}>
                          {i === 0 && "We received your order!"}
                          {i === 1 && "Payment successful — production begins now."}
                          {i === 2 && "Your artistic QR is being crafted. 48 hr turnaround."}
                          {i === 3 && "Your gift has been dispatched. Expected in 2–5 days."}
                        </p>
                      )}
                    </div>
                    {active && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                        style={{ background: "rgba(255,184,0,0.12)", color: "#FFB800" }}>
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Last updated */}
            {lastUpdated && (
              <p className="text-center text-xs" style={{ color: "#252530" }}>
                Last updated: {lastUpdated.toLocaleTimeString()} · auto-refreshes every 30s
              </p>
            )}
          </>
        )}

        {/* Back link */}
        <div className="text-center">
          <Link href="/"
            className="text-sm hover:text-white transition-colors"
            style={{ color: "#4A4A58" }}>
            ← Back to GiftUnlock.in
          </Link>
        </div>
      </div>
    </main>
  );
}
