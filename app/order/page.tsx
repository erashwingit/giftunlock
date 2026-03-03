"use client";

import { useState, useRef, useCallback, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Upload, X, Lock,
  Sparkles, Gift, Zap, Image, Film, MapPin, User, Phone,
  AlertCircle, Loader2, Shield,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface FormState {
  productType: string;
  productSize: string;
  tier: string;
  mediaFiles: File[];
  occasion: string;
  wishText: string;
  customerName: string;
  customerPhone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}

const INITIAL: FormState = {
  productType: "", productSize: "",
  tier: "",
  mediaFiles: [],
  occasion: "", wishText: "",
  customerName: "", customerPhone: "",
  addressLine1: "", city: "", state: "", pincode: "",
};

/* ─── Pricing ───────────────────────────────────────────── */
const BASE_PRICES: Record<string, number> = {
  "T-Shirt": 899, "Beer Mug": 799, Hoodie: 1299, Cushion: 699,
  "Coffee Mug": 699, "Water Bottle": 899, "Face Mask": 499,
};
const NFC_ADDON = 800;
function getPrice(product: string, tier: string) {
  const base = BASE_PRICES[product] ?? 0;
  return tier === "NFC VIP" ? base + NFC_ADDON : base;
}

/* ─── Module-scope constants ──────────────────────────────── */
// Products that require a size selection
const PRODUCTS_WITH_SIZE: readonly string[] = ["T-Shirt", "Hoodie"];

// Single source of truth for product emojis (shared by Step1 + Step6)
const PRODUCT_EMOJIS: Record<string, string> = {
  "T-Shirt": "👕", "Beer Mug": "🍺", Hoodie: "🧥", Cushion: "🛋️",
  "Coffee Mug": "☕", "Water Bottle": "💧", "Face Mask": "😷",
};

// Upload limits
const MAX_FILE_MB = 50;
const MAX_IMAGES  = 1;
const MAX_VIDEOS  = 3;

/* ─── File-type helpers (module scope — reused in Step3 + validate) ─ */
const isPhoto = (f: File) => f.type.startsWith("image/");
const isVideo = (f: File) => f.type.startsWith("video/");

/* ─── Load Razorpay script ──────────────────────────────── */
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

declare global { interface Window { Razorpay: new (o: object) => { open(): void }; } }

/* ─── Upload files via server-side API ──────────────────── */
async function uploadMedia(files: File[]): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error ?? "Upload failed");
  }
  const { urls } = await res.json();
  return urls as string[];
}

/* ─── Shared card style ─────────────────────────────────── */
const card = (selected = false): CSSProperties => ({
  background: selected ? "linear-gradient(145deg, #1e1a0a, #1A1A24)" : "linear-gradient(145deg, #1A1A24, #111116)",
  border: selected ? "1.5px solid #FFB800" : "1px solid rgba(255,184,0,0.12)",
  borderRadius: 16,
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: selected ? "0 0 20px rgba(255,184,0,0.15)" : "none",
});

/* ═══════════════════════════════════════════════════════════
   STEP COMPONENTS
═══════════════════════════════════════════════════════════ */

