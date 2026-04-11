"use client";

/**
 * PaymentProcessingView — shown when order payment_status is 'pending' or 'created'.
 * Replaces the previous redirect("/") behaviour with a friendly waiting page.
 */

interface Props {
  slug: string;
}

export default function PaymentProcessingView({ slug }: Props) {
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
            Your gift link will work shortly. If this persists after 5 minutes,
            contact us on WhatsApp.
          </p>
        </div>

        {/* Order ID pill */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mx-auto"
          style={{
            background: "rgba(255,184,0,0.08)",
            border: "1px solid rgba(255,184,0,0.15)",
          }}
        >
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#FFB800" }}
          />
          <span className="font-mono text-xs font-bold" style={{ color: "#FFB800" }}>
            {slug.toUpperCase()}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {/* Refresh */}
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

          {/* WhatsApp */}
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
