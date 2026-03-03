"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight, Star, Zap, ScanLine, Play, Heart, Clock, Truck,
  Shield, Lock, Upload, Film, Gift, Menu, X, ChevronRight,
  Sparkles, QrCode, Smartphone, CheckCircle2,
} from "lucide-react";

/* ─── Scroll-triggered fade-up ──────────────────────────── */
function useFadeUp(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay * 1000);
          obs.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "-40px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return { ref, visible };
}

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useFadeUp(delay);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.65s ease, transform 0.65s ease`,
        transitionDelay: `${delay}s`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
      }}
    >
      {children}
    </div>
  );
}

/* ─── CSS QR mockup ─────────────────────────────────────── */
function QRMockup() {
  const pattern = [
    [1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 1, 0, 0, 0, 1, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1],
  ];
  return (
    <div className="p-2 bg-white rounded-lg inline-block shadow-lg">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
        {pattern.flat().map((cell, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-[1px]"
            style={{ background: cell ? "#FFB800" : "transparent" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Hero visual ───────────────────────────────────────── */
function HeroVisual() {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(42), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="relative w-full flex items-center justify-center"
      style={{ minHeight: 420 }}
    >
      {/* Glow blob */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 55% 50%, rgba(255,184,0,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Product card */}
      <div
        className="animate-float relative z-10 rounded-3xl p-6 flex flex-col items-center gap-4 glow-gold"
        style={{
          background: "linear-gradient(145deg, #1A1A24, #111116)",
          border: "1px solid rgba(255,184,0,0.3)",
          width: 220,
          animation: "float 4s ease-in-out infinite",
        }}
      >
        <div
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
          style={{ color: "#FFB800" }}
        >
          <Sparkles size={11} /> Premium T-Shirt
        </div>

        <div className="relative w-32 h-28 flex items-center justify-center">
          <svg viewBox="0 0 100 88" className="w-full h-full" fill="none">
            <path
              d="M30 12 L10 28 L22 35 L22 80 L78 80 L78 35 L90 28 L70 12 L62 20 C60 25 55 28 50 28 C45 28 40 25 38 20 Z"
              fill="#1e1e2e"
              stroke="rgba(255,184,0,0.35)"
              strokeWidth="1.5"
            />
          </svg>
          <div className="absolute bottom-3">
            <QRMockup />
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs" style={{ color: "#4A4A58" }}>
          <ScanLine size={11} style={{ color: "#FFB800" }} />
          Scan to unlock memory
        </div>
      </div>

      {/* Connector */}
      <div className="relative z-10 flex flex-col items-center gap-1 mx-3">
        <div
          className="w-px h-8"
          style={{ background: "linear-gradient(to bottom, transparent, #FFB800)" }}
        />
        <div
          className="rounded-full p-1"
          style={{
            color: "#FFB800",
            animation: "pulse-ring 2s ease-in-out infinite",
          }}
        >
          <Smartphone size={18} />
        </div>
        <div
          className="w-px h-8"
          style={{ background: "linear-gradient(to bottom, #FFB800, transparent)" }}
        />
      </div>

      {/* Phone mockup */}
      <div className="relative z-10">
        <div
          className="relative overflow-hidden"
          style={{
            width: 105,
            height: 195,
            borderRadius: 26,
            background: "#0d0d14",
            border: "2px solid rgba(255,184,0,0.3)",
            boxShadow: "0 0 30px rgba(255,184,0,0.15), inset 0 0 20px rgba(0,0,0,0.4)",
          }}
        >
          {/* Notch */}
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 z-10 rounded-full"
            style={{ width: 28, height: 6, background: "#252530" }}
          />

          {/* Video screen */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: "linear-gradient(160deg, #1a0533 0%, #0d0d14 55%, #0a1a0d 100%)",
            }}
          >
            <div className="absolute top-8 left-2 right-2 space-y-1.5 opacity-25">
              {[90, 55, 75, 45].map((w, i) => (
                <div
                  key={i}
                  className="h-1 rounded"
                  style={{ width: `${w}%`, background: "rgba(255,255,255,0.4)" }}
                />
              ))}
            </div>

            {/* Play button */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: "#FFB800",
                animation: "pulse-ring 2s ease-in-out infinite",
              }}
            >
              <Play size={13} style={{ color: "#0A0A0B", fill: "#0A0A0B" }} className="ml-0.5" />
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-6 left-3 right-3">
              <div className="h-0.5 rounded" style={{ background: "#252530" }}>
                <div
                  className="h-full rounded"
                  style={{
                    background: "#FFB800",
                    width: `${barWidth}%`,
                    transition: "width 2s ease-out",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Scan line */}
          <div
            className="scan-line absolute left-0 right-0 h-0.5 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, #FFB800, transparent)",
              boxShadow: "0 0 8px #FFB800",
            }}
          />
        </div>

        {/* Badge */}
        <div
          className="absolute -bottom-3 -right-8 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
          style={{
            background: "linear-gradient(90deg, #FFB800, #FF9A3C)",
            color: "#0A0A0B",
            animation: "fadeInScale 0.4s ease 1.6s both",
          }}
        >
          <Heart size={8} style={{ fill: "#0A0A0B" }} />
          Memory playing!
        </div>
      </div>
    </div>
  );
}

/* ─── NAVBAR ────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    ["How It Works", "#how-it-works"],
    ["Products", "#products"],
    ["Pricing", "#pricing"],
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(10,10,11,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,184,0,0.1)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center glow-gold group-hover:scale-110 transition-transform"
            style={{ background: "#FFB800" }}
          >
            <Lock size={13} style={{ color: "#0A0A0B" }} />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Gift
            <span className="text-gold-gradient">Unlock</span>
            <span style={{ color: "#4A4A58", fontSize: "0.8em", fontWeight: 400 }}>.in</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "#4A4A58" }}>
          {navLinks.map(([label, href]) => (
            <a key={label} href={href} className="hover:text-white transition-colors">{label}</a>
          ))}
        </div>

        <Link
          href="/order"
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 glow-gold"
          style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)", color: "#0A0A0B" }}
        >
          Order Now <ArrowRight size={13} />
        </Link>

        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div
          className="md:hidden px-4 pb-4 pt-2 flex flex-col gap-2"
          style={{
            background: "rgba(10,10,11,0.98)",
            borderBottom: "1px solid rgba(255,184,0,0.1)",
          }}
        >
          {navLinks.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="py-2.5 text-sm border-b"
              style={{ color: "#4A4A58", borderColor: "rgba(255,184,0,0.06)" }}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
          <Link
            href="/order"
            className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)", color: "#0A0A0B" }}
            onClick={() => setMenuOpen(false)}
          >
            Order Now <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ─── HERO ──────────────────────────────────────────────── */
function Hero() {
  /* staggered entry animations via inline style */
  const entry = (delay: number): CSSProperties => ({
    animation: `fadeInUp 0.7s ease ${delay}s both`,
  });

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #FFB800, transparent)" }}
        />
        <div
          className="absolute top-1/2 -right-40 w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #FF6B35, transparent)" }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#FFB800" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center py-20">
        {/* Copy */}
        <div className="space-y-7">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(255,184,0,0.08)",
              border: "1px solid rgba(255,184,0,0.25)",
              color: "#FFB800",
              ...entry(0),
            }}
          >
            <Sparkles size={11} />
            🌸 Holi Special &nbsp;|&nbsp; 48hr Production &nbsp;|&nbsp; Ships Across India
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight"
            style={entry(0.1)}
          >
            Unlock the Memory{" "}
            <span className="text-gold-gradient">They Will Never</span> Forget
          </h1>

          <p
            className="text-lg leading-relaxed max-w-lg"
            style={{ color: "#4A4A58", ...entry(0.2) }}
          >
            Upload a selfie &amp; video clips. We craft a{" "}
            <span className="text-white font-medium">cinematic 15–30 sec memory</span>, print a{" "}
            <span style={{ color: "#FFB800" }} className="font-medium">festive artistic QR code</span>{" "}
            on a premium gift. One scan →{" "}
            <span className="text-white font-medium">pure emotion.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3" style={entry(0.3)}>
            <Link
              href="/order"
              className="group flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105 glow-gold-strong"
              style={{
                background: "linear-gradient(135deg, #FFD700 0%, #FFB800 50%, #FF9A3C 100%)",
                color: "#0A0A0B",
              }}
            >
              <Gift size={18} />
              Create Your Emotional Gift
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-sm transition-all"
              style={{ border: "1px solid rgba(255,184,0,0.15)", color: "#4A4A58" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = "rgba(255,184,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#4A4A58";
                e.currentTarget.style.borderColor = "rgba(255,184,0,0.15)";
              }}
            >
              <Play size={13} /> See How It Works
            </a>
          </div>

          <div className="flex flex-wrap gap-5 pt-1" style={entry(0.5)}>
            {[
              { Icon: Heart, label: "500+ Memories Created" },
              { Icon: Star, label: "4.9★ Rating" },
              { Icon: Clock, label: "48hr Production" },
              { Icon: Truck, label: "Ships Across India" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "#4A4A58" }}>
                <Icon size={11} style={{ color: "#FFB800" }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <HeroVisual />
      </div>

      {/* Scroll cue */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-xs"
        style={{
          color: "#252530",
          animation: "bounce 2s ease-in-out infinite",
        }}
      >
        <div className="w-px h-6" style={{ background: "linear-gradient(to bottom, transparent, #252530)" }} />
        scroll
      </div>
    </section>
  );
}

/* ─── STATS ─────────────────────────────────────────────── */
function Stats() {
  const stats = [
    { value: "500+", label: "Memories Created", Icon: Film },
    { value: "4.9★", label: "Average Rating", Icon: Star },
    { value: "48hr", label: "Turnaround Time", Icon: Zap },
    { value: "98%", label: "Customers Love It", Icon: Heart },
  ];
  return (
    <section
      className="py-14 border-y"
      style={{ borderColor: "rgba(255,184,0,0.08)", background: "rgba(17,17,22,0.5)" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map(({ value, label, Icon }, i) => (
          <FadeUp key={label} delay={i * 0.1} className="flex flex-col items-center text-center gap-2">
            <Icon size={20} style={{ color: "#FFB800" }} />
            <span className="text-3xl font-black text-gold-gradient">{value}</span>
            <span className="text-xs uppercase tracking-wider" style={{ color: "#4A4A58" }}>{label}</span>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ──────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: "01", Icon: Upload, color: "#FFB800",
      title: "Upload Your Moments",
      desc: "Share a selfie and your best video clips — birthdays, weddings, Holi dhamaka, proposals.",
    },
    {
      num: "02", Icon: Film, color: "#FF9A3C",
      title: "We Craft Your Video",
      desc: "Our team weaves a cinematic 15–30 sec memory video. Professional editing, zero effort from you.",
    },
    {
      num: "03", Icon: QrCode, color: "#FF6B35",
      title: "Festive QR Printed",
      desc: "A Gemini Nano Banana Pro–style artistic QR — marigold, Haldi vibes — printed on your premium gift.",
    },
    {
      num: "04", Icon: Smartphone, color: "#FFD700",
      title: "Scan → Emotion Unlocked",
      desc: "Gift it. They scan. Their memory plays instantly. Tears guaranteed — the happy kind.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-16 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>
            Simple. Magical. Unforgettable.
          </p>
          <h2 className="text-4xl font-black">
            How <span className="text-gold-gradient">GiftUnlock</span> Works
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "#4A4A58" }}>
            Four steps. One scan. A memory that lasts forever.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map(({ num, Icon, title, desc, color }, i) => (
            <FadeUp key={num} delay={i * 0.12}>
              <div
                className="relative p-6 rounded-2xl h-full flex flex-col gap-4 group hover:scale-[1.02] transition-transform"
                style={{
                  background: "linear-gradient(145deg, #1A1A24, #111116)",
                  border: "1px solid rgba(255,184,0,0.1)",
                }}
              >
                <span className="absolute top-4 right-5 text-5xl font-black opacity-10 select-none" style={{ color }}>
                  {num}
                </span>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-base">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#4A4A58" }}>{desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight size={16} style={{ color: "#B37D00" }} />
                  </div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PRODUCTS ──────────────────────────────────────────── */
function Products() {
  const products = [
    { emoji: "👕", name: "Premium T-Shirt", price: "from ₹899", badge: "Most Popular", badgeColor: "#FFB800",
      desc: "Unisex round-neck, 180 GSM cotton. Your memory printed forever." },
    { emoji: "🍺", name: "Beer Mug", price: "from ₹799", badge: null, badgeColor: null,
      desc: "11oz ceramic mug. Perfect for dad's birthday or the squad." },
    { emoji: "🧥", name: "Hoodie", price: "from ₹1,299", badge: "Premium", badgeColor: "#FF6B35",
      desc: "350 GSM unisex fleece. A cozy memory they will wear every winter." },
    { emoji: "🛋️", name: "Cushion", price: "from ₹699", badge: null, badgeColor: null,
      desc: "30×30 cm throw cushion with insert. Scan the QR from the sofa." },
  ];

  return (
    <section id="products" className="py-24" style={{ background: "rgba(17,17,22,0.4)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-16 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>
            Choose Your Canvas
          </p>
          <h2 className="text-4xl font-black">
            Premium Gifts, <span className="text-gold-gradient">Emotional Stories</span>
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "#4A4A58" }}>
            Every product is a canvas for a cinematic memory.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map(({ emoji, name, desc, badge, badgeColor, price }, i) => (
            <FadeUp key={name} delay={i * 0.1}>
              <div
                className="relative p-6 rounded-2xl flex flex-col gap-4 h-full group hover:scale-[1.03] transition-transform"
                style={{
                  background: "linear-gradient(145deg, #1A1A24, #111116)",
                  border: "1px solid rgba(255,184,0,0.1)",
                }}
              >
                {badge && badgeColor && (
                  <span
                    className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: badgeColor, color: "#0A0A0B" }}
                  >
                    {badge}
                  </span>
                )}
                <div className="text-4xl">{emoji}</div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-bold text-white">{name}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#4A4A58" }}>{desc}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "rgba(255,184,0,0.08)" }}>
                  <span className="font-bold text-sm" style={{ color: "#FFB800" }}>{price}</span>
                  <Link href="/order" className="flex items-center gap-1 text-xs transition-colors" style={{ color: "#4A4A58" }}>
                    Order <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING ───────────────────────────────────────────── */
function Pricing() {
  const tiers = [
    {
      name: "QR Classic", price: "₹899", highlight: false, badge: null,
      tagline: "The perfect first gift",
      features: [
        "Artistic festive QR code (PNG)",
        "Cinematic 15–30 sec memory video",
        "YouTube Unlisted — scan to play",
        "1 product of your choice",
        "Standard shipping across India",
        "Digital QR design file included",
      ],
    },
    {
      name: "NFC VIP", price: "₹1,699", highlight: true, badge: "Most Premium",
      tagline: "No scan needed — just tap",
      features: [
        "Everything in QR Classic",
        "Embedded NFC chip (tap to unlock)",
        "Premium festive gift box",
        "Priority 24hr production",
        "Express shipping",
        "Lifetime YouTube video link",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-16 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>
            Simple Pricing
          </p>
          <h2 className="text-4xl font-black">
            One Gift, <span className="text-gold-gradient">Endless Replays</span>
          </h2>
          <p className="max-w-lg mx-auto" style={{ color: "#4A4A58" }}>
            No subscriptions. No hidden fees. Your memory lives on YouTube — forever free.
          </p>
        </FadeUp>

        <div className="grid md:grid-cols-2 gap-6">
          {tiers.map(({ name, price, highlight, tagline, badge, features }, i) => (
            <FadeUp key={name} delay={i * 0.15}>
              <div
                className="relative p-8 rounded-3xl flex flex-col gap-6 h-full"
                style={{
                  background: highlight ? "linear-gradient(145deg, #1e1a0a, #1A1A24)" : "linear-gradient(145deg, #1A1A24, #111116)",
                  border: highlight ? "1px solid rgba(255,184,0,0.4)" : "1px solid rgba(255,184,0,0.1)",
                  boxShadow: highlight ? "0 0 40px rgba(255,184,0,0.08)" : "none",
                }}
              >
                {badge && (
                  <span
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full"
                    style={{ background: "linear-gradient(90deg, #FFD700, #FF9A3C)", color: "#0A0A0B" }}
                  >
                    {badge}
                  </span>
                )}
                <div>
                  <h3 className="font-black text-xl text-white">{name}</h3>
                  <p className="text-sm mt-1" style={{ color: "#4A4A58" }}>{tagline}</p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black text-gold-gradient">{price}</span>
                  <span className="pb-1 text-sm" style={{ color: "#4A4A58" }}>/ gift</span>
                </div>
                <ul className="space-y-3 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2
                        size={15}
                        className="mt-0.5 shrink-0"
                        style={{ color: highlight ? "#FFB800" : "#333340" }}
                      />
                      <span style={{ color: highlight ? "#F0F0F5" : "#4A4A58" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/order"
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
                  style={
                    highlight
                      ? { background: "linear-gradient(135deg, #FFD700, #FF9A3C)", color: "#0A0A0B" }
                      : { background: "rgba(255,184,0,0.07)", border: "1px solid rgba(255,184,0,0.2)", color: "#FFB800" }
                  }
                >
                  Order {name} <ArrowRight size={14} />
                </Link>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ──────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    {
      quote: "My dad broke down crying when he scanned the mug on his 60th birthday. He watched it 7 times that night. Best gift I have ever given.",
      name: "Priya Sharma", location: "Mumbai", avatar: "P", rating: 5,
    },
    {
      quote: "The QR code design itself was a masterpiece — marigold pattern, gold ink. Our Holi video playing from a cushion scan? Absolutely unforgettable.",
      name: "Rahul Verma", location: "Delhi", avatar: "R", rating: 5,
    },
    {
      quote: "I proposed with a custom hoodie. She scanned the QR, our montage played, and she said YES. GiftUnlock literally made that moment.",
      name: "Arjun Mehta", location: "Bangalore", avatar: "A", rating: 5,
    },
  ];

  return (
    <section className="py-24" style={{ background: "rgba(17,17,22,0.4)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-16 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>Real Stories</p>
          <h2 className="text-4xl font-black">Tears of <span className="text-gold-gradient">Pure Joy</span></h2>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map(({ quote, name, location, avatar, rating }, i) => (
            <FadeUp key={name} delay={i * 0.12}>
              <div
                className="p-6 rounded-2xl h-full flex flex-col gap-4"
                style={{
                  background: "linear-gradient(145deg, #1A1A24, #111116)",
                  border: "1px solid rgba(255,184,0,0.1)",
                }}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: rating }).map((_, j) => (
                    <Star key={j} size={13} style={{ color: "#FFB800", fill: "#FFB800" }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1 italic" style={{ color: "#4A4A58" }}>
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "rgba(255,184,0,0.08)" }}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)", color: "#0A0A0B" }}
                  >
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{name}</p>
                    <p className="text-xs" style={{ color: "#4A4A58" }}>{location}</p>
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

/* ─── FINAL CTA ─────────────────────────────────────────── */
function FinalCTA() {
  const guarantees: { Icon: React.ElementType; label: string }[] = [
    { Icon: Shield, label: "Secure Razorpay payment" },
    { Icon: Clock, label: "48hr production" },
    { Icon: Truck, label: "Ships across India" },
    { Icon: Heart, label: "100% love guarantee" },
  ];

  return (
    <section className="py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,184,0,0.06) 0%, transparent 70%)",
        }}
      />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-8">
        <FadeUp>
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#FFB800" }}>
              Start Right Now
            </p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight">
              Every Memory Fades.
              <br />
              <span className="text-gold-gradient">Make Yours Last Forever.</span>
            </h2>
            <p className="text-lg leading-relaxed max-w-lg mx-auto" style={{ color: "#4A4A58" }}>
              Your next birthday, Holi, proposal, or anniversary deserves more than a card.
              Give them something they will scan again and again — and cry happy tears every time.
            </p>
          </div>
        </FadeUp>

        <FadeUp delay={0.15}>
          <Link
            href="/order"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105 glow-gold-strong"
            style={{ background: "linear-gradient(135deg, #FFD700 0%, #FFB800 50%, #FF9A3C 100%)", color: "#0A0A0B" }}
          >
            <Gift size={20} />
            Create Your Emotional Gift
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </FadeUp>

        <FadeUp delay={0.25}>
          <div className="flex flex-wrap justify-center gap-6 text-xs" style={{ color: "#252530" }}>
            {guarantees.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon size={11} style={{ color: "#B37D00" }} />
                {label}
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer
      className="py-12 border-t"
      style={{ borderColor: "rgba(255,184,0,0.08)", background: "rgba(17,17,22,0.8)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#FFB800" }}>
                <Lock size={11} style={{ color: "#0A0A0B" }} />
              </div>
              <span className="font-bold text-base">
                Gift<span className="text-gold-gradient">Unlock</span>
                <span style={{ color: "#4A4A58", fontSize: "0.8em", fontWeight: 400 }}>.in</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#4A4A58" }}>
              Unlock the Memory They Will Never Forget. Emotional memory gifts — T-shirts, mugs, hoodies &amp; cushions — shipped across India.
            </p>
            <a
              href="https://wa.me/919999999999"
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

          <div className="space-y-3">
            <p className="text-xs font-semibold text-white uppercase tracking-wider">Legal</p>
            <div className="space-y-2">
              {[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Refund Policy", "/refund"]].map(
                ([label, href]) => (
                  <a key={label} href={href} className="block text-sm hover:text-white transition-colors" style={{ color: "#4A4A58" }}>
                    {label}
                  </a>
                )
              )}
            </div>
          </div>
        </div>

        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t"
          style={{ borderColor: "rgba(255,184,0,0.06)", color: "#252530" }}
        >
          <span>© 2026 GiftUnlock.in — All rights reserved.</span>
          <span>Made with ❤️ in India 🇮🇳</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── ROOT PAGE ──────────────────────────────────────────── */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-dark-900 text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Stats />
      <HowItWorks />
      <Products />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  );
}
