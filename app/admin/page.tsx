"use client";

/**
 * app/admin/page.tsx — GiftUnlock Admin Dashboard (Phase 2)
 *
 * • StorageBar  — live usage bar (green/amber/red), stale-while-revalidate on refresh
 * • CleanupPanel — "Clean Abandoned Uploads >48h" button + session log
 * • DeleteMediaButton — per-order raw media delete (paid orders only)
 * • 'abandoned' status badge + filter
 */

import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/lib/supabase";
import type { CleanupResult } from "@/lib/cleanup";

/* ─── API types ──────────────────────────────────────────── */

interface Stats {
  total:   number;
  paid:    number;
  pending: number;
  failed:  number;
  nfc:     number;
}

interface AdminResponse {
  orders:  Order[];
  count:   number;
  stats:   Stats | null;
  page:    number;
  perPage: number;
}

interface StorageStats {
  usedBytes:            number;
  usedMB:               number;
  maxMB:                number;
  warnMB:               number;
  usedPercent:          number;
  adminWarned:          boolean;
  lastUpdated:          string | null;
  cleanupEligibleCount: number;
  totalAbandoned:       number;
}

/* ─── Helpers ────────────────────────────────────────────── */

function fmt(n: number, dec = 1) {
  return n.toFixed(dec);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── StorageBar ─────────────────────────────────────────── */

function StorageBar({
  stats,
  onRefresh,
  loading = false,
}: {
  stats:      StorageStats;
  onRefresh:  () => void;
  loading?:   boolean;
}) {
  const pct   = Math.min(stats.usedPercent, 100);
  const color =
    pct >= 90 ? "#ef4444" :
    pct >= 80 ? "#FFB800" :
                "#22c55e";

  const trackColor =
    pct >= 90 ? "rgba(239,68,68,0.15)"  :
    pct >= 80 ? "rgba(255,184,0,0.12)"  :
               "rgba(34,197,94,0.12)";

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: "linear-gradient(145deg, #1A1A24, #111116)",
        border: `1px solid ${color}22`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
            💾 Storage Usage
          </p>
          {stats.adminWarned && (
            <p className="text-xs mt-0.5" style={{ color: "#FFB800" }}>
              ⚠️ Approaching 1 GB limit
            </p>
          )}
        </div>
        {/* Refresh button — shows spinner in-place; bar stays visible */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-xs px-3 py-1 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ border: "1px solid rgba(255,184,0,0.15)", color: "#4A4A58" }}
        >
          {loading ? "…" : "↻ Refresh"}
        </button>
      </div>

      {/* Progress bar */}
      <div>
        <div
          className="h-3 rounded-full overflow-hidden"
          style={{ background: trackColor }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs" style={{ color: "#4A4A58" }}>
          <span>
            <strong style={{ color: "white" }}>{fmt(stats.usedMB)} MB</strong>
            {" "}of {stats.maxMB.toLocaleString()} MB used
          </span>
          <strong style={{ color }}>{pct}%</strong>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs" style={{ color: "#4A4A58" }}>
        <span>
          {stats.cleanupEligibleCount > 0 ? (
            <span style={{ color: "#FFB800" }}>
              {stats.cleanupEligibleCount} order{stats.cleanupEligibleCount !== 1 ? "s" : ""} eligible for cleanup
            </span>
          ) : (
            "No orders eligible for cleanup"
          )}
        </span>
        {stats.lastUpdated && (
          <span>Last updated {timeAgo(stats.lastUpdated)}</span>
        )}
      </div>
    </div>
  );
}

/* ─── CleanupPanel ───────────────────────────────────────── */

interface CleanupEntry extends CleanupResult {
  id: string;
}

