"use client";

import { useState, useEffect, FormEvent } from "react";
import type { PromoCode } from "@/lib/supabase";

/* ── Add-promo form ─────────────────────────────────────── */
function AddPromoForm({ onCreated }: { onCreated: () => void }) {
  const [code,    setCode]    = useState("");
  const [type,    setType]    = useState<"flat" | "percent">("flat");
  const [value,   setValue]   = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          code,
          type,
          value:    parseInt(value, 10),
          max_uses: maxUses ? parseInt(maxUses, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setCode(""); setValue(""); setMaxUses("");
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "rounded-xl px-3 py-2 text-sm text-white outline-none w-full";
  const inputSty = { background: "#111116", border: "1px solid rgba(255,184,0,0.12)" };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5 space-y-4"
      style={{ background: "linear-gradient(145deg,#1A1A24,#111116)", border: "1px solid rgba(255,184,0,0.12)" }}
    >
      <h2 className="text-sm font-black text-white">Add New Promo Code</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Code */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold" style={{ color: "#FFB800" }}>Code</label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SAVE100"
            className={inputCls}
            style={inputSty}
          />
        </div>
        {/* Type */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold" style={{ color: "#FFB800" }}>Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "flat" | "percent")}
            className={inputCls}
            style={inputSty}
          >
            <option value="flat">Flat ₹</option>
            <option value="percent">Percent %</option>
          </select>
        </div>
        {/* Value */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold" style={{ color: "#FFB800" }}>
            Value ({type === "flat" ? "₹" : "%"})
          </label>
          <input
            required
            type="number"
            min={1}
            max={type === "percent" ? 100 : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === "flat" ? "100" : "15"}
            className={inputCls}
            style={inputSty}
          />
        </div>
        {/* Max uses */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold" style={{ color: "#FFB800" }}>Max Uses (opt)</label>
          <input
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Unlimited"
            className={inputCls}
            style={inputSty}
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 rounded-xl text-sm font-bold text-black disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#FFD700,#FF9A3C)" }}
      >
        {loading ? "Creating…" : "＋ Create Promo"}
      </button>
    </form>
  );
}

/* ── Inline-editable row ────────────────────────────────── */
function PromoRow({ promo, onChanged }: { promo: PromoCode; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value,   setValue]   = useState(String(promo.value));
  const [maxUses, setMaxUses] = useState(promo.max_uses != null ? String(promo.max_uses) : "");
  const [saving,  setSaving]  = useState(false);

  async function saveEdit() {
    setSaving(true);
    await fetch(`/api/admin/promos/${promo.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        value:    parseInt(value, 10),
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
      }),
    });
    setSaving(false);
    setEditing(false);
    onChanged();
  }

  async function toggleActive() {
    await fetch(`/api/admin/promos/${promo.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ active: !promo.active }),
    });
    onChanged();
  }

  async function deletePromo() {
    if (!confirm(`Delete promo "${promo.code}"?`)) return;
    await fetch(`/api/admin/promos/${promo.id}`, { method: "DELETE" });
    onChanged();
  }

  const cellSty = { color: "#D0D0D8" };
  const inputSty = {
    background: "#0E0E14",
    border: "1px solid rgba(255,184,0,0.2)",
    borderRadius: 8,
    padding: "2px 8px",
    color: "#fff",
    fontSize: 12,
    width: 72,
  };

  return (
    <tr style={{ borderTop: "1px solid rgba(255,184,0,0.05)" }}>
      {/* Code */}
      <td className="px-4 py-3 font-mono font-bold text-xs text-white">{promo.code}</td>
      {/* Type */}
      <td className="px-4 py-3 text-xs" style={cellSty}>
        {promo.type === "flat" ? "Flat ₹" : "Percent %"}
      </td>
      {/* Value */}
      <td className="px-4 py-3 text-xs font-bold" style={{ color: "#FFB800" }}>
        {editing ? (
          <input
            type="number"
            value={value}
            min={1}
            onChange={(e) => setValue(e.target.value)}
            style={inputSty}
          />
        ) : (
          promo.type === "flat" ? `₹${promo.value}` : `${promo.value}%`
        )}
      </td>
      {/* Max Uses */}
      <td className="px-4 py-3 text-xs" style={cellSty}>
        {editing ? (
          <input
            type="number"
            value={maxUses}
            min={1}
            placeholder="∞"
            onChange={(e) => setMaxUses(e.target.value)}
            style={{ ...inputSty, width: 64 }}
          />
        ) : (
          promo.max_uses != null ? promo.max_uses : <span style={{ color: "#4A4A58" }}>∞</span>
        )}
      </td>
      {/* Used */}
      <td className="px-4 py-3 text-xs" style={cellSty}>{promo.used_count}</td>
      {/* Active toggle */}
      <td className="px-4 py-3">
        <button
          onClick={toggleActive}
          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
          style={{ background: promo.active ? "#22c55e" : "#252530" }}
        >
          <span
            className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
            style={{ transform: promo.active ? "translateX(18px)" : "translateX(3px)" }}
          />
        </button>
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                {saving ? "…" : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                style={{ background: "rgba(255,184,0,0.08)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.15)" }}
              >
                Edit
              </button>
              <button
                onClick={deletePromo}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function AdminPromosPage() {
  const [promos,  setPromos]  = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promos");
      if (res.ok) setPromos(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black">Promo Codes</h1>
          <p className="text-xs mt-0.5" style={{ color: "#4A4A58" }}>{promos.length} codes</p>
        </div>
        <button
          onClick={load}
          className="text-xs px-3 py-1.5 rounded-xl font-semibold"
          style={{ background: "#0E0E14", border: "1px solid rgba(255,184,0,0.08)" }}
        >
          {loading ? "…" : "↻ Refresh"}
        </button>
      </div>

      {/* Add form */}
      <AddPromoForm onCreated={load} />

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(255,184,0,0.1)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#1A1A24" }}>
              {["Code", "Type", "Value", "Max Uses", "Used", "Active", "Actions"].map((h) => (
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
          <tbody style={{ background: "#111116" }}>
            {promos.map((promo) => (
              <PromoRow key={promo.id} promo={promo} onChanged={load} />
            ))}
            {promos.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: "#252530" }}>
                  No promo codes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
