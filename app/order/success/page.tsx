"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, CSSProperties } from "react";
import { CheckCircle2, Clock, Package, Scan, ArrowRight, Lock, Heart } from "lucide-react";

const entry = (delay: number): CSSProperties => ({
  animation: `fadeInUp 0.6s ease ${delay}s both`,
});

/* ─── Inner component (needs searchParams) ────────────── */
function SuccessContent() {
  const params = useSearchParams();
  const slug    = params.get("slug") ?? "";
  const product = params.get("product") ?? "Gift";
  const tier    = params.get("tier") ?? "";
  const name    = params.get("name") ?? "Friend";

  const playUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://giftunlock.in"}/play/${slug}`;

  const timeline = [
    { icon: CheckCircle2, label: "Order confirmed",          done: true,  color: "#FFB800" },
    { icon: Package,      label: "48hr production begins",   done: false, color: "#FF9A3C" },
    { icon: Scan,         label: "QR code crafted & printed",done: false, color: "#FF6B35" },
    { icon: Clock,        label: "Shipped to your door",     done: false, color: "#FFD700" },
  ];

  return (
    <main className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center px-4 py-16">

      {/* Confetti glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,184,0,0.07) 0%, transparent 70%)" }} />

      <div className="relative w-full max-w-md space-y-8">

        {/* Success icon */}
        <div className="flex flex-col items-center gap-3 text-center" style={entry(0)}>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center glow-gold-strong"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)" }}
          >
            <CheckCircle2 size={40} style={{ color: "#0A0A0B" }} />
          </div>
          <h1 className="text-3xl font-black">
            🎉 Order Confirmed,{" "}
            <span className="text-gold-gradient">{name.split(" ")[0]}!</span>
          </h1>
          <p className="text-sm" style={{ color: "#4A4A58" }}>
            Your <strong className="text-white">{product}</strong>
            {tier && <> ({tier})</>} memory is now being crafted with love.
          </p>
        </div>

        {/* Order details */}
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: "linear-gradient(145deg, #1A1A24, #111116)", border: "1px solid rgba(255,184,0,0.12)", ...entry(0.15) }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: "#4A4A58" }}>Order ID</span>
            <span className="font-mono font-bold text-white text-xs">{slug.toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "#4A4A58" }}>Play URL (ready in 48hr)</span>
            <a href={playUrl} className="text-xs font-semibold truncate max-w-[180px]"
              style={{ color: "#FFB800" }} target="_blank" rel="noopener noreferrer">
              giftunlock.in/play/{slug}
            </a>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "#4A4A58" }}>Estimated production</span>
            <span className="font-semibold text-white">48 hours</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3" style={entry(0.25)}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#FFB800" }}>What happens next</p>
          {timeline.map(({ icon: Icon, label, done, color }, i) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: done ? `${color}22` : "rgba(255,184,0,0.05)", border: `1px solid ${done ? color : "rgba(255,184,0,0.1)"}` }}
              >
                <Icon size={15} style={{ color: done ? color : "#333340" }} />
              </div>
              <span className="text-sm" style={{ color: done ? "#F0F0F5" : "#4A4A58" }}>{label}</span>
              {done && <CheckCircle2 size={13} className="ml-auto" style={{ color: "#FFB800" }} />}
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="rounded-xl p-4 text-sm space-y-1"
          style={{ background: "rgba(255,184,0,0.05)", border: "1px solid rgba(255,184,0,0.1)", ...entry(0.35) }}>
          <p className="font-semibold text-white flex items-center gap-1.5">
            <Heart size={13} style={{ color: "#FFB800" }} /> Your QR play link
          </p>
          <p style={{ color: "#4A4A58" }} className="text-xs leading-relaxed">
            Once your video is ready, scanning the QR on your gift will redirect to:{" "}
            <span className="font-mono" style={{ color: "#FFB800" }}>giftunlock.in/play/{slug}</span>.
            Bookmark this link to track status.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3" style={entry(0.4)}>
          <a
            href={`https://wa.me/919999999999?text=Hi! I just placed order ${slug.toUpperCase()} on GiftUnlock.in`}
            target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
            style={{ background: "#25D366", color: "#fff" }}
          >
            💬 Track on WhatsApp
          </a>
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all"
            style={{ border: "1px solid rgba(255,184,0,0.15)", color: "#4A4A58" }}
          >
            <ArrowRight size={14} /> Order another gift
          </Link>
        </div>

        {/* Brand footer */}
        <div className="flex items-center justify-center gap-1.5 pt-2 text-xs" style={{ color: "#252530" }}>
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#FFB800" }}>
            <Lock size={9} style={{ color: "#0A0A0B" }} />
          </div>
          GiftUnlock.in — Made with ❤️ in India
        </div>
      </div>
    </main>
  );
}

/* ─── Page (Suspense boundary for useSearchParams) ──────── */
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-gold-500 border-t-transparent" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
