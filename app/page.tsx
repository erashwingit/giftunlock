"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

/* ─── Fade-up hook ────────────────────────────────────────── */
function useFadeUp(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTimeout(() => setVisible(true), delay * 1000); obs.unobserve(el); } },
      { threshold: 0.08, rootMargin: "-40px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return { ref, visible };
}
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useFadeUp(delay);
  return (
    <div ref={ref} className={className}
      style={{ transition: "opacity 0.65s ease, transform 0.65s ease", transitionDelay: `${delay}s`,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)" }}>
      {children}
    </div>
  );
}

/* ─── QR patterns ─────────────────────────────────────────── */
const QR4 = [[1,0,1,1],[0,1,0,1],[1,1,1,0],[1,0,1,1]] as const;
const QR7 = [[1,1,1,0,1,1,1],[1,0,1,0,1,0,1],[1,1,1,1,1,1,1],[0,1,0,0,0,1,0],[1,1,1,1,1,1,1],[1,0,1,0,1,0,1],[1,1,1,0,1,1,1]] as const;

function QR7Grid({ cellColor, glowColor, cellSize = 10 }: { cellColor: string; glowColor?: string; cellSize?: number }) {
  return (
    <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(7,${cellSize}px)` }}>
      {QR7.flat().map((cell, i) => (
        <div key={i} style={{ width: cellSize, height: cellSize, borderRadius: 2,
          background: cell ? cellColor : "transparent",
          ...(cell && glowColor ? { boxShadow: `0 0 4px ${glowColor}` } : {}) }} />
      ))}
    </div>
  );
}

/* ─── NAVBAR ──────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const links: [string, string][] = [["Home", "/"], ["How It Works", "#how-it-works"], ["Products", "#products"], ["Track Order", "/track"]];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{ background: scrolled ? "rgba(10,10,11,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none", WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,184,0,0.1)" : "none" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-transform group-hover:scale-110"
            style={{ background: "#FFB800", color: "#0A0A0B" }}>🔓</div>
          <span className="font-black text-lg tracking-tight text-white">Gift<span style={{ color: "#FFB800" }}>Unlock</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "#9B9BAA" }}>
          {links.map(([l, h]) => <a key={l} href={h} className="hover:text-white transition-colors">{l}</a>)}
        </div>
        <Link href="/order" className="hidden md:flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
          style={{ background: "#FFB800", color: "#0A0A0B", boxShadow: "0 0 20px rgba(255,184,0,0.25)" }}>Order Now →</Link>
        <button className="md:hidden text-white text-xl p-1" onClick={() => setOpen(!open)} aria-label="menu">{open ? "✕" : "☰"}</button>
      </div>
      {open && (
        <div className="md:hidden px-4 pb-5 pt-2 flex flex-col gap-2"
          style={{ background: "rgba(10,10,11,0.98)", borderBottom: "1px solid rgba(255,184,0,0.1)" }}>
          {links.map(([l, h]) => <a key={l} href={h} className="py-2.5 text-sm border-b"
            style={{ color: "#9B9BAA", borderColor: "rgba(255,184,0,0.06)" }} onClick={() => setOpen(false)}>{l}</a>)}
          <Link href="/order" className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
            style={{ background: "#FFB800", color: "#0A0A0B" }} onClick={() => setOpen(false)}>Order Now →</Link>
        </div>
      )}
    </nav>
  );
}

/* ─── URGENCY BANNER ─────────────────────────────────────── */
function UrgencyBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{ background: "#7c3aed", color: "#ffffff", fontSize: "14px", padding: "8px 16px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <span>🎉 Mother&apos;s Day is May 11 — Order by May 8 to guarantee delivery!</span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>
        ✕
      </button>
    </div>
  );
}

/* ─── HERO ────────────────────────────────────────────────── */
function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-16" style={{ background: "#0A0A0B" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(255,184,0,0.07) 0%, transparent 70%)" }} />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid #f59e0b", color: "#f59e0b" }}>
            ✨ AI-Crafted · Artistic QR · Ships Pan India in 48hr
          </span>
        </div>
        <div className="text-center space-y-5 mb-14">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white">
            Your Memories, <span style={{ color: "#FFB800" }}>Recreated by AI.</span>{" "}Unlocked by a Scan. ❤️
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "#9B9BAA" }}>
            Turn your photos &amp; videos into a premium gift with a stunning artistic QR
          </p>
        </div>
        <div className="flex items-center justify-center gap-8 sm:gap-16 mb-14">
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9B9BAA" }}>Boring QR</span>
            <div className="p-3 rounded-xl" style={{ background: "#E5E5E5" }}>
              <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(4,14px)" }}>
                {QR4.flat().map((c, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c ? "#2A2A2A" : "transparent" }} />)}
              </div>
            </div>
            <p className="text-xs" style={{ color: "#555566" }}>Generic. Forgettable.</p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
            style={{ background: "rgba(255,184,0,0.12)", border: "2px solid rgba(255,184,0,0.35)", color: "#FFB800" }}>VS</div>
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
              style={{ background: "rgba(255,184,0,0.1)", border: "1px solid rgba(255,184,0,0.3)", color: "#FFB800" }}>GiftUnlock QR</span>
            <div className="p-3 rounded-xl"
              style={{ background: "#111116", border: "2px solid rgba(255,184,0,0.45)", boxShadow: "0 0 30px rgba(255,184,0,0.2)" }}>
              <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(4,14px)" }}>
                {QR4.flat().map((c, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 3,
                  background: c ? "#FFB800" : "transparent",
                  boxShadow: c ? "0 0 6px rgba(255,184,0,0.85), 0 0 2px #FFB800" : "none" }} />)}
              </div>
            </div>
            <p className="text-xs font-semibold" style={{ color: "#FFB800" }}>Stunning. Scans perfectly. ✨</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/order" className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#FFD700,#FFB800,#FF9A3C)", color: "#0A0A0B", boxShadow: "0 0 32px rgba(255,184,0,0.3)" }}>
            🎁 Create Your Memory Gift
          </Link>
          <a href="#how-it-works" className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all"
            style={{ border: "1px solid rgba(255,184,0,0.2)", color: "#9B9BAA" }}>▶ How It Works</a>
        </div>
      </div>
    </section>
  );
}

/* ─── SPLIT-SCREEN DEMO  (Fix 2: YouTube preview modal) ──── */
function SplitScreenDemo() {
  const [pulse, setPulse] = useState(false);
  // Fix 2 — modal state for YouTube preview
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModalOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  return (
    <section className="py-24" style={{ background: "rgba(10,10,11,0.99)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-14 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>Live Demo</p>
          <h2 className="text-4xl font-black text-white">See the Magic Before You Order</h2>
          <p className="max-w-2xl mx-auto" style={{ color: "#9B9BAA" }}>
            Every product ships with a 100% scannable AI-crafted festive artistic QR (Haldi/Holi style)
          </p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* LEFT — product mockup */}
          <FadeUp delay={0.1} className="flex flex-col items-center gap-4">
            <div className="relative p-6 rounded-2xl flex flex-col items-center gap-4 w-full max-w-[200px] mx-auto"
              style={{ background: "linear-gradient(145deg,#1a1500,#0d0d14)", border: "2px solid rgba(255,184,0,0.35)", boxShadow: "0 0 40px rgba(255,184,0,0.1)" }}>
              <div className="relative w-28 h-24 flex items-center justify-center">
                <svg viewBox="0 0 100 88" className="w-full h-full" fill="none"
                  aria-label="GiftUnlock personalized memory T-shirt with Holi artistic QR code">
                  <path d="M30 12 L10 28 L22 35 L22 80 L78 80 L78 35 L90 28 L70 12 L62 20 C60 25 55 28 50 28 C45 28 40 25 38 20 Z"
                    fill="#1e1e2e" stroke="rgba(255,184,0,0.35)" strokeWidth="1.5" />
                </svg>
                <div className="absolute bottom-1">
                  <QR7Grid cellColor="#FFD700" glowColor="rgba(255,215,0,0.6)" cellSize={5} />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-white">GiftUnlock T-Shirt</p>
                <p className="text-[10px]" style={{ color: "#9B9BAA" }}>Holi artistic QR printed</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-center" style={{ color: "#FFB800" }}>Artistic QR on your product 🎨</p>
          </FadeUp>

          {/* CENTER — scan arrow */}
          <FadeUp delay={0.2} className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center gap-2" style={{ animation: "pulse 2s ease-in-out infinite" }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: "rgba(255,184,0,0.12)", border: "2px solid rgba(255,184,0,0.3)", boxShadow: "0 0 20px rgba(255,184,0,0.15)" }}>📲</div>
              <p className="text-sm font-black text-white">One Scan →</p>
              <div className="flex flex-col items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-0.5 rounded" style={{ width: 18 + i * 7, background: "#FFB800", opacity: 0.3 + i * 0.3 }} />
                ))}
              </div>
            </div>
          </FadeUp>

          {/* RIGHT — phone mockup + Fix 2 preview button */}
          <FadeUp delay={0.3} className="flex flex-col items-center gap-4">
            <div className="relative mx-auto" style={{ width: 120, height: 220 }}>
              <div className="absolute inset-0 rounded-3xl overflow-hidden"
                style={{ background: "#0d0d14", border: "3px solid rgba(255,184,0,0.3)",
                  boxShadow: `0 0 ${pulse ? 40 : 20}px rgba(255,184,0,${pulse ? 0.25 : 0.1})`, transition: "box-shadow 1s ease" }}>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-full" style={{ background: "#252530" }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 pt-6 pb-4">
                  <div className="text-[8px] font-black text-center" style={{ color: "#FF0000" }}>▶ YouTube</div>
                  <div className="w-full rounded-lg flex items-center justify-center" style={{ height: 68,
                    background: pulse ? "linear-gradient(135deg,#1a0533,#0d1a0d)" : "linear-gradient(135deg,#0d0d14,#1a0533)",
                    transition: "background 1s ease" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: pulse ? "#FFB800" : "rgba(255,184,0,0.6)", transition: "all 0.5s ease" }}>
                      <span style={{ fontSize: 13, color: "#0A0A0B" }}>▶</span>
                    </div>
                  </div>
                  <div className="w-full space-y-1">
                    {[80, 58].map((w, i) => <div key={i} className="h-1.5 rounded" style={{ width: `${w}%`, background: "rgba(255,255,255,0.12)" }} />)}
                  </div>
                  <div className="w-full h-1 rounded" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded" style={{ width: pulse ? "65%" : "42%", background: "#FF0000", transition: "width 1.5s ease" }} />
                  </div>
                  <p className="text-[7px] text-center font-semibold" style={{ color: "#FFB800" }}>Memory playing... ❤️</p>
                </div>
              </div>
            </div>

            {/* Fix 2 — label + preview button */}
            <p className="text-sm font-semibold text-center" style={{ color: "#9B9BAA" }}>
              Real memory. Real reaction. Scan yourself 👆
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: "rgba(255,0,0,0.12)", border: "1px solid rgba(255,0,0,0.3)", color: "#ff6b6b" }}>
              ▶ Preview a real memory
            </button>
          </FadeUp>
        </div>

        <FadeUp delay={0.4} className="text-center mt-12">
          <Link href="/order" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg,#FFD700,#FFB800,#FF9A3C)", color: "#0A0A0B", boxShadow: "0 0 32px rgba(255,184,0,0.3)" }}>
            Order Your Memory Gift →
          </Link>
        </FadeUp>
      </div>

      {/* Fix 2 — YouTube lightbox modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
          onClick={() => setModalOpen(false)}>
          <div className="relative w-full max-w-[280px]" onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute -top-10 right-0 text-white text-2xl font-black transition-opacity hover:opacity-70"
              aria-label="Close preview">✕</button>

            {/* Phone-frame wrapper for embed */}
            <div className="relative rounded-3xl overflow-hidden"
              style={{ border: "3px solid rgba(255,184,0,0.45)", boxShadow: "0 0 60px rgba(255,184,0,0.25)", background: "#0d0d14" }}>
              {/* Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full z-10" style={{ background: "#252530" }} />
              {/*
                TODO: Replace DEMO_VIDEO_ID with the real GiftUnlock demo YouTube unlisted video ID.
                Example: src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1&playlist=dQw4w9WgXcQ&controls=0&rel=0"
              */}
              <iframe
                src="https://www.youtube.com/embed/DEMO_VIDEO_ID?autoplay=1&mute=1&loop=1&playlist=DEMO_VIDEO_ID&controls=0&rel=0"
                style={{ borderRadius: 20, width: "100%", aspectRatio: "9/16", display: "block", marginTop: 4 }}
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="GiftUnlock — real memory demo video"
              />
            </div>
            <p className="text-center text-sm mt-4 font-semibold" style={{ color: "#9B9BAA" }}>
              Real memory. Real reaction. ❤️
            </p>
            <p className="text-center text-xs mt-1" style={{ color: "#555566" }}>
              Tap outside or press Esc to close
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── QR TRUST STRIP ─────────────────────────────────────── */
function QrTrustStrip() {
  const steps = [
    { icon: "🔲", num: "Step 1", title: "Standard QR generated",          desc: "A perfect scannable QR pointing to your private memory video." },
    { icon: "🎨", num: "Step 2", title: "AI stylizes in Haldi/Holi art",   desc: "AI transforms it into vivid festive artwork — marigolds, colour splashes, your occasion." },
    { icon: "✅", num: "Step 3", title: "100% scan-tested on paper",       desc: "We physically print & scan-test every QR before your order ships." },
  ];
  return (
    <section className="py-12" style={{ background: "linear-gradient(135deg,#180e00,#261500,#1a1000)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map(({ icon, num, title, desc }, i) => (
            <FadeUp key={num} delay={i * 0.1} className="flex flex-col items-center text-center gap-3">
              <span className="text-4xl">{icon}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#FF9A3C" }}>{num}</p>
                <p className="font-black text-white mt-1 text-sm">{title}</p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#C4913A" }}>{desc}</p>
            </FadeUp>
          ))}
        </div>
        <FadeUp delay={0.4} className="text-center mt-8">
          <p className="text-xs" style={{ color: "#8A6030" }}>Every QR is manually verified to scan perfectly before your order ships.</p>
        </FadeUp>
      </div>
    </section>
  );
}

/* ─── QR SHOWCASE ─────────────────────────────────────────── */
function QrShowcase() {
  const themes = [
    { label: "Haldi 🌼",       bg: "linear-gradient(145deg,#1a1500,#0d0c00)", border: "rgba(255,210,0,0.4)",  glow: "rgba(255,210,0,0.15)",  cellColor: "#FFD700", glowColor: "rgba(255,215,0,0.75)",  tagBg: "rgba(255,210,0,0.1)",  tagColor: "#FFD700" },
    { label: "Anniversary ❤️", bg: "linear-gradient(145deg,#1a0008,#0d000a)", border: "rgba(255,55,75,0.4)",  glow: "rgba(255,55,75,0.15)",  cellColor: "#FF3355", glowColor: "rgba(255,55,75,0.75)",  tagBg: "rgba(255,55,75,0.1)",  tagColor: "#FF3355" },
    { label: "Birthday 🎂",    bg: "linear-gradient(145deg,#0e0018,#07000d)", border: "rgba(178,80,255,0.4)", glow: "rgba(178,80,255,0.15)", cellColor: "#B250FF", glowColor: "rgba(178,80,255,0.75)", tagBg: "rgba(178,80,255,0.1)", tagColor: "#B250FF" },
  ];
  return (
    <section id="qr-showcase" className="py-24" style={{ background: "rgba(10,10,11,0.98)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-14 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>Artistic QR Technology</p>
          <h2 className="text-4xl font-black text-white">Not a Boring Black Square</h2>
          <p className="max-w-xl mx-auto" style={{ color: "#9B9BAA" }}>
            Every GiftUnlock QR is hand-crafted for your occasion — vivid, themed, and still scans perfectly every time.
          </p>
        </FadeUp>
        <div className="grid sm:grid-cols-3 gap-6">
          {themes.map(({ label, bg, border, glow, cellColor, glowColor, tagBg, tagColor }, i) => (
            <FadeUp key={label} delay={i * 0.12}>
              <div className="flex flex-col items-center gap-5 p-8 rounded-2xl"
                style={{ background: bg, border: `1px solid ${border}`, boxShadow: `0 0 48px ${glow}` }}>
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: tagBg, color: tagColor, border: `1px solid ${border}` }}>{label}</span>
                <QR7Grid cellColor={cellColor} glowColor={glowColor} cellSize={11} />
                <p className="text-xs text-center" style={{ color: "#9B9BAA" }}>AI-crafted festive artistic QR (Haldi/Holi style) ✨</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { num: "01", emoji: "📸", title: "Upload Memories",    desc: "Share your photos and video clips — birthdays, weddings, trips, anything that matters.", color: "#FFB800" },
    { num: "02", emoji: "🎨", title: "We Craft Your QR",   desc: "Our team creates a cinematic memory video and generates your stunning artistic QR code.", color: "#FF9A3C" },
    { num: "03", emoji: "📦", title: "Print & Ship in 48hr",desc: "Your QR is printed on your chosen premium gift and shipped across India within 48 hours.", color: "#FF6B35" },
    { num: "04", emoji: "📱", title: "Scan & Unlock",      desc: "One scan. The memory plays instantly. Tears guaranteed — the happy kind. ❤️",            color: "#FFD700" },
  ];
  return (
    <section id="how-it-works" className="py-24" style={{ background: "#0A0A0B" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-16 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>Simple. Magical. 4 Steps.</p>
          <h2 className="text-4xl font-black text-white">How <span style={{ color: "#FFB800" }}>GiftUnlock</span> Works</h2>
          <p className="max-w-xl mx-auto" style={{ color: "#9B9BAA" }}>Four steps. One scan. A memory that lasts forever.</p>
        </FadeUp>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map(({ num, emoji, title, desc, color }, i) => (
            <FadeUp key={num} delay={i * 0.12}>
              <div className="relative p-6 rounded-2xl h-full flex flex-col gap-4 transition-transform hover:scale-[1.02]"
                style={{ background: "linear-gradient(145deg,#1A1A24,#111116)", border: "1px solid rgba(255,184,0,0.1)" }}>
                <span className="absolute top-4 right-5 text-5xl font-black select-none" style={{ color, opacity: 0.08 }}>{num}</span>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}>{emoji}</div>
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-base">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#9B9BAA" }}>{desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ─── PRODUCTS ─────────────────────────────────────────────── */
function Products() {
  const products = [
    { emoji: "👕", name: "T-Shirt",       price: "₹899",   tag: "Best Seller", alt: "GiftUnlock personalized memory T-shirt with Holi artistic QR code" },
    { emoji: "🍺", name: "Beer Mug",      price: "₹799",   tag: null,          alt: "GiftUnlock personalized memory beer mug with Haldi artistic QR code" },
    { emoji: "😷", name: "Face Mask",     price: "₹499",   tag: null,          alt: "GiftUnlock personalized memory face mask with artistic QR code" },
    { emoji: "🛋️", name: "Cushion",       price: "₹699",   tag: null,          alt: "GiftUnlock personalized memory cushion with artistic QR code" },
    { emoji: "☕", name: "Coffee Mug",    price: "₹699",   tag: null,          alt: "GiftUnlock personalized memory coffee mug with artistic QR code" },
    { emoji: "💧", name: "Water Bottle",  price: "₹899",   tag: null,          alt: "GiftUnlock personalized memory water bottle with artistic QR code" },
  ];
  return (
    <section id="products" className="py-24" style={{ background: "rgba(17,17,22,0.4)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-16 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>Choose Your Canvas</p>
          <h2 className="text-4xl font-black text-white">Premium Gifts, <span style={{ color: "#FFB800" }}>Emotional Stories</span></h2>
          <p className="max-w-xl mx-auto" style={{ color: "#9B9BAA" }}>Every product is a canvas for a memory that plays with one scan.</p>
        </FadeUp>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map(({ emoji, name, price, tag, alt }, i) => (
            <FadeUp key={name} delay={i * 0.08}>
              <div className="relative p-6 rounded-2xl flex flex-col gap-4 h-full transition-transform hover:scale-[1.02]"
                style={{ background: "linear-gradient(145deg,#1A1A24,#111116)", border: "1px solid rgba(255,184,0,0.1)" }}>
                {tag && <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#FFB800", color: "#0A0A0B" }}>{tag}</span>}
                <div className="text-4xl" role="img" aria-label={alt}>{emoji}</div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-white text-base">{name}</h3>
                  <p className="text-xl font-black" style={{ color: "#FFB800" }}>{price}</p>
                </div>
                <Link href="/order" className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: "#FFB800", color: "#0A0A0B" }}>Order Now →</Link>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── STATS ───────────────────────────────────────────────── */
function Stats() {
  const stats = [
    { value: "500+",      label: "Memories Created", emoji: "🎬" },
    { value: "4.9 ★",    label: "Average Rating",   emoji: "⭐" },
    { value: "48hr",      label: "Production Time",  emoji: "⚡" },
    { value: "Pan India", label: "Shipping",         emoji: "🚚" },
  ];
  return (
    <section className="py-14 border-y" style={{ borderColor: "rgba(255,184,0,0.08)", background: "rgba(17,17,22,0.6)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map(({ value, label, emoji }, i) => (
          <FadeUp key={label} delay={i * 0.1} className="flex flex-col items-center text-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <span className="text-3xl font-black" style={{ color: "#FFB800" }}>{value}</span>
            <span className="text-xs uppercase tracking-wider" style={{ color: "#9B9BAA" }}>{label}</span>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ───────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    { quote: "My dad cried when he scanned the QR on his mug. Best birthday gift I have ever given.", name: "Priya S.",  city: "Mumbai",    initial: "P" },
    { quote: "The artistic QR was stunning. Every guest at the party kept asking where I got it from.", name: "Rohan K.",  city: "Delhi",     initial: "R" },
    { quote: "All 8 of us uploaded college memories. One QR, one gift, one hundred happy tears. 😭",  name: "Anjali M.", city: "Bangalore", initial: "A" },
  ];
  return (
    <section className="py-24" style={{ background: "#0A0A0B" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-16 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>Real Stories</p>
          <h2 className="text-4xl font-black text-white">Tears of <span style={{ color: "#FFB800" }}>Pure Joy</span></h2>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map(({ quote, name, city, initial }, i) => (
            <FadeUp key={name} delay={i * 0.12}>
              <div className="p-6 rounded-2xl h-full flex flex-col gap-4"
                style={{ background: "linear-gradient(145deg,#1A1A24,#111116)", border: "1px solid rgba(255,184,0,0.1)" }}>
                <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, j) => <span key={j} style={{ color: "#FFB800", fontSize: 14 }}>★</span>)}</div>
                <p className="text-sm leading-relaxed flex-1 italic" style={{ color: "#9B9BAA" }}>&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "rgba(255,184,0,0.08)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: "#FFB800", color: "#0A0A0B" }}>{initial}</div>
                  <div>
                    <p className="font-semibold text-sm text-white">{name}</p>
                    <p className="text-xs" style={{ color: "#9B9BAA" }}>{city}</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TRUST BAR ───────────────────────────────────────────── */
function TrustBar() {
  const items = [
    { emoji: "🔒", label: "Razorpay Secured" },
    { emoji: "📦", label: "100% Scannable Guarantee" },
    { emoji: "🔄", label: "Free Reprint if QR Fails" },
    { emoji: "🚚", label: "Pan India Delivery" },
    { emoji: "⏱", label: "48hr Turnaround" },
  ];
  return (
    <section className="py-8"
      style={{ background: "rgba(8,8,9,0.99)", borderTop: "1px solid rgba(255,184,0,0.06)", borderBottom: "1px solid rgba(255,184,0,0.06)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
          {items.map(({ emoji, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-lg">{emoji}</span>
              <span className="text-xs font-semibold text-white">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER  (Fix 3: trust line + trust icons) ──────────── */
function Footer() {
  const navLinks: [string, string][] = [
    ["Home", "/"], ["How It Works", "#how-it-works"], ["Products", "#products"],
    ["Privacy Policy", "/privacy"],
  ];
  return (
    <footer className="py-12 border-t" style={{ borderColor: "rgba(255,184,0,0.1)", background: "rgba(10,10,11,0.99)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{ background: "#FFB800", color: "#0A0A0B" }}>🔓</div>
              <span className="font-black text-lg tracking-tight text-white">Gift<span style={{ color: "#FFB800" }}>Unlock</span></span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#9B9BAA" }}>
              Unlock the Memory They Will Never Forget
            </p>
            {/* Trust icons */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
              {[["🔒", "Razorpay Secured"], ["🚚", "Pan India Delivery"], ["⏱", "48hr Turnaround"]].map(([e, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <span className="text-sm">{e}</span>
                  <span className="text-xs" style={{ color: "#555566" }}>{l}</span>
                </div>
              ))}
            </div>
            <a
              href="https://wa.me/916396151569"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              💬 WhatsApp Support
            </a>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-white uppercase tracking-wider">Product</p>
            <div className="space-y-2">
              {[["Order Now", "/order"], ["How It Works", "#how-it-works"], ["Products", "#products"], ["Pricing", "#pricing"]].map(
                ([label, href]) => (
                  <a key={label} href={href} className="block text-sm hover:text-white transition-colors" style={{ color: "#4A4A58" }}>
                    {label}
                  </a>
                )
              )}
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white uppercase tracking-wider">Quick Links</p>
            <div className="space-y-2">
              {navLinks.map(([l, h]) => (
                <a key={l} href={h} className="block text-sm hover:text-white transition-colors" style={{ color: "#9B9BAA" }}>{l}</a>
              ))}
            </div>
          </div>

          {/* Made in Delhi */}
          <div className="space-y-3">
            <p style={{ color: '#f59e0b', fontWeight: 700, fontSize: '16px', textShadow: '0 0 8px rgba(245,158,11,0.5)' }}>❤️ Made in Delhi</p>
            <p className="text-sm" style={{ color: "#9B9BAA" }}>✨ AI-crafted festive artistic QR (Haldi/Holi style)</p>
            <p className="text-xs leading-relaxed" style={{ color: "#555566" }}>
              Delhi/NCR same-day DTF printing by our partner · 100% Scannable Guarantee · Free reprint if QR fails
            </p>
            <div className="flex gap-4 pt-1">
              <a href="https://instagram.com/giftunlock" target="_blank" rel="noopener noreferrer"
                className="text-xl transition-transform hover:scale-110" title="Instagram">📸</a>
              <a href="https://wa.me/916396151569" target="_blank" rel="noopener noreferrer"
                className="text-xl transition-transform hover:scale-110" title="WhatsApp">💬</a>
            </div>
          </div>
        </div>

        {/* Fix 3 — centered trust line */}
        <p className="text-center text-xs py-4 border-t border-b" style={{ borderColor: "rgba(255,184,0,0.04)", color: "#3A3A4A" }}>
          Same-day DTF printing in Delhi/NCR by our trusted partner · Zero recurring cost · Lifetime video hosting · 100% Scannable Guarantee
        </p>

        {/* Copyright row */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ color: "#555566" }}>
          <span>© 2026 GiftUnlock · All rights reserved</span>
          <div className="flex items-center gap-4">
            <a href="https://instagram.com/giftunlock" target="_blank" rel="noopener noreferrer" className="text-lg hover:text-white transition-colors">📸</a>
            <a href="https://wa.me/916396151569" target="_blank" rel="noopener noreferrer" className="text-lg hover:text-white transition-colors">💬</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── ROOT PAGE ────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <main className="min-h-screen text-white overflow-x-hidden" style={{ background: "#0A0A0B" }}>
      <Navbar />
      <div className="pt-16">
        <UrgencyBanner />
      </div>
      <Hero />
      <SplitScreenDemo />
      <QrTrustStrip />
      <QrShowcase />
      <HowItWorks />
      <Products />
      <Stats />
      <Testimonials />
      <TrustBar />
      <Footer />
      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/916396151569"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "#25D366", borderRadius: "50%", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(37,211,102,0.4)", textDecoration: "none", fontSize: 28 }}>
        💬
      </a>
    </main>
  );
}


