"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/lib/supabase";

/* ── Types ──────────────────────────────────────────────── */
interface Stats {
  total: number; paid: number; pending: number; failed: number; nfc: number; fulfilled: number;
}
interface AdminResponse {
  orders: Order[]; count: number; stats: Stats | null; page: number; perPage: number;
}

/* ── Helpers ────────────────────────────────────────────── */
function badge(
  text: string,
  bg: string,
  color: string
) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: bg, color }}
    >
      {text}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    paid:      ["rgba(34,197,94,0.12)",  "#22c55e"],
    pending:   ["rgba(255,184,0,0.12)",  "#FFB800"],
    failed:    ["rgba(239,68,68,0.12)",  "#ef4444"],
    fulfilled: ["rgba(168,85,247,0.12)", "#a855f7"],
  };
  const [bg, color] = map[status] ?? ["rgba(255,255,255,0.06)", "#888"];
  return badge(status, bg, color);
}

function PrintTypeBadge({ printType }: { printType?: string | null }) {
  if (printType === "photo_print_qr") {
    return badge("🖼️ Photo + QR", "rgba(255,184,0,0.15)", "#FFB800");
  }
  return badge("🎨 QR Only", "rgba(168,85,247,0.12)", "#a855f7");
}

/* ── Media modal ────────────────────────────────────────── */
function MediaModal({ urls, onClose }: { urls: string[]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
        style={{ background: "#1A1A24", border: "1px solid rgba(255,184,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white">Media Files ({urls.length})</h2>
          <button onClick={onClose} className="text-xs" style={{ color: "#4A4A58" }}>✕ Close</button>
        </div>
        {urls.length === 0 ? (
          <p className="text-sm" style={{ color: "#4A4A58" }}>No media files.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {urls.map((url, i) => {
              const isVideo = /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
              return isVideo ? (
                <video
                  key={i}
                  src={url}
                  controls
                  className="w-full rounded-xl"
                  style={{ background: "#111116" }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`media-${i}`}
                  className="w-full rounded-xl object-cover"
                  style={{ maxHeight: 240 }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function AdminOrdersPage() {
  const [data,       setData]      = useState<AdminResponse | null>(null);
  const [loading,    setLoading]   = useState(true);
  const [page,       setPage]      = useState(1);
  const [filter,     setFilter]    = useState("");
  const [mediaUrls,   setMediaUrls]   = useState<string[] | null>(null);
  const [actionMsg,   setActionMsg]   = useState("");
  const [videoInputId, setVideoInputId] = useState<string | null>(null);
  const [videoInput,   setVideoInput]   = useState("");

  const load = useCallback(async (pg: number, fil: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(pg) });
      if (fil) qs.set("status", fil);
      const res = await fetch(`/api/admin/orders?${qs}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, filter); }, [page, filter, load]);

  async function markFulfilled(id: string) {
    setActionMsg("Marking fulfilled…");
    const res = await fetch(`/api/admin/orders/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ order_status: "fulfilled" }),
    });
    if (res.ok) {
      setActionMsg("✓ Marked as fulfilled");
      load(page, filter);
    } else {
      setActionMsg("Failed to update order");
    }
    setTimeout(() => setActionMsg(""), 3000);
  }

  async function deleteRawMedia(id: string) {
    if (!confirm("Delete all raw media files for this order? This cannot be undone.")) return;
    setActionMsg("Deleting media…");
    const res = await fetch(`/api/admin/orders/${id}/media`, { method: "DELETE" });
    if (res.ok) {
      const { deleted } = await res.json();
      setActionMsg(`✓ Deleted ${deleted} file(s)`);
      load(page, filter);
    } else {
      setActionMsg("Failed to delete media");
    }
    setTimeout(() => setActionMsg(""), 3000);
  }

  async function saveVideoUrl(id: string) {
    const url = videoInput.trim();
    if (!url) return;
    setActionMsg("Saving video URL…");
    const res = await fetch(`/api/admin/orders/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ destination_video_url: url }),
    });
    if (res.ok) {
      setActionMsg("✓ Video URL saved");
      setVideoInputId(null);
      setVideoInput("");
      load(page, filter);
    } else {
      setActionMsg("Failed to save video URL");
    }
    setTimeout(() => setActionMsg(""), 3000);
  }

  const stats   = data?.stats;
  const orders  = data?.orders ?? [];
  const total   = data?.count  ?? 0;
  const perPage = data?.perPage ?? 20;
  const pages   = Math.ceil(total / perPage);

  const inputStyle = { background: "#0E0E14", border: "1px solid rgba(255,184,0,0.08)" };

  return (
    <div className="p-6 space-y-6 text-white">
      {/* Media modal */}
      {mediaUrls && (
        <MediaModal urls={mediaUrls} onClose={() => setMediaUrls(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Orders</h1>
          <p className="text-xs mt-0.5" style={{ color: "#4A4A58" }}>
            {total} total orders
          </p>
        </div>
        {actionMsg && (
          <span className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,184,0,0.1)", color: "#FFB800" }}>
            {actionMsg}
          </span>
        )}
        <button
          onClick={() => load(page, filter)}
          className="text-xs px-3 py-1.5 rounded-xl font-semibold"
          style={inputStyle}
        >
          {loading ? "…" : "↻ Refresh"}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {([
            ["Total",     stats.total,     "#FFB800"],
            ["Paid",      stats.paid,      "#22c55e"],
            ["Pending",   stats.pending,   "#FFB800"],
            ["Failed",    stats.failed,    "#ef4444"],
            ["NFC VIP",   stats.nfc,       "#a855f7"],
            ["Fulfilled", stats.fulfilled, "#a855f7"],
          ] as [string, number, string][]).map(([label, value, color]) => (
            <div
              key={label}
              className="rounded-2xl p-4 space-y-1"
              style={{ background: "linear-gradient(145deg,#1A1A24,#111116)", border: `1px solid ${color}22` }}
            >
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
              <p className="text-3xl font-black">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["", "paid", "pending", "failed", "fulfilled"].map((s) => (
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
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-x-auto" style={{ border: "1px solid rgba(255,184,0,0.1)" }}>
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr style={{ background: "#1A1A24" }}>
              {[
                "Order ID", "Name", "Email", "Product", "Tier",
                "Occasion", "Promo Used", "Total", "Status", "Date", "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest whitespace-nowrap"
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
                  background:  i % 2 === 0 ? "#111116" : "#0E0E14",
                  borderTop:   "1px solid rgba(255,184,0,0.05)",
                }}
              >
                {/* Order ID */}
                <td className="px-4 py-3 font-mono text-xs font-bold text-white whitespace-nowrap">
                  {order.secure_slug.toUpperCase()}
                </td>
                {/* Name */}
                <td className="px-4 py-3">
                  <div className="text-xs font-semibold text-white">{order.customer_name}</div>
                  <div className="text-[11px]" style={{ color: "#4A4A58" }}>{order.customer_phone}</div>
                </td>
                {/* Email */}
                <td className="px-4 py-3 text-xs" style={{ color: "#9090A0" }}>
                  {order.customer_email ? (
                    <a href={`mailto:${order.customer_email}`} style={{ color: "#6B8AFD" }}>
                      {order.customer_email}
                    </a>
                  ) : (
                    <span style={{ color: "#252530" }}>—</span>
                  )}
                </td>
                {/* Product */}
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#D0D0D8" }}>
                  {order.product_type}
                  {order.product_size && (
                    <span style={{ color: "#4A4A58" }}> · {order.product_size}</span>
                  )}
                </td>
                {/* Tier */}
                <td className="px-4 py-3 text-xs font-bold whitespace-nowrap"
                  style={{ color: order.tier === "NFC VIP" ? "#a855f7" : "#FFB800" }}>
                  {order.tier}
                </td>
                {/* Occasion */}
                <td className="px-4 py-3 text-xs" style={{ color: "#9090A0" }}>
                  {order.occasion ?? <span style={{ color: "#252530" }}>—</span>}
                </td>
                {/* Promo Used */}
                <td className="px-4 py-3 text-xs font-mono">
                  {order.promo_code ? (
                    <span style={{ color: "#FFB800" }}>{order.promo_code}</span>
                  ) : (
                    <span style={{ color: "#252530" }}>—</span>
                  )}
                </td>
                {/* Total */}
                <td className="px-4 py-3 text-xs font-bold text-white whitespace-nowrap">
                  {order.final_total != null ? `₹${order.final_total.toLocaleString("en-IN")}` : "—"}
                  {order.discount_amount ? (
                    <div className="text-[10px] font-normal" style={{ color: "#22c55e" }}>
                      −₹{order.discount_amount}
                    </div>
                  ) : null}
                </td>
                {/* Status — shows payment_status badge + fulfilled badge + print type */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <StatusBadge status={order.payment_status} />
                    {(order as Order & { order_status?: string }).order_status === "fulfilled" && (
                      badge("fulfilled", "rgba(168,85,247,0.12)", "#a855f7")
                    )}
                    <PrintTypeBadge printType={order.print_type} />
                  </div>
                </td>
                {/* Date */}
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#4A4A58" }}>
                  {new Date(order.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "2-digit",
                  })}
                </td>
                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 min-w-[120px]">
                    {/* View Media */}
                    <button
                      onClick={() => setMediaUrls(order.media_urls ?? [])}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-opacity hover:opacity-80 whitespace-nowrap"
                      style={{
                        background: "rgba(255,184,0,0.08)",
                        color:      "#FFB800",
                        border:     "1px solid rgba(255,184,0,0.15)",
                      }}
                    >
                      📷 View Media
                    </button>
                    {/* Delete Raw Media */}
                    <button
                      onClick={() => deleteRawMedia(order.id)}
                      disabled={(order.media_urls ?? []).length === 0}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-opacity hover:opacity-80 disabled:opacity-30 whitespace-nowrap"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        color:      "#ef4444",
                        border:     "1px solid rgba(239,68,68,0.15)",
                      }}
                    >
                      🗑 Del Media
                    </button>
                    {/* Set Video URL */}
                    {videoInputId === order.id ? (
                      <div className="flex flex-col gap-1">
                        <input
                          autoFocus
                          value={videoInput}
                          onChange={e => setVideoInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveVideoUrl(order.id); if (e.key === "Escape") { setVideoInputId(null); setVideoInput(""); } }}
                          placeholder="https://youtu.be/…"
                          className="w-full px-2 py-1 rounded-lg text-[11px] text-white outline-none"
                          style={{ background: "rgba(17,17,22,0.9)", border: "1px solid rgba(255,184,0,0.4)", minWidth: 160 }}
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveVideoUrl(order.id)}
                            className="flex-1 px-2 py-1 rounded-lg text-[11px] font-bold"
                            style={{ background: "#22c55e", color: "#fff" }}
                          >✓ Save</button>
                          <button
                            onClick={() => { setVideoInputId(null); setVideoInput(""); }}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold"
                            style={{ background: "rgba(255,255,255,0.06)", color: "#4A4A58" }}
                          >✕</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setVideoInputId(order.id);
                          setVideoInput((order as Order & { destination_video_url?: string }).destination_video_url ?? "");
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-opacity hover:opacity-80 whitespace-nowrap"
                        style={{
                          background: (order as Order & { destination_video_url?: string }).destination_video_url
                            ? "rgba(34,197,94,0.08)" : "rgba(255,184,0,0.06)",
                          color:  (order as Order & { destination_video_url?: string }).destination_video_url
                            ? "#22c55e" : "#9B9BAA",
                          border: `1px solid ${(order as Order & { destination_video_url?: string }).destination_video_url ? "rgba(34,197,94,0.2)" : "rgba(255,184,0,0.1)"}`,
                        }}
                      >
                        {(order as Order & { destination_video_url?: string }).destination_video_url ? "🎬 Edit Video URL" : "🎬 Set Video URL"}
                      </button>
                    )}
                    {/* Mark Fulfilled */}
                    <button
                      onClick={() => markFulfilled(order.id)}
                      disabled={(order as Order & { order_status?: string }).order_status === "fulfilled"}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-opacity hover:opacity-80 disabled:opacity-30 whitespace-nowrap"
                      style={{
                        background: "rgba(168,85,247,0.08)",
                        color:      "#a855f7",
                        border:     "1px solid rgba(168,85,247,0.15)",
                      }}
                    >
                      ✓ Fulfilled
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-sm" style={{ color: "#252530" }}>
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-30"
            style={inputStyle}
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
            style={inputStyle}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