/* ─── Step 1: Product ───────────────────────────────────── */
function Step1Product({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  // desc only — emoji + price derived from module-scope maps to avoid duplication
  const products: { id: string; desc: string }[] = [
    { id: "T-Shirt",      desc: "Unisex 180 GSM cotton" },
    { id: "Beer Mug",     desc: "11oz ceramic mug" },
    { id: "Hoodie",       desc: "350 GSM unisex fleece" },
    { id: "Cushion",      desc: "30×30 cm with insert" },
    { id: "Coffee Mug",   desc: "11oz ceramic mug" },
    { id: "Water Bottle", desc: "750ml stainless steel" },
    { id: "Face Mask",    desc: "Pack of 5 printed masks" },
  ];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const needsSize = PRODUCTS_WITH_SIZE.includes(form.productType);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Choose Your Gift Canvas</h2>
        <p style={{ color: "#4A4A58" }} className="text-sm">Select the product you'd like your memory printed on.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {products.map(({ id, desc }) => (
          <button
            key={id}
            onClick={() => { set("productType", id); set("productSize", ""); }}
            style={card(form.productType === id)}
            className="p-4 text-left flex flex-col gap-2 hover:scale-[1.02] transition-transform"
          >
            <span className="text-3xl">{PRODUCT_EMOJIS[id]}</span>
            <div>
              <p className="font-bold text-white text-sm">{id}</p>
              <p className="text-xs" style={{ color: "#4A4A58" }}>{desc}</p>
            </div>
            <p className="font-black text-sm" style={{ color: "#FFB800" }}>{formatPrice(BASE_PRICES[id] ?? 0)}</p>
            {form.productType === id && (
              <CheckCircle2 size={14} className="absolute top-3 right-3" style={{ color: "#FFB800" }} />
            )}
          </button>
        ))}
      </div>

      {needsSize && (
        <div className="space-y-2 pt-2">
          <p className="text-sm font-semibold text-white">Select Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => set("productSize", s)}
                className="w-12 h-12 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{
                  background: form.productSize === s ? "#FFB800" : "rgba(255,184,0,0.07)",
                  border: form.productSize === s ? "none" : "1px solid rgba(255,184,0,0.15)",
                  color: form.productSize === s ? "#0A0A0B" : "#4A4A58",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step 2: Tier ──────────────────────────────────────── */
function Step2Tier({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  const base = BASE_PRICES[form.productType] ?? 899;
  const tiers = [
    {
      id: "QR Classic", price: base, badge: null,
      tagline: "The perfect first gift",
      features: ["Artistic festive QR code PNG", "Cinematic memory video", "YouTube Unlisted link", "Standard shipping"],
    },
    {
      id: "NFC VIP", price: base + NFC_ADDON, badge: "Most Premium",
      tagline: "No scan — just tap",
      features: ["Everything in QR Classic", "Embedded NFC chip", "Premium gift box packaging", "Express + priority 24hr"],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">How Should They Unlock It?</h2>
        <p className="text-sm" style={{ color: "#4A4A58" }}>Choose how your gift recipient reveals the memory.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {tiers.map(({ id, price, badge, tagline, features }) => {
          const selected = form.tier === id;
          return (
            <button
              key={id}
              onClick={() => set("tier", id)}
              style={{ ...card(selected), position: "relative" }}
              className="p-6 text-left flex flex-col gap-4 hover:scale-[1.01] transition-transform"
            >
              {badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 rounded-full"
                  style={{ background: "linear-gradient(90deg,#FFD700,#FF9A3C)", color: "#0A0A0B" }}>
                  {badge}
                </span>
              )}
              <div>
                <p className="font-black text-white text-lg">{id}</p>
                <p className="text-xs mt-0.5" style={{ color: "#4A4A58" }}>{tagline}</p>
              </div>
              <p className="text-3xl font-black" style={{ color: "#FFD700" }}>{formatPrice(price)}</p>
              <ul className="space-y-1.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: selected ? "#FFB800" : "#333340" }} />
                    <span style={{ color: selected ? "#E8E8E8" : "#4A4A58" }}>{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 3: Media Upload ──────────────────────────────── */
function Step3Media({ form, setFiles }: { form: FormState; setFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging,     setDragging]     = useState(false);
  const [rejectionMsg, setRejectionMsg] = useState("");

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    setRejectionMsg("");

    const existing  = form.mediaFiles;
    let imgCount    = existing.filter(isPhoto).length;
    let vidCount    = existing.filter(isVideo).length;
    const toAdd: File[]    = [];
    const rejected: string[] = [];

    for (const f of Array.from(incoming)) {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        rejected.push(`“${f.name}” exceeds ${MAX_FILE_MB} MB`);
        continue;
      }
      if (isPhoto(f)) {
        if (imgCount >= MAX_IMAGES) { rejected.push(`“${f.name}” — only ${MAX_IMAGES} photo allowed`); continue; }
        imgCount++;
      } else if (isVideo(f)) {
        if (vidCount >= MAX_VIDEOS) { rejected.push(`“${f.name}” — only ${MAX_VIDEOS} clips allowed`); continue; }
        vidCount++;
      } else {
        rejected.push(`“${f.name}” — unsupported format`);
        continue;
      }
      toAdd.push(f);
    }

    if (rejected.length > 0) setRejectionMsg(rejected.join(" · "));
    if (toAdd.length  > 0) setFiles([...existing, ...toAdd]);
  }, [form.mediaFiles, setFiles]);

  const remove = (i: number) => setFiles(form.mediaFiles.filter((_, idx) => idx !== i));

  // Derived counters — negligible cost on a max-4-item array
  const photoCount = form.mediaFiles.filter(isPhoto).length;
  const videoCount = form.mediaFiles.filter(isVideo).length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Upload Your Memories</h2>
        <p className="text-sm" style={{ color: "#4A4A58" }}>
          1 selfie photo required (max {MAX_FILE_MB} MB) + up to {MAX_VIDEOS} video clips (max {MAX_FILE_MB} MB each)
        </p>
      </div>

      {/* Drop zone */}
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className="w-full rounded-2xl p-8 flex flex-col items-center gap-3 transition-all"
        style={{
          border: `2px dashed ${dragging ? "#FFB800" : "rgba(255,184,0,0.25)"}`,
          background: dragging ? "rgba(255,184,0,0.04)" : "rgba(17,17,22,0.5)",
        }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,184,0,0.1)" }}>
          <Upload size={22} style={{ color: "#FFB800" }} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-white text-sm">Click to upload or drag & drop</p>
          <p className="text-xs mt-0.5" style={{ color: "#4A4A58" }}>
            JPG, PNG, MP4, MOV
          </p>
        </div>
      </button>

      {/* Tip + counters row */}
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "#FFB800" }}>Short vertical clips (10–25 sec) work best 📱</span>
        <span className="flex gap-3" style={{ color: "#4A4A58" }}>
          <span style={{ color: photoCount >= MAX_IMAGES ? "#22c55e" : "#FFB800" }}>Photos: {photoCount}/{MAX_IMAGES}</span>
          <span style={{ color: videoCount >= MAX_VIDEOS ? "#22c55e" : "#FFB800" }}>Videos: {videoCount}/{MAX_VIDEOS}</span>
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      {/* File list */}
      {form.mediaFiles.length > 0 && (
        <div className="space-y-2">
          {form.mediaFiles.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(255,184,0,0.04)", border: "1px solid rgba(255,184,0,0.1)" }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,184,0,0.1)" }}>
                {isPhoto(file) ? <Image size={15} style={{ color: "#FFB800" }} /> : <Film size={15} style={{ color: "#FF9A3C" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs" style={{ color: "#4A4A58" }}>{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button onClick={() => remove(i)} className="text-dark-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rejection message */}
      {rejectionMsg && (
        <div className="flex items-start gap-2 text-xs p-3 rounded-xl"
          style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", color: "#FF9A3C" }}>
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{rejectionMsg}</span>
        </div>
      )}

      {/* Minimum-photo reminder */}
      {photoCount === 0 && (
        <div className="flex items-center gap-2 text-xs p-3 rounded-xl"
          style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", color: "#FF9A3C" }}>
          <AlertCircle size={14} /> At least one selfie photo is required to continue.
        </div>
      )}
    </div>
  );
}

/* ─── Step 4: Occasion ──────────────────────────────────── */
function Step4Occasion({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  const occasions = ["Birthday 🎂", "Wedding 💍", "Holi 🌸", "Anniversary ❤️", "Proposal 💑", "Graduation 🎓", "Farewell 👋", "Other ✨"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">What's the Occasion?</h2>
        <p className="text-sm" style={{ color: "#4A4A58" }}>Tell us about the moment. This helps us craft the perfect memory.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">Occasion</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {occasions.map((o) => {
            const val = o.split(" ")[0];
            const selected = form.occasion === val;
            return (
              <button
                key={o}
                onClick={() => set("occasion", val)}
                className="py-2.5 px-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: selected ? "#FFB800" : "rgba(255,184,0,0.07)",
                  color: selected ? "#0A0A0B" : "#4A4A58",
                  border: selected ? "none" : "1px solid rgba(255,184,0,0.12)",
                }}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          Personal wish / message{" "}
          <span className="font-normal" style={{ color: "#4A4A58" }}>(optional)</span>
        </label>
        <textarea
          value={form.wishText}
          onChange={(e) => set("wishText", e.target.value)}
          maxLength={200}
          rows={4}
          placeholder="e.g. Happy 60th Dad! Every laugh, every hug — this video is all of us, frozen in time. We love you."
          className="w-full rounded-xl p-4 text-sm text-white resize-none outline-none transition-all"
          style={{
            background: "rgba(17,17,22,0.8)",
            border: "1px solid rgba(255,184,0,0.15)",
            color: "#F0F0F5",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(255,184,0,0.4)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,184,0,0.15)")}
        />
        <p className="text-xs mt-1 text-right" style={{ color: "#4A4A58" }}>
          {form.wishText.length}/200
        </p>
      </div>
    </div>
  );
}

/* ─── Field — module-scope to prevent remount on every render ─
   (Defined here once, shared by Step5Shipping) */
function Field({
  label, field, placeholder, type = "text", icon: Icon, form, set,
}: {
  label: string;
  field: keyof FormState;
  placeholder: string;
  type?: string;
  icon: React.ElementType;
  form: FormState;
  set: (k: keyof FormState, v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Icon size={15} style={{ color: "#4A4A58" }} />
        </div>
        <input
          type={type}
          value={form[field] as string}
          onChange={(e) => set(field, e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
          style={{ background: "rgba(17,17,22,0.8)", border: "1px solid rgba(255,184,0,0.15)" }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(255,184,0,0.4)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,184,0,0.15)")}
        />
      </div>
    </div>
  );
}

/* ─── Step 5: Shipping ──────────────────────────────────── */
function Step5Shipping({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Where Should We Ship?</h2>
        <p className="text-sm" style={{ color: "#4A4A58" }}>We ship across India. Typically 2–3 days after production.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full Name"     field="customerName"  placeholder="Priya Sharma"       icon={User}  form={form} set={set} />
        <Field label="Mobile Number" field="customerPhone" placeholder="+91 98765 43210"    type="tel" icon={Phone} form={form} set={set} />
      </div>
      <Field label="Address Line 1" field="addressLine1" placeholder="Flat no, Street, Locality" icon={MapPin} form={form} set={set} />
      <div className="grid grid-cols-3 gap-3">
        <Field label="City"    field="city"    placeholder="Mumbai"      icon={MapPin} form={form} set={set} />
        <Field label="State"   field="state"   placeholder="Maharashtra" icon={MapPin} form={form} set={set} />
        <Field label="Pincode" field="pincode" placeholder="400001" type="number" icon={MapPin} form={form} set={set} />
      </div>
    </div>
  );
}

/* ─── Step 6: Review & Pay ──────────────────────────────── */
function Step6Review({
  form, onPay, loading, error,
}: {
  form: FormState;
  onPay: () => void;
  loading: string | null;
  error: string | null;
}) {
  const price = getPrice(form.productType, form.tier);

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-start gap-4 text-sm py-2.5 border-b" style={{ borderColor: "rgba(255,184,0,0.06)" }}>
      <span style={{ color: "#4A4A58" }}>{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Review Your Order</h2>
        <p className="text-sm" style={{ color: "#4A4A58" }}>Everything looks good? Let's make this memory permanent.</p>
      </div>

      <div className="rounded-2xl p-5 space-y-1"
        style={{ background: "linear-gradient(145deg, #1A1A24, #111116)", border: "1px solid rgba(255,184,0,0.12)" }}>
        <Row label="Product" value={`${PRODUCT_EMOJIS[form.productType] ?? ""} ${form.productType}${form.productSize ? ` (${form.productSize})` : ""}`} />
        <Row label="Tier"    value={form.tier} />
        {form.occasion && <Row label="Occasion" value={form.occasion} />}
        <Row label="Media files"  value={`${form.mediaFiles.length} file${form.mediaFiles.length !== 1 ? "s" : ""}`} />
        <Row label="Shipping to"  value={`${form.customerName}, ${form.city}, ${form.pincode}`} />
        <Row label="Phone"        value={form.customerPhone} />
        <div className="flex justify-between items-center pt-3 mt-1">
          <span className="font-semibold text-white">Total</span>
          <span className="text-2xl font-black" style={{ color: "#FFD700" }}>{formatPrice(price)}</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-xs" style={{ color: "#333340" }}>
        {(
          [
            { Icon: Shield, label: "Secure payment" },
            { Icon: Zap,    label: "48hr production" },
            { Icon: Gift,   label: "Ships across India" },
          ] as { Icon: React.ElementType; label: string }[]
        ).map(({ Icon, label }) => (
          <div key={label} className="flex items-center gap-1">
            <Icon size={11} style={{ color: "#B37D00" }} />
            {label}
          </div>
        ))}
      </div>

      {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === "rzp_test_PLACEHOLDER" && (
        <div className="flex items-start gap-2 text-xs p-3 rounded-xl"
          style={{ background: "rgba(255,184,0,0.06)", border: "1px solid rgba(255,184,0,0.2)", color: "#FFB800" }}>
          <Sparkles size={13} className="mt-0.5 shrink-0" />
          <span><strong>Dev mode:</strong> Razorpay keys not yet configured. Order will be created & marked paid for testing.</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs p-3 rounded-xl"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={onPay}
        disabled={!!loading}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #FFD700 0%, #FFB800 50%, #FF9A3C 100%)", color: "#0A0A0B" }}
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" />{loading}</>
        ) : (
          <><Lock size={16} />Confirm & Pay {formatPrice(price)}</>
        )}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROGRESS BAR
═══════════════════════════════════════════════════════════ */
const STEP_LABELS = ["Product", "Tier", "Media", "Occasion", "Shipping", "Review"];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold" style={{ color: "#FFB800" }}>Step {step} of {STEP_LABELS.length}</span>
        <span className="text-xs font-semibold text-white">{STEP_LABELS[step - 1]}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,184,0,0.1)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${((step - 1) / (STEP_LABELS.length - 1)) * 100}%`,
            background: "linear-gradient(90deg, #FFD700, #FF9A3C)",
          }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {STEP_LABELS.map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              background: i < step ? "#FFB800" : "rgba(255,184,0,0.15)",
              transform: i === step - 1 ? "scale(1.5)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function OrderPage() {
  const router = useRouter();
  const [step, setStep]           = useState(1);
  const [form, setFormState]       = useState<FormState>(INITIAL);
  const [loading, setLoading]      = useState<string | null>(null);
  const [error,   setError]        = useState<string | null>(null);

  const set      = (key: keyof FormState, value: string) =>
    setFormState((prev) => ({ ...prev, [key]: value }));
  const setFiles = (files: File[]) =>
    setFormState((prev) => ({ ...prev, mediaFiles: files }));

  const validate = (): string | null => {
    switch (step) {
      case 1:
        if (!form.productType) return "Please select a product.";
        if (PRODUCTS_WITH_SIZE.includes(form.productType) && !form.productSize)
          return "Please select a size.";
        return null;
      case 2:
        return form.tier ? null : "Please select a tier.";
      case 3: {
        const hasPhoto = form.mediaFiles.some(isPhoto);
        return !hasPhoto ? "Please upload at least one selfie photo." : null;
      }
      case 4:
        return null;
      case 5: {
        const required = [form.customerName, form.customerPhone, form.addressLine1, form.city, form.state, form.pincode];
        return required.some((v) => !v.trim()) ? "Please fill all shipping fields." : null;
      }
      default:
        return null;
    }
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  };

  const back = () => { setError(null); setStep((s) => s - 1); };

  const handlePay = async () => {
    setError(null);
    try {
      setLoading("Uploading your memories…");
      let mediaUrls: string[] = [];
      if (form.mediaFiles.length > 0) mediaUrls = await uploadMedia(form.mediaFiles);

      setLoading("Creating your order…");
      const shippingAddress = `${form.addressLine1}, ${form.city}, ${form.state} - ${form.pincode}`;
      const occasionNote    = [form.occasion, form.wishText].filter(Boolean).join(" | ");

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName, customerPhone: form.customerPhone,
          shippingAddress, productType: form.productType,
          productSize: form.productSize || null, tier: form.tier,
          occasion: occasionNote || null, mediaUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      if (data.bypass) {
        setLoading(null);
        router.push(`/order/success?slug=${data.secureSlug}&product=${encodeURIComponent(form.productType)}&tier=${encodeURIComponent(form.tier)}&name=${encodeURIComponent(form.customerName)}`);
        return;
      }

      setLoading("Opening payment…");
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Could not load payment gateway. Please try again.");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount, currency: data.currency,
        name: "GiftUnlock.in",
        description: `${form.productType} — ${form.tier}`,
        order_id: data.orderId,
        prefill: { name: form.customerName, contact: form.customerPhone },
        theme: { color: "#FFB800" },
        modal: { ondismiss: () => setLoading(null) },
        handler: () => {
          setLoading(null);
          router.push(`/order/success?slug=${data.secureSlug}&product=${encodeURIComponent(form.productType)}&tier=${encodeURIComponent(form.tier)}&name=${encodeURIComponent(form.customerName)}`);
        },
      };

      setLoading(null);
      new window.Razorpay(options).open();
    } catch (err) {
      setLoading(null);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1Product form={form} set={set} />;
      case 2: return <Step2Tier    form={form} set={set} />;
      case 3: return <Step3Media   form={form} setFiles={setFiles} />;
      case 4: return <Step4Occasion form={form} set={set} />;
      case 5: return <Step5Shipping form={form} set={set} />;
      case 6: return <Step6Review  form={form} onPay={handlePay} loading={loading} error={error} />;
    }
  };

  return (
    <main className="min-h-screen bg-dark-900 text-white">
      <div
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: "rgba(10,10,11,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,184,0,0.08)" }}
      >
        {step > 1 ? (
          <button onClick={back} className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: "#4A4A58" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#4A4A58")}>
            <ArrowLeft size={15} /> Back
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-1.5 text-sm" style={{ color: "#4A4A58" }}>
            <ArrowLeft size={15} /> Home
          </Link>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#FFB800" }}>
            <Lock size={11} style={{ color: "#0A0A0B" }} />
          </div>
          <span className="font-bold text-sm">
            Gift<span style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Unlock</span>
          </span>
        </div>
        <div className="text-xs font-semibold" style={{ color: "#4A4A58" }}>{step}/{STEP_LABELS.length}</div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <ProgressBar step={step} />
        <div key={step} style={{ animation: "fadeInUp 0.35s ease both" }}>
          {renderStep()}
        </div>
        {error && step < 6 && (
          <div className="mt-4 flex items-center gap-2 text-xs p-3 rounded-xl"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <AlertCircle size={13} className="shrink-0" />
            {error}
          </div>
        )}
        {step < 6 && (
          <button
            onClick={next}
            className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.01]"
            style={{ background: "linear-gradient(135deg, #FFD700, #FF9A3C)", color: "#0A0A0B" }}
          >
            Continue <ArrowRight size={16} />
          </button>
        )}
      </div>
    </main>
  );
}