function CleanupPanel({ secret, onDone }: { secret: string; onDone: () => void }) {
  const [running, setRunning] = useState(false);
  const [log,     setLog]     = useState<CleanupEntry[]>([]);
  const [err,     setErr]     = useState("");

  async function run() {
    setRunning(true);
    setErr("");
    try {
      const res  = await fetch("/api/admin/cleanup", {
        method:  "POST",
        headers: { "x-admin-secret": secret },
      });
      const data = (await res.json()) as CleanupResult;
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Cleanup failed");

      const entry: CleanupEntry = { ...data, id: crypto.randomUUID() };
      setLog((prev) => [entry, ...prev.slice(0, 9)]);
      onDone();
    } catch (e) {
      setErr(String(e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: "linear-gradient(145deg, #1A1A24, #111116)",
        border:     "1px solid rgba(255,184,0,0.1)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#FFB800" }}>
            🗑️ Cleanup Abandoned Uploads
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#4A4A58" }}>
            Deletes storage + purges DB rows for abandoned/pending orders &gt;48 h
          </p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#FFD700,#FF9A3C)", color: "#0A0A0B" }}
        >
          {running ? <><span className="animate-spin">⟳</span> Running…</> : "Run Cleanup"}
        </button>
      </div>

      {err && <p className="text-xs" style={{ color: "#ef4444" }}>{err}</p>}

      {log.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: "#4A4A58" }}>Session log</p>
          {log.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl px-3 py-2 text-xs"
              style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}
            >
              <div className="flex items-center justify-between">
                <span style={{ color: "#22c55e" }}>
                  ✓ Deleted {entry.deletedOrders} order{entry.deletedOrders !== 1 ? "s" : ""}
                  {" · "}Freed {fmt(entry.freedMB, 2)} MB
                </span>
                <span style={{ color: "#4A4A58" }}>
                  {new Date(entry.processedAt).toLocaleTimeString("en-IN")}
                </span>
              </div>
              {entry.errors.length > 0 && (
                <p className="mt-1" style={{ color: "#FFB800" }}>
                  ⚠️ {entry.errors.length} warning{entry.errors.length !== 1 ? "s" : ""}:{" "}
                  {entry.errors[0]}
                  {entry.errors.length > 1 ? ` (+${entry.errors.length - 1} more)` : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── DeleteMediaButton ──────────────────────────────────── */

function DeleteMediaButton({
  order, secret, onDeleted,
}: {
  order:     Order;
  secret:    string;
  onDeleted: (orderId: string, freedMB: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [freed,    setFreed]    = useState<number | null>(null);

  const hasMedia = Array.isArray(order.media_urls) && order.media_urls.length > 0;

  if (!hasMedia && freed === null) {
    return <span className="text-xs" style={{ color: "#252530" }}>No media</span>;
  }

  if (freed !== null) {
    return <span className="text-xs" style={{ color: "#4A4A58" }}>Freed {fmt(freed, 2)} MB</span>;
  }

  async function handleDelete() {
    if (!confirm(`Delete raw media for order ${order.secure_slug.toUpperCase()}?\n\nThis cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/admin/orders/${order.id}/media`, {
        method:  "DELETE",
        headers: { "x-admin-secret": secret },
      });
      const data = await res.json() as { freedMB?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setFreed(data.freedMB ?? 0);
      onDeleted(order.id, data.freedMB ?? 0);
    } catch (e) {
      alert(String(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
      style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
    >
      {deleting ? "…" : "Delete Media"}
    </button>
  );
}

/* ─── StatCard ───────────────────────────────────────────── */

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-2xl p-4 space-y-1"
      style={{ background: "linear-gradient(145deg, #1A1A24, #111116)", border: `1px solid ${color}22` }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}

/* ─── StatusBadge ────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    paid:      { bg: "rgba(34,197,94,0.12)",   color: "#22c55e" },
    pending:   { bg: "rgba(255,184,0,0.12)",   color: "#FFB800" },
    failed:    { bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
    abandoned: { bg: "rgba(107,114,128,0.12)", color: "#9ca3af" },
  };
  const s = map[status] ?? { bg: "rgba(255,255,255,0.06)", color: "#888" };
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

/* ─── EditModal ──────────────────────────────────────────── */

function EditModal({
  order, secret, onClose, onSaved,
}: {
  order:   Order;
  secret:  string;
  onClose: () => void;
  onSaved: (updated: Order) => void;
}) {
  const [videoUrl, setVideoUrl] = useState(order.destination_video_url ?? "");
  const [qrUrl,    setQrUrl]    = useState(order.artistic_qr_url        ?? "");
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body:    JSON.stringify({
          destination_video_url: videoUrl || null,
          artistic_qr_url:       qrUrl    || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved(await res.json());
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: "#1A1A24", border: "1px solid rgba(255,184,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-black text-white">
          Edit Order{" "}
          <span className="font-mono text-sm" style={{ color: "#FFB800" }}>
            {order.secure_slug.toUpperCase()}
          </span>
        </h2>

        <div className="space-y-3">
          {([
            { label: "Destination Video URL", value: videoUrl, set: setVideoUrl },
            { label: "Artistic QR URL",        value: qrUrl,    set: setQrUrl    },
          ] as { label: string; value: string; set: (v: string) => void }[]).map(({ label, value, set }) => (
            <label key={label} className="block space-y-1">
              <span className="text-xs font-bold" style={{ color: "#FFB800" }}>{label}</span>
              <input
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: "#111116", border: "1px solid rgba(255,184,0,0.15)" }}
              />
            </label>
          ))}
        </div>

        {err && <p className="text-xs text-red-400">{err}</p>}

        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-black"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ border: "1px solid rgba(255,184,0,0.15)", color: "#4A4A58" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main admin page ────────────────────────────────────── */

export default function AdminPage() {
  const [authed,  setAuthed]  = useState(false);
  const [secret,  setSecret]  = useState("");
  const [input,   setInput]   = useState("");
  const [authErr, setAuthErr] = useState("");

  const [data,    setData]    = useState<AdminResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page,    setPage]    = useState(1);
  const [filter,  setFilter]  = useState("");
  const [editing, setEditing] = useState<Order | null>(null);

  const [storage,        setStorage]        = useState<StorageStats | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);

  /* ── Data loaders ───────────────────────────────────────── */
  const load = useCallback(async (pg: number, fil: string, sec: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(pg) });
      if (fil) qs.set("status", fil);
      const res = await fetch(`/api/admin/orders?${qs}`, { headers: { "x-admin-secret": sec } });
      if (res.status === 401) { setAuthed(false); setAuthErr("Invalid secret"); return; }
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStorage = useCallback(async (sec: string) => {
    setStorageLoading(true);
    try {
      const res = await fetch("/api/admin/storage", { headers: { "x-admin-secret": sec } });
      if (res.ok) setStorage(await res.json());
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      load(page, filter, secret);
      loadStorage(secret);
    }
  }, [authed, page, filter, secret, load, loadStorage]);

  /* ── Auth gate ──────────────────────────────────────────── */
  if (!authed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #0A0A0B, #12121A)" }}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-8 space-y-6"
          style={{ background: "linear-gradient(145deg, #1A1A24, #111116)", border: "1px solid rgba(255,184,0,0.12)" }}
        >
          <div className="text-center space-y-1">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto"
              style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)" }}
            >
              🔐
            </div>
            <h1 className="text-xl font-black text-white mt-3">Admin Dashboard</h1>
            <p className="text-sm" style={{ color: "#4A4A58" }}>GiftUnlock.in</p>
          </div>

          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { setSecret(input); setAuthed(true); setAuthErr(""); }
            }}
            placeholder="Enter admin secret"
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
            style={{ background: "#111116", border: "1px solid rgba(255,184,0,0.15)" }}
          />

          {authErr && <p className="text-xs text-red-400 text-center">{authErr}</p>}

          <button
            onClick={() => { setSecret(input); setAuthed(true); setAuthErr(""); }}
            className="w-full py-3 rounded-xl font-bold text-sm text-black"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)" }}
          >
            Enter Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── Dashboard ──────────────────────────────────────────── */
  const stats   = data?.stats;
  const orders  = data?.orders ?? [];
  const total   = data?.count  ?? 0;
  const perPage = data?.perPage ?? 20;
  const pages   = Math.ceil(total / perPage);

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(135deg, #0A0A0B, #12121A)" }}
    >
      {editing && (
        <EditModal
          order={editing}
          secret={secret}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setData((prev) =>
              prev ? { ...prev, orders: prev.orders.map((o) => (o.id === updated.id ? updated : o)) } : prev
            );
            setEditing(null);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">GiftUnlock Admin</h1>
            <p className="text-xs" style={{ color: "#4A4A58" }}>Order management · Phase 2</p>
          </div>
          <button
            onClick={() => setAuthed(false)}
            className="text-xs px-4 py-2 rounded-xl"
            style={{ border: "1px solid rgba(255,184,0,0.15)", color: "#4A4A58" }}
          >
            Sign out
          </button>
        </div>

        {/* Storage + Cleanup */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* StorageBar: show skeleton only on first load; stale data stays visible on refresh */}
          {!storage ? (
            <div
              className="rounded-2xl p-5 flex items-center justify-center h-28"
              style={{ background: "linear-gradient(145deg, #1A1A24, #111116)", border: "1px solid rgba(255,184,0,0.08)" }}
            >
              <span className="text-xs animate-pulse" style={{ color: "#4A4A58" }}>Loading storage stats…</span>
            </div>
          ) : (
            <StorageBar
              stats={storage}
              loading={storageLoading}
              onRefresh={() => loadStorage(secret)}
            />
          )}

          <CleanupPanel
            secret={secret}
            onDone={() => {
              loadStorage(secret);
              load(page, filter, secret);
            }}
          />
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard label="Total"     value={stats.total}                  color="#FFB800" />
            <StatCard label="Paid"      value={stats.paid}                   color="#22c55e" />
            <StatCard label="Pending"   value={stats.pending}                color="#FFB800" />
            <StatCard label="Abandoned" value={storage?.totalAbandoned ?? 0} color="#9ca3af" />
            <StatCard label="NFC VIP"   value={stats.nfc}                    color="#a855f7" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {["", "paid", "pending", "abandoned", "failed"].map((s) => (
            <button
              key={s || "all"}
              onClick={() => { setFilter(s); setPage(1); }}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: filter === s ? "linear-gradient(135deg,#FFD700,#FF9A3C)" : "rgba(255,184,0,0.06)",
                color:      filter === s ? "#0A0A0B" : "#4A4A58",
                border:     filter === s ? "none"    : "1px solid rgba(255,184,0,0.1)",
              }}
            >
              {s || "All"}
            </button>
          ))}
          <button
            onClick={() => { load(page, filter, secret); loadStorage(secret); }}
            className="ml-auto px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ border: "1px solid rgba(255,184,0,0.15)", color: "#4A4A58" }}
          >
            {loading ? "…" : "↻ Refresh"}
          </button>
        </div>

        {/* Orders table */}
        <div className="rounded-2xl overflow-x-auto" style={{ border: "1px solid rgba(255,184,0,0.1)" }}>
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr style={{ background: "#1A1A24" }}>
                {["Order", "Customer", "Product", "Tier", "Status", "Video", "Media", "Created", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest"
                    style={{ color: "#4A4A58" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr
                  key={order.id}
                  style={{ background: i % 2 === 0 ? "#111116" : "#0E0E14", borderTop: "1px solid rgba(255,184,0,0.05)" }}
                >
                  <td className="px-4 py-3 font-mono font-bold text-xs text-white">
                    {order.secure_slug.toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white text-xs font-semibold">{order.customer_name}</div>
                    <div className="text-xs" style={{ color: "#4A4A58" }}>{order.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#D0D0D8" }}>
                    {order.product_type}
                    {order.product_size && <span style={{ color: "#4A4A58" }}> · {order.product_size}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold" style={{ color: order.tier === "NFC VIP" ? "#a855f7" : "#FFB800" }}>
                      {order.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.payment_status} />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {order.destination_video_url ? (
                      <a href={order.destination_video_url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#FFB800" }}>View</a>
                    ) : (
                      <span style={{ color: "#252530" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {order.payment_status === "paid" ? (
                      <DeleteMediaButton
                        order={order}
                        secret={secret}
                        onDeleted={(orderId, freedMB) => {
                          setData((prev) =>
                            prev
                              ? { ...prev, orders: prev.orders.map((o) => o.id === orderId ? { ...o, media_urls: [] } : o) }
                              : prev
                          );
                          console.log(`Media deleted for ${orderId}, freed ${freedMB.toFixed(2)} MB`);
                          loadStorage(secret);
                        }}
                      />
                    ) : (
                      <span className="text-xs" style={{ color: "#252530" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#4A4A58" }}>
                    {new Date(order.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing(order)}
                      className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                      style={{ background: "rgba(255,184,0,0.1)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.2)" }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm" style={{ color: "#252530" }}>
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-30"
              style={{ border: "1px solid rgba(255,184,0,0.15)", color: "#4A4A58" }}
            >← Prev</button>
            <span className="text-xs" style={{ color: "#4A4A58" }}>Page {page} of {pages}</span>
            <button
              disabled={page === pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-30"
              style={{ border: "1px solid rgba(255,184,0,0.15)", color: "#4A4A58" }}
            >Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
