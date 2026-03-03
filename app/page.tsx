"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

/* ─── Fade-up animation hook ──────────────────────────────── */
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
        transition: "opacity 0.65s ease, transform 0.65s ease",
        transitionDelay: `${delay}s`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Shared 4×4 QR pattern ───────────────────────────────── */
const QR4_PATTERN = [
  [1, 0, 1, 1],
  [0, 1, 0, 1],
  [1, 1, 1, 0],
  [1, 0, 1, 1],
] as const;

/* ─── 7×7 QR pattern for showcase cards ──────────────────── */
const QR7_PATTERN = [
  [1, 1, 1, 0, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 1, 0, 0, 0, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1, 1],
] as const;

function QR7Grid({
  cellColor,
  glowColor,
  cellSize = 10,
}: {
  cellColor: string;
  glowColor?: string;
  cellSize?: number;
}) {
  return (
    <div
      className="grid gap-[2px]"
      style={{ gridTemplateColumns: `repeat(7, ${cellSize}px)` }}
    >
      {QR7_PATTERN.flat().map((cell, i) => (
        <div
          key={i}
          style={{
            width: cellSize,
            height: cellSize,
            borderRadius: 2,
            background: cell ? cellColor : "transparent",
            ...(cell && glowColor ? { boxShadow: `0 0 4px ${glowColor}` } : {}),
          }}
        />
      ))}
    </div>
  );
}

