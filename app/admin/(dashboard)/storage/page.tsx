"use client";

import { useState, useEffect } from "react";

interface StorageStats {
  totalMB: number;
  maxMB:   number;
  usedPct: number;
  count:   number;
}
interface CleanupResult {
  freed_mb:      number;
  deleted_count: number;
  paths:         string[];
}

export default function AdminStoragePage() {
  const [stats,    setStats]    = useState<StorageStats | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [log,      setLog]      = useState<CleanupResult | null>(null);
  const [error,    setError]    = useState("");

  async function loadStats() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/storage");
      if (res.ok) setStats(await res.json());
      else setError("Failed to load storage stats");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function cleanAbandoned() {
    if (!confirm("Delete all media files uploaded >48 h ago with no paid order? This cannot be undone.")) return;
    setCleaning(true);
    setLog(null);
    setError("");
    try {
      const res = await fetch("/api/admin/storage", { method: "DELETE" });
      if (res.ok) {
        const result: CleanupResult = await res.json();
        setLog(result);
        await loadStats();   // refresh stats
      } else {
        const data = await res.json();
        setError(data.error ?? "Cleanup failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setCleaning(false);
    }
  }

  useEffect(() => { loadStats(); }, []);

  const cardSty = {
    background: "linear-gradient(145deg,#1A1A24,#111116)",
    border:     "1px solid rgba(255,184,0,0.1)",
  };

  return (
    <div className="p-6 space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Storage</h1>
          <p className="text-xs mt-0.5" style={{ color: "#4A4A58" }}>
            media bucket · Supabase Storage
          </p>
        </div>
        <button
          onClick={loadStats}
          className="text-xs px-3 py-1.5 rounded-xl font-semibold"
          style={{ background: "#0E0E14", border: "1px solid rgba(255,184,0,0.08)" }}
        >
          {loading ? "…" : "↻ Refresh"}
        </button>
      </div>

      {/* Stats card */}
      <div className="rounded-2xl p-6 space-y-5" style={cardSty}>
        {loading ? (
          <p className="text-sm" style={{ color: "#4A4A58" }}>Loading storage stats…</p>
        ) : stats ? (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-black text-white">
                  {stats.totalMB.toFixed(1)}
                  <span className="text-base font-semibold ml-1" style={{ color: "#4A4A58" }}>MB</span>
                </p>
                <p className="text-xs mt-1" style={{ color: "#4A4A58" }}>
                  of {stats.maxMB.toLocaleString()} MB capacity
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black" style={{ color: stats.usedPct > 80 ? "#ef4444" : "#FFB800" }}>
                  {stats.usedPct}%
                </p>
                <p className="text-xs" style={{ color: "#4A4A58" }}>{stats.count} files</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div
                className="w-full h-3 rounded-full overflow-hidden"
                style={{ background: "rgba(255,184,0,0.08)" }}
              >
                <div
                  className="h-3 rounded-full transition-all duration-700"
                  style={{
                    width:      `${stats.usedPct}%`,
                    background: stats.usedPct > 80
                      ? "linear-gradient(90deg,#ef4444,#f97316)"
                      : "linear-gradient(90deg,#FFD700,#FF9A3C)",
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] mt-1.5" style={{ color: "#4A4A58" }}>
                <span>0 MB</span>
                <span>{stats.maxMB.toLocaleString()} MB</span>
              </div>
            </div>

            {/* Supabase link */}
            <a
              href="https://supabase.com/dashboard/project/xoifkwplilapwllzyazl/storage"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs underline transition-opacity hover:opacity-70"
              style={{ color: "#FFB800" }}
            >
              View bucket in Supabase →
            </a>
          </>
        ) : (
          <p className="text-sm text-red-400">{error || "Failed to load stats"}</p>
        )}
      </div>

      {/* Cleanup card */}
      <div className="rounded-2xl p-6 space-y-4" style={cardSty}>
        <div>
          <h2 className="text-sm font-black text-white">Clean Abandoned Uploads</h2>
          <p className="text-xs mt-1" style={{ color: "#4A4A58" }}>
            Permanently deletes media files uploaded more than 48 hours ago that are not
            linked to any paid order. Frees up storage space.
          </p>
        </div>

        <button
          onClick={cleanAbandoned}
          disabled={cleaning || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-80"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          {cleaning ? (
            <>
              <span className="animate-spin">⟳</span> Cleaning…
            </>
          ) : (
            <>🧹 Clean Abandoned Uploads &gt;48h</>
          )}
        </button>

        {/* Result log */}
        {log && (
          <div
            className="rounded-xl p-4 space-y-2 text-xs font-mono"
            style={{ background: "#0A0A0B", border: "1px solid rgba(34,197,94,0.15)" }}
          >
            <p style={{ color: "#22c55e" }}>
              ✓ Cleanup complete — freed {log.freed_mb.toFixed(2)} MB ({log.deleted_count} files deleted)
            </p>
            {log.paths.length > 0 && (
              <div className="space-y-0.5 max-h-40 overflow-y-auto" style={{ color: "#4A4A58" }}>
                {log.paths.map((p) => (
                  <p key={p} className="truncate">• {p}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
