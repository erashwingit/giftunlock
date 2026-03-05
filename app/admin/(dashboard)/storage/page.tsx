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
  dry_run:       boolean;
}

export default function AdminStoragePage() {
  const [stats,    setStats]    = useState<StorageStats | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [log,      setLog]      = useState<CleanupResult | null>(null);
  const [error,    setError]    = useState("");

  // Confirmation modal state
  const [preview,       setPreview]       = useState<CleanupResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showModal,     setShowModal]     = useState(false);

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

  /** Step 1 — dry-run preview, then open confirmation modal */
  async function requestCleanup() {
    setPreviewLoading(true);
    setError("");
    setLog(null);
    try {
      const res = await fetch("/api/admin/storage?dry_run=true", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Preview failed");
        return;
      }
      const result: CleanupResult = await res.json();
      setPreview(result);
      setShowModal(true);
    } catch {
      setError("Network error");
    } finally {
      setPreviewLoading(false);
    }
  }

  /** Step 2 — real delete, confirmed by user */
  async function confirmCleanup() {
    setShowModal(false);
    setCleaning(true);
    setError("");
    try {
      const res = await fetch("/api/admin/storage", { method: "DELETE" });
      if (res.ok) {
        const result: CleanupResult = await res.json();
        setLog(result);
        await loadStats();
      } else {
        const data = await res.json();
        setError(data.error ?? "Cleanup failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setCleaning(false);
      setPreview(null);
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
            linked to any paid order. A preview is shown before anything is deleted.
          </p>
        </div>

        <button
          onClick={requestCleanup}
          disabled={cleaning || loading || previewLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-80"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          {previewLoading ? (
            <><span className="animate-spin">⟳</span> Scanning…</>
          ) : cleaning ? (
            <><span className="animate-spin">⟳</span> Deleting…</>
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

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* ── Confirmation Modal ── */}
      {showModal && preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-5 text-white"
            style={{ background: "#1A1A24", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            {/* Modal header */}
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-black text-base">Confirm Permanent Deletion</h3>
                <p className="text-xs mt-1" style={{ color: "#4A4A58" }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Preview summary */}
            <div
              className="rounded-xl p-4 text-sm space-y-1"
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              {preview.deleted_count === 0 ? (
                <p style={{ color: "#4A4A58" }}>No abandoned files found — nothing to delete.</p>
              ) : (
                <>
                  <p>
                    <span className="font-bold text-white">{preview.deleted_count}</span>
                    <span style={{ color: "#4A4A58" }}> files will be permanently deleted</span>
                  </p>
                  <p>
                    <span className="font-bold text-white">{preview.freed_mb.toFixed(2)} MB</span>
                    <span style={{ color: "#4A4A58" }}> will be freed</span>
                  </p>
                  {preview.paths.length > 0 && (
                    <div className="mt-2 max-h-28 overflow-y-auto space-y-0.5 text-xs font-mono" style={{ color: "#4A4A58" }}>
                      {preview.paths.map((p) => (
                        <p key={p} className="truncate">• {p}</p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(false); setPreview(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ background: "#0E0E14", border: "1px solid rgba(255,255,255,0.06)", color: "#888" }}
              >
                Cancel
              </button>
              {preview.deleted_count > 0 && (
                <button
                  onClick={confirmCleanup}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                >
                  Delete {preview.deleted_count} files
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
