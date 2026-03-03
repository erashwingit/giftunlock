"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/lib/supabase";

/* ── Types ─────────────────────────────────────────────── */
interface Stats {
  total: number;
  paid: number;
  pending: number;
  failed: number;
  nfc: number;
}

interface AdminResponse {
  orders: Order[];
  count: number;
  stats: Stats | null;
  page: number;
  perPage: number;
}

/* ── Stat card ─────────────────────────────────────────── */
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 space-y-1"
      style={{
        background: "linear-gradient(145deg, #1A1A24, #111116)",
        border: `1px solid ${color}22`,
      }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
        {label}
      </p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}

/* ── Status badge ──────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    paid:    { bg: "rgba(34,197,94,0.12)",  color: "#22c55e" },
    pending: { bg: "rgba(255,184,0,0.12)",  color: "#FFB800" },
    failed:  { bg: "rgba(239,68,68,0.12)",  color: "#ef4444" },
  };
  const style = map[status] ?? { bg: "rgba(255,255,255,0.06)", color: "#888" };
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: style.bg, color: style.color }}
    >
      {status}
    </span>
  );
}

/* ── Edit modal ────────────────────────────────────────── */
function EditModal({
  order,
  secret,
  onClose,
  onSaved,
}: {
  order: Order;
  secret: string;
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
        headers: {
          "Content-Type":    "application/json",
          "x-admin-secret":  secret,
        },
        body: JSON.stringify({
          destination_video_url: videoUrl || null,
          artistic_qr_url:       qrUrl    || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      onSaved(updated);
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
        style={{
          background: "#1A1A24",
          border: "1px solid rgba(255,184,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-black text-white">
          Edit Order{" "}
          <span className="font-mono text-sm" style={{ color: "#FFB800" }}>
            {order.secure_slug.toUpperCase()}
          </span>
        </h2>

        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-bold" style={{ color: "#FFB800" }}>
              Destination Video URL
            </span>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1"
              style={{
                background: "#111116",
                border: "1px solid rgba(255,184,0,0.15)",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ["--tw-ring-color" as any]: "#FFB800",
              }}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold" style={{ color: "#FFB800" }}>
              Artistic QR URL
            </span>
            <input
              value={qrUrl}
              onChange={(e) => setQrUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1"
              style={{
                background: "#111116",
                border: "1px solid rgba(255,184,0,0.15)",
              }}
            />
          </label>
        </div>

        {err && (
          <p className="text-xs text-red-400">{err}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-black transition-opacity"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{
              border: "1px solid rgba(255,184,0,0.15)",
              color: "#4A4A58",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main dashboard ────────────────────────────────────── */
export default function AdminPage() {
  const [authed,   setAuthed]   = useState(false);
  const [secret,   setSecret]   = useState("");
  const [input,    setInput]    = useState("");
  const [authErr,  setAuthErr]  = useState("");

  const [data,     setData]     = useState<AdminResponse | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [page,     setPage]     = useState(1);
  const [filter,   setFilter]   = useState("");
  const [editing,  setEditing]  = useState<Order | null>(null);

  /* ── Load orders ────────────────────────────────────── */
  const load = useCallback(
    async (pg: number, fil: string, sec: string) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page: String(pg) });
        if (fil) qs.set("status", fil);
        const res = await fetch(`/api/admin/orders?${qs}`, {
          headers: { "x-admin-secret": sec },
        });
        if (res.status === 401) {
          setAuthed(false);
          setAuthErr("Invalid secret");
          return;
        }
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (authed) load(page, filter, secret);
  }, [authed, page, filter, secret, load]);

  /* ── Password gate ──────────────────────────────────── */
  if (!authed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #0A0A0B, #12121A)" }}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-8 space-y-6"
          style={{
            background: "linear-gradient(145deg, #1A1A24, #111116)",
            border: "1px solid rgba(255,184,0,0.12)",
          }}
        >
          <div className="text-center space-y-1">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto"
              style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)" }}
            >
              🔐
            </div>
            <h1 className="text-xl font-black text-white mt-3">Admin Dashboard</h1>
            <p className="text-sm" style={{ color: "#4A4A58" }}>
              GiftUnlock.in
            </p>
          </div>

          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (() => { setSecret(input); setAuthed(true); setAuthErr(""); })()
            }
            placeholder="Enter admin secret"
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
            style={{
              background: "#111116",
              border: "1px solid rgba(255,184,0,0.15)",
            }}
          />

          {authErr && (
            <p className="text-xs text-red-400 text-center">{authErr}</p>
          )}

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

  /* ── Dashboard ──────────────────────────────────────── */
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
      {/* Edit modal */}
      {editing && (
        <EditModal
          order={editing}
          secret={secret}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    orders: prev.orders.map((o) =>
                      o.id === updated.id ? updated : o
                    ),
                  }
                : prev
            );
            setEditing(null);
          }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">GiftUnlock Admin</h1>
            <p className="text-xs" style={{ color: "#4A4A58" }}>
              Order management dashboard
            </p>
          </div>
          <button
            onClick={() => setAuthed(false)}
            className="text-xs px-4 py-2 rounded-xl"
            style={{ border: "1px solid rgba(255,184,0,0.15)", color: "#4A4A58" }}
          >
            Sign out
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard label="Total"   value={stats.total}   color="#FFB800" />
            <StatCard label="Paid"    value={stats.paid}    color="#22c55e" />
            <StatCard label="Pending" value={stats.pending} color="#FFB800" />
            <StatCard label="Failed"  value={stats.failed}  color="#ef4444" />
            <StatCard label="NFC VIP" value={stats.nfc}     color="#a855f7" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {["", "paid", "pending", "failed"].map((s) => (
            <button
              key={s || "all"}
              onClick={() => { setFilter(s); setPage(1); }}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: filter === s ? "linear-gradient(135deg,#FFD700,#FF9A3C)" : "rgba(255,184,0,0.06)",
                color:      filter === s ? "#0A0A0B" : "#4A4A58",
                border:     filter === s ? "none" : "1px solid rgba(255,184,0,0.1)",
              }}
            >
              {s || "All"}
            </button>
          ))}
          <button
            onClick={() => load(page, filter, secret)}
            className="ml-auto px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ border: "1px solid rgba(255,184,0,0.15)", color: "#4A4A58" }}
          >
            {loading ? "…" : "↻ Refresh"}
          </button>
        </div>

        {/* Orders table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,184,0,0.1)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#1A1A24" }}>
                {[
                  "Order", "Customer", "Product", "Tier",
                  "Status", "Video", "Created", "Actions",
                ].map((h) => (
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
                  style={{
                    background: i % 2 === 0 ? "#111116" : "#0E0E14",
                    borderTop: "1px solid rgba(255,184,0,0.05)",
                  }}
                >
                  <td className="px-4 py-3 font-mono font-bold text-xs text-white">
                    {order.secure_slug.toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white text-xs font-semibold">
                      {order.customer_name}
                    </div>
                    <div className="text-xs" style={{ color: "#4A4A58" }}>
                      {order.customer_phone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#D0D0D8" }}>
                    {order.product_type}
                    {order.product_size && (
                      <span style={{ color: "#4A4A58" }}> · {order.product_size}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: order.tier === "NFC VIP" ? "#a855f7" : "#FFB800",
                      }}
                    >
                      {order.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.payment_status} />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {order.destination_video_url ? (
                      <a
                        href={order.destination_video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: "#FFB800" }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ color: "#252530" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#4A4A58" }}>
                    {new Date(order.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditing(order)}
                      className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                      style={{
                        background: "rgba(255,184,0,0.1)",
                        color: "#FFB800",
                        border: "1px solid rgba(255,184,0,0.2)",
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm"
                    style={{ color: "#252530" }}
                  >
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
            >
              ← Prev
            </button>
            <span className="text-xs" style={{ color: "#4A4A58" }}>
              Page {page} of {pages}
            </span>
            <button
              disabled={page === pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-30"
              style={{ border: "1px solid rgba(255,184,0,0.15)", color: "#4A4A58" }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
