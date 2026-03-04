"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router          = useRouter();
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin/orders");
      } else {
        const data = await res.json();
        setError(data.error ?? "Invalid password");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0A0A0B, #12121A)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 space-y-6"
        style={{
          background: "linear-gradient(145deg, #1A1A24, #111116)",
          border:     "1px solid rgba(255,184,0,0.12)",
        }}
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)" }}
          >
            🔐
          </div>
          <h1 className="text-xl font-black text-white">Admin Dashboard</h1>
          <p className="text-xs" style={{ color: "#4A4A58" }}>
            GiftUnlock.in
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold mb-1.5"
              style={{ color: "#FFB800" }}
            >
              Admin Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin secret"
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{
                background: "#111116",
                border:     error
                  ? "1px solid rgba(239,68,68,0.5)"
                  : "1px solid rgba(255,184,0,0.15)",
              }}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl font-bold text-sm text-black transition-opacity disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)" }}
          >
            {loading ? "Verifying…" : "Enter Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