/* ─── NAVBAR ──────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks: [string, string][] = [
    ["Home", "/"],
    ["How It Works", "#how-it-works"],
    ["Products", "#products"],
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
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-transform group-hover:scale-110"
            style={{ background: "#FFB800", color: "#0A0A0B" }}
          >
            🔓
          </div>
          <span className="font-black text-lg tracking-tight text-white">
            Gift<span style={{ color: "#FFB800" }}>Unlock</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "#9B9BAA" }}>
          {navLinks.map(([label, href]) => (
            <a key={label} href={href} className="hover:text-white transition-colors">
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/order"
          className="hidden md:flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
          style={{
            background: "#FFB800",
            color: "#0A0A0B",
            boxShadow: "0 0 20px rgba(255,184,0,0.25)",
          }}
        >
          Order Now →
        </Link>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white text-xl p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="md:hidden px-4 pb-5 pt-2 flex flex-col gap-2"
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
              style={{ color: "#9B9BAA", borderColor: "rgba(255,184,0,0.06)" }}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
          <Link
            href="/order"
            className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
            style={{ background: "#FFB800", color: "#0A0A0B" }}
            onClick={() => setMenuOpen(false)}
          >
            Order Now →
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ─── HERO ────────────────────────────────────────────────── */
function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{ background: "#0A0A0B" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(255,184,0,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(255,184,0,0.08)",
              border: "1px solid rgba(255,184,0,0.25)",
              color: "#FFB800",
            }}
          >
            ✨ Artistic QR · 48hr Production · Ships Across India
          </span>
        </div>

        {/* Headline */}
        <div className="text-center space-y-5 mb-14">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white">
            Unlock the Memory{" "}
            <span style={{ color: "#FFB800" }}>They Will Never Forget</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: "#9B9BAA" }}>
            Turn your photos &amp; videos into a premium gift with a stunning artistic QR
          </p>
        </div>

        {/* QR comparison — 4×4 CSS grid side by side */}
        <div className="flex items-center justify-center gap-8 sm:gap-16 mb-14">
          {/* Boring QR */}
          <div className="flex flex-col items-center gap-3">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#9B9BAA",
              }}
            >
              Boring QR
            </span>
            <div
              className="p-3 rounded-xl"
              style={{ background: "#E5E5E5" }}
            >
              <div
                className="grid gap-[3px]"
                style={{ gridTemplateColumns: "repeat(4, 14px)" }}
              >
                {QR4_PATTERN.flat().map((cell, i) => (
                  <div
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: cell ? "#2A2A2A" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs" style={{ color: "#555566" }}>Generic. Forgettable.</p>
          </div>

          {/* VS badge */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
            style={{
              background: "rgba(255,184,0,0.12)",
              border: "2px solid rgba(255,184,0,0.35)",
              color: "#FFB800",
            }}
          >
            VS
          </div>

          {/* GiftUnlock QR — golden glowing dots */}
          <div className="flex flex-col items-center gap-3">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
              style={{
                background: "rgba(255,184,0,0.1)",
                border: "1px solid rgba(255,184,0,0.3)",
                color: "#FFB800",
              }}
            >
              GiftUnlock QR
            </span>
            <div
              className="p-3 rounded-xl"
              style={{
                background: "#111116",
                border: "2px solid rgba(255,184,0,0.45)",
                boxShadow: "0 0 30px rgba(255,184,0,0.2)",
              }}
            >
              <div
                className="grid gap-[3px]"
                style={{ gridTemplateColumns: "repeat(4, 14px)" }}
              >
                {QR4_PATTERN.flat().map((cell, i) => (
                  <div
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: cell ? "#FFB800" : "transparent",
                      boxShadow: cell
                        ? "0 0 6px rgba(255,184,0,0.85), 0 0 2px #FFB800"
                        : "none",
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs font-semibold" style={{ color: "#FFB800" }}>
              Stunning. Scans perfectly. ✨
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/order"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #FFD700, #FFB800, #FF9A3C)",
              color: "#0A0A0B",
              boxShadow: "0 0 32px rgba(255,184,0,0.3)",
            }}
          >
            🎁 Create Your Gift
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all"
            style={{
              border: "1px solid rgba(255,184,0,0.2)",
              color: "#9B9BAA",
            }}
          >
            ▶ How It Works
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── QR SHOWCASE ─────────────────────────────────────────── */
function QrShowcase() {
  const themes = [
    {
      label: "Haldi 🌼",
      bg: "linear-gradient(145deg, #1a1500, #0d0c00)",
      border: "rgba(255,210,0,0.4)",
      glow: "rgba(255,210,0,0.15)",
      cellColor: "#FFD700",
      glowColor: "rgba(255,215,0,0.75)",
      tagBg: "rgba(255,210,0,0.1)",
      tagColor: "#FFD700",
    },
    {
      label: "Anniversary ❤️",
      bg: "linear-gradient(145deg, #1a0008, #0d000a)",
      border: "rgba(255,55,75,0.4)",
      glow: "rgba(255,55,75,0.15)",
      cellColor: "#FF3355",
      glowColor: "rgba(255,55,75,0.75)",
      tagBg: "rgba(255,55,75,0.1)",
      tagColor: "#FF3355",
    },
    {
      label: "Birthday 🎂",
      bg: "linear-gradient(145deg, #0e0018, #07000d)",
      border: "rgba(178,80,255,0.4)",
      glow: "rgba(178,80,255,0.15)",
      cellColor: "#B250FF",
      glowColor: "rgba(178,80,255,0.75)",
      tagBg: "rgba(178,80,255,0.1)",
      tagColor: "#B250FF",
    },
  ];

  return (
    <section
      id="qr-showcase"
      className="py-24"
      style={{ background: "rgba(10,10,11,0.98)" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-14 space-y-4">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#FFB800" }}
          >
            Artistic QR Technology
          </p>
          <h2 className="text-4xl font-black text-white">Not a Boring Black Square</h2>
          <p className="max-w-xl mx-auto" style={{ color: "#9B9BAA" }}>
            Every GiftUnlock QR is hand-crafted for your occasion — vivid, themed, and still scans
            perfectly every time.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-3 gap-6">
          {themes.map(({ label, bg, border, glow, cellColor, glowColor, tagBg, tagColor }, i) => (
            <FadeUp key={label} delay={i * 0.12}>
              <div
                className="flex flex-col items-center gap-5 p-8 rounded-2xl"
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  boxShadow: `0 0 48px ${glow}`,
                }}
              >
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: tagBg, color: tagColor, border: `1px solid ${border}` }}
                >
                  {label}
                </span>
                <QR7Grid cellColor={cellColor} glowColor={glowColor} cellSize={11} />
                <p className="text-xs text-center" style={{ color: "#9B9BAA" }}>
                  Artistic QR by Gemini AI ✨
                </p>
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
    {
      num: "01",
      emoji: "📸",
      title: "Upload Memories",
      desc: "Share your photos and video clips — birthdays, weddings, trips, anything that matters.",
      color: "#FFB800",
    },
    {
      num: "02",
      emoji: "🎨",
      title: "We Craft Your QR",
      desc: "Our team creates a cinematic memory video and generates your stunning artistic QR code.",
      color: "#FF9A3C",
    },
    {
      num: "03",
      emoji: "📦",
      title: "Print & Ship in 48hr",
      desc: "Your QR is printed on your chosen premium gift and shipped across India within 48 hours.",
      color: "#FF6B35",
    },
    {
      num: "04",
      emoji: "📱",
      title: "Scan & Unlock",
      desc: "One scan. The memory plays instantly. Tears guaranteed — the happy kind. ❤️",
      color: "#FFD700",
    },
  ];

  return (
    <section id="how-it-works" className="py-24" style={{ background: "#0A0A0B" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-16 space-y-3">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#FFB800" }}
          >
            Simple. Magical. 4 Steps.
          </p>
          <h2 className="text-4xl font-black text-white">
            How <span style={{ color: "#FFB800" }}>GiftUnlock</span> Works
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "#9B9BAA" }}>
            Four steps. One scan. A memory that lasts forever.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map(({ num, emoji, title, desc, color }, i) => (
            <FadeUp key={num} delay={i * 0.12}>
              <div
                className="relative p-6 rounded-2xl h-full flex flex-col gap-4 transition-transform hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(145deg, #1A1A24, #111116)",
                  border: "1px solid rgba(255,184,0,0.1)",
                }}
              >
                <span
                  className="absolute top-4 right-5 text-5xl font-black select-none"
                  style={{ color, opacity: 0.08 }}
                >
                  {num}
                </span>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background: `${color}18`,
                    border: `1px solid ${color}30`,
                  }}
                >
                  {emoji}
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-base">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#9B9BAA" }}>
                    {desc}
                  </p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── GROUP MEMORY ───────────────────────────────────────── */
