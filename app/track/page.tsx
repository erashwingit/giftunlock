"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * /track — entry page where customers type their order slug
 */
export default function TrackPage() {
  const [slug, setSlug]   = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = slug.trim().toLowerCase();
    if (!clean) { setError("Please enter your order ID."); return; }
    if (!/^[a-zA-Z0-9_-]{6,16}$/.test(clean)) { setError("Invalid order ID format. Please check your confirmation email."); return; }
    router.push(`/track/${clean}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0A0A0B", color: "#fff" }}>
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto"
          style={{ background: "rgba(255,184,0,0.12)", border: "1px solid rgba(255,184,0,0.3)" }}>
          📦
        </div>
        <h1 className="text-3xl font-black">Track Your Order</h1>
        <p style={{ color: "#9B9BAA" }}>Enter the order ID from your confirmation email.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={slug}
            onChange={e => { setSlug(e.target.value); setError(""); }}
            placeholder="e.g. AB12CD34"
            className="w-full px-4 py-3 rounded-xl text-white outline-none text-center uppercase tracking-widest font-mono text-sm"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,184,0,0.2)" }}
          />
          {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}
          <button type="submit"
            className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
            style={{ background: "#FFB800", color: "#0A0A0B" }}>
            Track Order →
          </button>
        </form>
      </div>
    </main>
  );
}
