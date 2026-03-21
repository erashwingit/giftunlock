import { Lock, AlertCircle, Gift } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found — GiftUnlock.in",
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center px-4 py-16">
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(239,68,68,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md text-center space-y-6">
        {/* Icon */}
        <div
          className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          <AlertCircle size={36} style={{ color: "#f87171" }} />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#f87171" }}
          >
            404 — Not Found
          </p>
          <h1 className="text-2xl font-black text-white">
            This page doesn&apos;t exist
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "#4A4A58" }}
          >
            The URL you visited isn&apos;t valid. It may have been mistyped or
            the page may have moved.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #FFD700, #FF9A3C)",
            color: "#0A0A0B",
          }}
        >
          <Gift size={14} /> Go to Home
        </Link>

        {/* Brand footer */}
        <div
          className="flex items-center justify-center gap-1.5 pt-2 text-xs"
          style={{ color: "#252530" }}
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: "#FFB800" }}
          >
            <Lock size={9} style={{ color: "#0A0A0B" }} />
          </div>
          GiftUnlock.in — Made with ❤️ in India
        </div>
      </div>
    </main>
  );
}