function GroupMemory() {
  const features = [
    {
      icon: "🔗",
      title: "Share a Link",
      desc: "Send one simple link to your entire squad — no app needed.",
    },
    {
      icon: "🎬",
      title: "Everyone Uploads",
      desc: "Friends and family add their best clips and photos from their phones.",
    },
    {
      icon: "🎁",
      title: "One Gift, Many Hearts",
      desc: "All memories combined into a single unforgettable QR gift.",
    },
  ];

  return (
    <section
      id="group-memory"
      className="py-24"
      style={{ background: "rgba(17,17,22,0.6)" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeUp>
          <div
            className="relative p-8 sm:p-12 rounded-3xl text-center space-y-8"
            style={{
              background: "linear-gradient(145deg, #1A1A24, #111116)",
              border: "1px solid rgba(255,184,0,0.2)",
              boxShadow: "0 0 60px rgba(255,184,0,0.04)",
            }}
          >
            {/* NEW badge */}
            <span
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-black px-5 py-1.5 rounded-full uppercase tracking-wide"
              style={{
                background: "linear-gradient(90deg, #FFD700, #FF9A3C)",
                color: "#0A0A0B",
              }}
            >
              NEW ✨
            </span>

            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Let Your Squad Record the Memory
              </h2>
              <p className="max-w-xl mx-auto" style={{ color: "#9B9BAA" }}>
                Friends, family, colleagues — everyone adds a clip. One QR gift holds them all.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {features.map(({ icon, title, desc }) => (
                <div key={title} className="flex flex-col items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{
                      background: "rgba(255,184,0,0.08)",
                      border: "1px solid rgba(255,184,0,0.15)",
                    }}
                  >
                    {icon}
                  </div>
                  <h3 className="font-bold text-white text-sm">{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#9B9BAA" }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/order"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-105"
              style={{
                background: "#FFB800",
                color: "#0A0A0B",
                boxShadow: "0 0 24px rgba(255,184,0,0.25)",
              }}
            >
              🎁 Create Group Gift →
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/* ─── PRODUCTS ─────────────────────────────────────────────── */
function Products() {
  const products = [
    { emoji: "👕", name: "T-Shirt",       price: "₹899",   tag: "Best Seller" },
    { emoji: "🍺", name: "Beer Mug",      price: "₹799",   tag: null },
    { emoji: "🧥", name: "Hoodie",        price: "₹1,299", tag: "Premium" },
    { emoji: "🛋️", name: "Cushion",       price: "₹699",   tag: null },
    { emoji: "☕", name: "Coffee Mug",    price: "₹699",   tag: null },
    { emoji: "💧", name: "Water Bottle",  price: "₹899",   tag: null },
  ];

  return (
    <section id="products" className="py-24" style={{ background: "rgba(17,17,22,0.4)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-16 space-y-3">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#FFB800" }}
          >
            Choose Your Canvas
          </p>
          <h2 className="text-4xl font-black text-white">
            Premium Gifts,{" "}
            <span style={{ color: "#FFB800" }}>Emotional Stories</span>
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "#9B9BAA" }}>
            Every product is a canvas for a memory that plays with one scan.
          </p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map(({ emoji, name, price, tag }, i) => (
            <FadeUp key={name} delay={i * 0.08}>
              <div
                className="relative p-6 rounded-2xl flex flex-col gap-4 h-full transition-transform hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(145deg, #1A1A24, #111116)",
                  border: "1px solid rgba(255,184,0,0.1)",
                }}
              >
                {tag && (
                  <span
                    className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#FFB800", color: "#0A0A0B" }}
                  >
                    {tag}
                  </span>
                )}
                <div className="text-4xl">{emoji}</div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-white text-base">{name}</h3>
                  <p className="text-xl font-black" style={{ color: "#FFB800" }}>
                    {price}
                  </p>
                </div>
                <Link
                  href="/order"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: "#FFB800", color: "#0A0A0B" }}
                >
                  Order Now →
                </Link>
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
    { value: "4.9 ★",     label: "Average Rating",   emoji: "⭐" },
    { value: "48hr",      label: "Production Time",  emoji: "⚡" },
    { value: "Pan India", label: "Shipping",         emoji: "🚚" },
  ];

  return (
    <section
      className="py-14 border-y"
      style={{
        borderColor: "rgba(255,184,0,0.08)",
        background: "rgba(17,17,22,0.6)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map(({ value, label, emoji }, i) => (
          <FadeUp
            key={label}
            delay={i * 0.1}
            className="flex flex-col items-center text-center gap-2"
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-3xl font-black" style={{ color: "#FFB800" }}>
              {value}
            </span>
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: "#9B9BAA" }}
            >
              {label}
            </span>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ───────────────────────────────────────── */
function Testimonials() {
  const reviews = [
    {
      quote:
        "My dad cried when he scanned the QR on his mug. Best birthday gift I have ever given.",
      name: "Priya S.",
      city: "Mumbai",
      initial: "P",
    },
    {
      quote:
        "The artistic QR was stunning. Every guest at the party kept asking where I got it from.",
      name: "Rohan K.",
      city: "Delhi",
      initial: "R",
    },
    {
      quote:
        "All 8 of us uploaded college memories. One QR, one hoodie, one hundred happy tears. 😭",
      name: "Anjali M.",
      city: "Bangalore",
      initial: "A",
    },
  ];

  return (
    <section className="py-24" style={{ background: "#0A0A0B" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeUp className="text-center mb-16 space-y-3">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#FFB800" }}
          >
            Real Stories
          </p>
          <h2 className="text-4xl font-black text-white">
            Tears of <span style={{ color: "#FFB800" }}>Pure Joy</span>
          </h2>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map(({ quote, name, city, initial }, i) => (
            <FadeUp key={name} delay={i * 0.12}>
              <div
                className="p-6 rounded-2xl h-full flex flex-col gap-4"
                style={{
                  background: "linear-gradient(145deg, #1A1A24, #111116)",
                  border: "1px solid rgba(255,184,0,0.1)",
                }}
              >
                {/* 5 stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span key={j} style={{ color: "#FFB800", fontSize: 14 }}>
                      ★
                    </span>
                  ))}
                </div>
                <p
                  className="text-sm leading-relaxed flex-1 italic"
                  style={{ color: "#9B9BAA" }}
                >
                  &ldquo;{quote}&rdquo;
                </p>
                <div
                  className="flex items-center gap-3 pt-3 border-t"
                  style={{ borderColor: "rgba(255,184,0,0.08)" }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: "#FFB800", color: "#0A0A0B" }}
                  >
                    {initial}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-white">{name}</p>
                    <p className="text-xs" style={{ color: "#9B9BAA" }}>
                      {city}
                    </p>
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

/* ─── FOOTER ──────────────────────────────────────────────── */
function Footer() {
  const navLinks: [string, string][] = [
    ["Home", "/"],
    ["How It Works", "#how-it-works"],
    ["Products", "#products"],
    ["Group Memory", "#group-memory"],
    ["Privacy Policy", "/privacy"],
  ];

  return (
    <footer
      className="py-12 border-t"
      style={{
        borderColor: "rgba(255,184,0,0.1)",
        background: "rgba(10,10,11,0.99)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{ background: "#FFB800", color: "#0A0A0B" }}
              >
                🔓
              </div>
              <span className="font-black text-lg tracking-tight text-white">
                Gift<span style={{ color: "#FFB800" }}>Unlock</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#9B9BAA" }}>
              Unlock the Memory They Will Never Forget
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white uppercase tracking-wider">
              Quick Links
            </p>
            <div className="space-y-2">
              {navLinks.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="block text-sm hover:text-white transition-colors"
                  style={{ color: "#9B9BAA" }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Made in Delhi */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-white">❤️ Made in Delhi</p>
            <p className="text-sm" style={{ color: "#9B9BAA" }}>
              ✨ Artistic QR by Gemini AI
            </p>
            <div className="flex gap-4 pt-1">
              <a
                href="https://instagram.com/giftunlock"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl transition-transform hover:scale-110"
                title="Instagram"
              >
                📸
              </a>
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl transition-transform hover:scale-110"
                title="WhatsApp"
              >
                💬
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t"
          style={{ borderColor: "rgba(255,184,0,0.06)", color: "#555566" }}
        >
          <span>© 2026 GiftUnlock · All rights reserved</span>
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/giftunlock"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg hover:text-white transition-colors"
            >
              📸
            </a>
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg hover:text-white transition-colors"
            >
              💬
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── ROOT PAGE ────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <main
      className="min-h-screen text-white overflow-x-hidden"
      style={{ background: "#0A0A0B" }}
    >
      <Navbar />
      <Hero />
      <QrShowcase />
      <HowItWorks />
      <GroupMemory />
      <Products />
      <Stats />
      <Testimonials />
      <Footer />
    </main>
  );
}
