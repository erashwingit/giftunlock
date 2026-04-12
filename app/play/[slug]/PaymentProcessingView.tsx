"use client";

import { useEffect, useRef } from "react";

/**
 * PaymentProcessingView — shown when order payment_status is 'pending' or 'created'.
 * Auto-polls /api/payment-status/[slug] every 5 seconds and reloads the page
 * once payment is confirmed, which triggers the play page to redirect to the video.
 */

interface Props {
  slug: string;
}

export default function PaymentProcessingView({ slug }: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // Poll for up to 5 minutes (60 × 5s)

    async function checkStatus() {
      try {
        const res = await fetch(`/api/payment-status/${slug}`, { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();

        // Payment confirmed — reload so play page re-evaluates and redirects to video
        if (data.payment_status === "paid") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          window.location.reload();
          return;
        }

        // Failed — redirect home
        if (data.payment_status === "failed") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          window.location.href = "/";
          return;
        }
      } catch {
        // Network error — keep polling silently
      }

      attempts++;
      if (attempts >= MAX_ATTEMPTS && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    // Start polling after 3 seconds (give Razorpay webhook time to fire)
    const timeout = setTimeout(() => {
      checkStatus(); // immediate first check
      intervalRef.current = setInterval(checkStatus, 5000);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [slug]);

  return (
    <main
      className="min-h-screen text-white flex flex-col items-center justify-center px-4 py-16"
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

      <div className="relative w-full max-w-sm text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{
              background: "linear-gradient(135deg, #1A1A24 0%, #252530 100%)",
              border: "2px solid rgba(255,184,0,0.2)",
              boxShadow: "0 0 40px rgba(255,184,0,0.1)",
            }}
          >
            ⏳
          </div>
        </div>

        {/* Title & message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black">Payment Processing</h1>
          <p className="text-sm leading-relaxed" style={{ color: "#9B9BAA" }}>
            We&apos;re confirming your payment. This usually takes{" "}
            <span style={{ color: "#FFB800" }}>1–2 minutes</span>.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#9B9BAA" }}>
            This page will update automatically once confirmed.
          </p>
        </div>

        {/* Animated pulse indicator */}
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#FFB800" }}
          />
          <span className="text-xs font-mono" style={{ color: "#4A4A58" }}>
            Checking payment status…
          </span>
        </div>

        {/* Order ID pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mx-auto"
          style={{
            background: "rgba(255,184,0,0.08)",
            border: "1px solid rgba(255,184,0,0.15)",
          }}
        >
          <span className="font-mono text-xs font-bold" style={{ color: "#FFB800" }}>
            {slug.toUpperCase()}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 rounded-2xl text-sm font-black transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #FFD700 0%, #FF9A3C 100%)",
              color: "#0A0A0B",
            }}
          >
            🔄 Refresh Page
          </button>

          <a
            href={`https://wa.me/916396151569?text=Hi! My payment for GiftUnlock order ${slug.toUpperCase()} is pending. Please help.`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: "#25D366", color: "#fff" }}
          >
            💬 Contact us on WhatsApp
          </a>
        </div>

        <p className="text-xs" style={{ color: "#252530" }}>
          GiftUnlock.in — Made with ❤️ in India
        </p>
      </div>
    </main>
  );
}
