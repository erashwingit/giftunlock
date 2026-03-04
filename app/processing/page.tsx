"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, CSSProperties } from "react";
import Link from "next/link";
import { Clock, Sparkles, CheckCircle2, Film, QrCode, Truck } from "lucide-react";

const entry = (delay: number): CSSProperties => ({
  animation: `fadeInUp 0.6s ease ${delay}s both`,
});

function ProcessingContent() {
  const params = useSearchParams();
  const slug = params.get("slug") ?? "";

  const steps = [
    { icon: CheckCircle2, label: "Order confirmed & paid",      done: true,  color: "#16a34a" },
    { icon: Film,         label: "Crafting your memory video",  done: false, color: "#FFB800" },
    { icon: QrCode,       label: "Designing festive QR code",   done: false, color: "#FF9A3C" },
    { icon: Truck,        label: "Printing & shipping your gift", done: false, color: "#FF6B35" },
  ];

  return (
    <main className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,184,0,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md space-y-8">
        {/* Animated icon */}
        <div className="flex flex-col items-center gap-4 text-center" style={entry(0)}>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,184,0,0.08)",
              border: "2px solid rgba(255,184,0,0.2)",
              animation: "pulse-ring 2.5s ease-in-out infinite",
            }}
          >
            <Sparkles size={36} style={{ color: "#FFB800" }} />
          </div>

          <h1 className="text-3xl font-black">
            Your Memory is{" "}
            <span className="text-gold-gradient">Being Crafted</span> 🎬
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#4A4A58" }}>
            Our team is lovingly creating your cinematic memory video.
            This usually takes{" "}
            <strong className="text-white">24–48 hours</strong> from order confirmation.
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-3" style={entry(0.15)}>
          {steps.map(({ icon: Icon, label, done, color }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: done ? "rgba(22,163,74,0.06)" : "rgba(17,17,22,0.8)",
                border: `1px solid ${done ? "rgba(22,163,74,0.2)" : "rgba(255,184,0,0.06)"}`,
              }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: done ? "rgba(22,163,74,0.15)" : "rgba(255,184,0,0.07)",
                  border: `1px solid ${done ? "rgba(22,163,74,0.3)" : "rgba(255,184,0,0.12)"}`,
                }}
              >
                <Icon size={15} style={{ color: done ? "#16a34a" : color }} />
              </div>
              <span className="text-sm flex-1" style={{ color: done ? "#F0F0F5" : "#4A4A58" }}>
                {label}
              </span>
              {done && (
                <CheckCircle2 size={14} style={{ color: "#16a34a" }} />
              )}
              {!done && (
                <Clock size={13} style={{ color: "#333340" }} />
              )}
            </div>
          ))}
        </div>

        {/* Slug info box */}
        {slug && (
          <div
            className="rounded-xl p-4 space-y-2"
            style={{
              background: "rgba(255,184,0,0.04)",
              border: "1px solid rgba(255,184,0,0.12)",
              ...entry(0.25),
            }}
          >
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#FFB800" }}>
              Bookmark your play link
            </p>
            <p className="font-mono text-sm font-bold text-white break-all">
              giftunlock.in/play/{slug}
            </p>
            <p className="text-xs" style={{ color: "#4A4A58" }}>
              Once your video is ready, scanning the QR on your gift will take you here.
              This link will work forever.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3" style={entry(0.35)}>
          <a
            href="https://wa.me/916396151569"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
            style={{ background: "#25D366", color: "#fff" }}
          >
            💬 WhatsApp Us for Status
          </a>
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all"
            style={{ border: "1px solid rgba(255,184,0,0.15)", color: "#4A4A58" }}
          >
            ← Back to GiftUnlock.in
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(255,184,0,0.2)", borderTopColor: "#FFB800" }}
          />
        </div>
      }
    >
      <ProcessingContent />
    </Suspense>
  );
}
