"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/* ─── Polling logic ────────────────────────────────────── */
function ProcessingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const slug = params.get("slug") ?? "";
  const rzpOrderId = params.get("rzp_order_id") ?? "";

  const [tick, setTick]     = useState(0);
  const [status, setStatus] = useState<"polling" | "success" | "failed">("polling");
  const MAX_ATTEMPTS = 20; // ~60 s

  const checkStatus = useCallback(async () => {
    if (!slug) return;
    try {
      const res  = await fetch(`/api/order-status?slug=${slug}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.payment_status === "paid") {
        setStatus("success");
        const qs = new URLSearchParams({
          slug,
          product: data.product_type ?? "",
          tier:    data.tier          ?? "",
          name:    data.customer_name ?? "",
        });
        setTimeout(() => router.replace(`/order/success?${qs}`), 900);
      } else if (data.payment_status === "failed") {
        setStatus("failed");
      }
    } catch {
      /* silently retry */
    }
  }, [slug, router]);

  useEffect(() => {
    if (!slug || status !== "polling") return;
    checkStatus();
    const id = setInterval(() => {
      setTick(t => {
        const next = t + 1;
        if (next >= MAX_ATTEMPTS) { clearInterval(id); setStatus("failed"); }
        else checkStatus();
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [slug, status, checkStatus]);

  const dots = ".".repeat((tick % 3) + 1).padEnd(3, "\u00A0");

  return (
    <main
      className="min-h-screen text-white flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0A0A0B 0%, #12121A 100%)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,184,0,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm text-center space-y-8">

        {/* ── Polling state ─────────────────────────── */}
        {status === "polling" && (
          <>
            <div className="flex justify-center">
              <div className="relative w-24 h-24">
                <div
                  className="absolute inset-0 rounded-full border-4 animate-spin"
                  style={{
                    borderColor: "rgba(255,184,0,0.1)",
                    borderTopColor: "#FFB800",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-4xl">
                  🎁
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black">Confirming Payment{dots}</h1>
              <p className="text-sm" style={{ color: "#4A4A58" }}>
                Please don't close this window. We're verifying your payment
                with Razorpay.
              </p>
            </div>

            <div
              className="rounded-2xl p-4 space-y-2 text-sm text-left"
              style={{
                background: "linear-gradient(145deg, #1A1A24, #111116)",
                border: "1px solid rgba(255,184,0,0.1)",
              }}
            >
              <div className="flex justify-between">
                <span style={{ color: "#4A4A58" }}>Order ID</span>
                <span className="font-mono font-bold text-xs">{slug.toUpperCase()}</span>
              </div>
              {rzpOrderId && (
                <div className="flex justify-between">
                  <span style={{ color: "#4A4A58" }}>Payment ref</span>
                  <span
                    className="font-mono text-xs truncate max-w-[140px]"
                    style={{ color: "#4A4A58" }}
                  >
                    {rzpOrderId}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: "#4A4A58" }}>Status</span>
                <span
                  className="flex items-center gap-1 font-semibold"
                  style={{ color: "#FFB800" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse inline-block"
                    style={{ background: "#FFB800" }}
                  />
                  Verifying
                </span>
              </div>
            </div>

            <p className="text-xs" style={{ color: "#252530" }}>
              This usually takes a few seconds. You'll be redirected
              automatically.
            </p>
          </>
        )}

        {/* ── Success state ─────────────────────────── */}
        {status === "success" && (
          <>
            <div className="flex justify-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{
                  background:
                    "linear-gradient(135deg, #FFD700, #FF9A3C)",
                  boxShadow: "0 0 60px rgba(255,184,0,0.3)",
                }}
              >
                ✅
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black">Payment Confirmed!</h1>
              <p className="text-sm" style={{ color: "#4A4A58" }}>
                Redirecting to your order confirmation…
              </p>
            </div>
          </>
        )}

        {/* ── Failed state ──────────────────────────── */}
        {status === "failed" && (
          <>
            <div className="flex justify-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
                style={{
                  background: "rgba(255,80,80,0.1)",
                  border: "2px solid rgba(255,80,80,0.3)",
                }}
              >
                ❌
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black">Payment Not Confirmed</h1>
              <p className="text-sm" style={{ color: "#4A4A58" }}>
                We couldn't confirm your payment. If money was deducted,
                contact us on WhatsApp.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={`https://wa.me/919999999999?text=Hi! My GiftUnlock payment for order ${slug.toUpperCase()} wasn't confirmed.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
                style={{ background: "#25D366", color: "#fff" }}
              >
                💬 Contact Support
              </a>
              <a
                href="/"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
                style={{
                  border: "1px solid rgba(255,184,0,0.15)",
                  color: "#4A4A58",
                }}
              >
                Return to Home
              </a>
            </div>
          </>
        )}

      </div>
    </main>
  );
}

/* ─── Page wrapper with Suspense ───────────────────────── */
export default function ProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 rounded-full border-2 border-yellow-400 border-t-transparent" />
        </div>
      }
    >
      <ProcessingContent />
    </Suspense>
  );
}
