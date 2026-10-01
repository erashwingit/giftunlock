"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Image from "next/image";

interface AdminProductItem {
  id:           string;
  name:         string;
  price:        number;
  formattedPrice: string;
  image:        string;
  defaultImage: string;
  emoji:        string;
  desc:         string;
  isCustom?:    boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        setMessage({ text: "Failed to load products", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error loading products", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleImageUrlChange(id: string, url: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, image: url, isCustom: url !== p.defaultImage } : p))
    );
  }

  function handleResetDefault(id: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, image: p.defaultImage, isCustom: false } : p))
    );
  }

  async function handleFileUpload(id: string, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(id);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("productId", id);

    try {
      const res = await fetch("/api/admin/products/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        handleImageUrlChange(id, data.url);
        setMessage({ text: `Uploaded photo for ${id}! Remember to click Save & Sync below.`, type: "success" });
      } else {
        setMessage({ text: data.error || "Upload failed", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error during upload", type: "error" });
    } finally {
      setUploadingId(null);
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    setMessage(null);

    const mapping: Record<string, string> = {};
    products.forEach((p) => {
      mapping[p.id] = p.image;
    });

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapping }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "All product images saved and synced with the live website!", type: "success" });
        await loadProducts();
      } else {
        setMessage({ text: data.error || "Failed to save product images", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error while saving", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span>🖼️</span> Product Visuals &amp; Photos
          </h1>
          <p className="text-sm text-[#9B9BAA] mt-1">
            Replace emojis with photorealistic product imagery. Upload real photos or paste URLs.
            Images sync automatically to the Homepage and Order checkout canvas.
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving || loading}
          className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #FFD700 0%, #FF9A3C 100%)",
            color: "#0A0A0B",
          }}
        >
          {saving ? "Saving & Syncing…" : "💾 Save & Sync All to Live Store"}
        </button>
      </div>

      {/* Status banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-[#9B9BAA]">Loading products catalog…</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl flex flex-col gap-4"
              style={{
                background: "linear-gradient(145deg, #1A1A24, #111116)",
                border: "1px solid rgba(255,184,0,0.15)",
              }}
            >
              {/* Image Preview */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-5xl">{p.emoji}</span>
                )}
                {p.isCustom && (
                  <span
                    className="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: "#22c55e", color: "#0A0A0B" }}
                  >
                    Custom Photo
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                    <span>{p.emoji}</span> {p.name}
                  </h3>
                  <p className="text-xs text-[#9B9BAA] line-clamp-1">{p.desc}</p>
                </div>
                <span className="text-sm font-black text-[#FFB800]">{p.formattedPrice}</span>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                {/* Upload File */}
                <div>
                  <label className="block text-xs font-semibold text-[#9B9BAA] mb-1.5">
                    Upload New Image File
                  </label>
                  <label
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-dashed border-[#FFB800]/40 hover:border-[#FFB800] text-xs font-semibold cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.05]"
                  >
                    <span>{uploadingId === p.id ? "⏳ Uploading…" : "📁 Choose Image file"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingId === p.id}
                      onChange={(e) => handleFileUpload(p.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct URL */}
                <div>
                  <label className="block text-xs font-semibold text-[#9B9BAA] mb-1">
                    Or Enter Image URL
                  </label>
                  <input
                    type="url"
                    value={p.image}
                    onChange={(e) => handleImageUrlChange(p.id, e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[#0E0E14] border border-white/10 text-white outline-none focus:border-[#FFB800]"
                  />
                </div>

                {/* Reset button */}
                {p.isCustom && (
                  <button
                    onClick={() => handleResetDefault(p.id)}
                    className="text-[11px] text-[#9B9BAA] hover:text-[#f87171] transition-colors"
                  >
                    ↺ Reset to default generated photo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Save Bar */}
      <div
        className="sticky bottom-6 p-4 rounded-2xl flex items-center justify-between"
        style={{
          background: "rgba(17,17,22,0.95)",
          border: "1px solid rgba(255,184,0,0.2)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div className="text-xs text-[#9B9BAA]">
          Changes saved here update the live store immediately upon clicking Save.
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving || loading}
          className="px-6 py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #FFD700 0%, #FF9A3C 100%)",
            color: "#0A0A0B",
          }}
        >
          {saving ? "Saving…" : "Save & Sync to Live Website →"}
        </button>
      </div>
    </div>
  );
}
