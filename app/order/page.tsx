"use client";

import { useState, useRef, useCallback, CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
 
import {
  ArrowLeft, ArrowRight, CheckCircle2, Upload, X, Lock,
  Sparkles, Gift, Zap, Image, Film, MapPin, User, Phone,
  AlertCircle, Loader2, Shield,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface FormState {
  // Step 1
  productType: string;
  productSize: string;
  // Step 2
  tier: string;
  // Step 3
  mediaFiles: File[];
  // Step 4
  occasion: string;
  wishText: string;
  // Step 5
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
};
const NFC_ADDON = 800;
function getPrice(product: string, tier: string) {
  const base = BASE_PRICES[product] ?? 0;
  return tier === "NFC VIP" ? base + NFC_ADDON : base;
}
function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

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

/* ─── Upload files via server-side API (uses admin client) ──── */
async function uploadMedia(files: File[]): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  const res = await fetch('/api/upload-media', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Upload failed');
  return data.urls as string[];
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
  const products = [
    { id: "T-Shirt",  emoji: "👕", price: 899,  desc: "Unisex 180 GSM cotton" },
    { id: "Beer Mug", emoji: "🍺", price: 799,  desc: "11oz ceramic mug" },
    { id: "Hoodie",   emoji: "🧥", price: 1299, desc: "350 GSM unisex fleece" },
    { id: "Cushion",  emoji: "🛋️", price: 699,  desc: "30×30 cm with insert" },
  ];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const needsSize = ["T-Shirt", "Hoodie"].includes(form.productType);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Choose Your Gift Canvas</h2>
        <p style={{ color: "#4A4A58" }} className="text-sm">Select the product you'd like your memory printed on.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {products.map(({ id, emoji, price, desc }) => (
          <button
            key={id}
            onClick={() => { set("productType", id); set("productSize", ""); }}
            style={card(form.productType === id)}
            className="p-4 text-left flex flex-col gap-2 hover:scale-[1.02] transition-transform"
          >
            <span className="text-3xl">{emoji}</span>
            <div>
              <p className="font-bold text-white text-sm">{id}</p>
              <p className="text-xs" style={{ color: "#4A4A58" }}>{desc}</p>
            </div>
            <p className="font-black text-sm" style={{ color: "#FFB800" }}>{formatINR(price)}</p>
            {form.productType === id && (
              <CheckCircle2 size={14} className="absolute top-3 right-3" style={{ color: "#FFB800" }} />
            )}
          </button>
        ))}
      </div>

      {/* Size selector */}
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
              <p className="text-3xl font-black" style={{ color: "#FFD700" }}>{formatINR(price)}</p>
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
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles = Array.from(incoming).filter((f) => {
      if (f.size > 50 * 1024 * 1024) { alert(`${f.name} is too large (max 100 MB)`); return false; }
      return true;
    });
    const combined = [...form.mediaFiles, ...newFiles].slice(0, 6);
    setFiles(combined);
  }, [form.mediaFiles, setFiles]);

  const remove = (i: number) => {
    const updated = form.mediaFiles.filter((_, idx) => idx !== i);
    setFiles(updated);
  };

  const isPhoto = (f: File) => f.type.startsWith("image/");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Upload Your Memories</h2>
        <p className="text-sm" style={{ color: "#4A4A58" }}>
          At least 1 photo required. Add up to 5 video clips. Max 100 MB per file.
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
            JPG, PNG, MP4, MOV — up to 6 files
          </p>
        </div>
      </button>

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
                <p className="text-xs" style={{ color: "#4A4A58" }}>{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button onClick={() => remove(i)} className="text-dark-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {form.mediaFiles.length === 0 && (
        <div className="flex items-center gap-2 text-xs p-3 rounded-xl" style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", color: "#FF9A3C" }}>
          <AlertCircle size={14} /> At least one photo is required to continue.
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

/* ─── Indian States list ────────────────────────────────── */
const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh",
  "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand",
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

/** Best-effort state guess from first 2 digits of pincode */
function guessStateFromPincode(pin: string): string {
  const n = parseInt(pin.slice(0, 2), 10);
  if (n === 11) return "Delhi";
  if (n >= 12 && n <= 13) return "Haryana";
  if (n >= 14 && n <= 16) return "Punjab";
  if (n === 17) return "Himachal Pradesh";
  if (n >= 18 && n <= 19) return "Jammu and Kashmir";
  if (n >= 20 && n <= 28) return "Uttar Pradesh";
  if (n >= 30 && n <= 34) return "Rajasthan";
  if (n >= 36 && n <= 39) return "Gujarat";
  if (n >= 40 && n <= 44) return "Maharashtra";
  if (n >= 45 && n <= 48) return "Madhya Pradesh";
  if (n === 49) return "Chhattisgarh";
  if (n >= 50 && n <= 53) return "Telangana";
  if (n >= 56 && n <= 59) return "Karnataka";
  if (n >= 60 && n <= 64) return "Tamil Nadu";
  if (n >= 67 && n <= 69) return "Kerala";
  if (n >= 70 && n <= 74) return "West Bengal";
  if (n >= 75 && n <= 77) return "Odisha";
  if (n === 78) return "Assam";
  if (n >= 80 && n <= 85) return "Bihar";
  return "";
}

/* ─── Shipping field validators ─────────────────────────── */
const SHIP_VALIDATORS: Record<string, (v: string) => string> = {
  customerName: (v) => {
    if (!v.trim() || !/^[A-Za-z\s]{3,}$/.test(v.trim()))
      return "Enter your full name (letters only)";
    return "";
  },
  customerPhone: (v) => {
    // Normalize: strip optional +91 prefix, spaces, and dashes so users
    // can type "+91 98765 43210" or "9876543210" — both accepted
    const normalized = v.replace(/^\+?91[\s\-]?/, "").replace(/[\s\-]/g, "");
    if (!/^[6-9][0-9]{9}$/.test(normalized))
      return "Enter a valid 10-digit Indian mobile number";
    return "";
  },
  addressLine1: (v) => {
    const t = v.trim();
    if (t.length < 10) return "Please enter a complete address";
    // Reject all-same character or very short numeric-only strings
    if (/^(.)\1+$/.test(t)) return "Please enter a complete address";
    if (/^[0-9]{1,5}$/.test(t)) return "Please enter a complete address";
    return "";
  },
  city: (v) => {
    if (!/^[A-Za-z\s]{2,}$/.test(v.trim())) return "Enter a valid city name";
    return "";
  },
  state: (v) => {
    if (!v) return "Please select your state";
    return "";
  },
  pincode: (v) => {
    if (!/^[1-9][0-9]{5}$/.test(v.trim()))
      return "Enter a valid 6-digit Indian pincode";
    return "";
  },
};

export type ShippingErrors = Partial<Record<keyof FormState, string>>;

/** Validate all shipping fields and return a map of errors */
export function validateShippingFields(form: FormState): ShippingErrors {
  const keys = ["customerName", "customerPhone", "addressLine1", "city", "state", "pincode"] as const;
  const errors: ShippingErrors = {};
  for (const key of keys) {
    const msg = SHIP_VALIDATORS[key]?.(form[key] as string) ?? "";
    if (msg) errors[key] = msg;
  }
  return errors;
}

/* ─── Stable ShippingField component (defined at module level) ──
   IMPORTANT: must NOT be defined inside Step5Shipping — doing so
   creates a new component type on every render, causing React to
   unmount/remount the input on every keystroke (focus loss bug).   */
interface ShippingFieldProps {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  icon: React.ElementType;
  error?: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}

function ShippingField({
  label, value, placeholder, type = "text", inputMode, maxLength,
  icon: Icon, error, onChange, onBlur,
}: ShippingFieldProps) {
  const [focused, setFocused] = useState(false);
  const border = error
    ? "1px solid rgba(239,68,68,0.8)"
    : focused
    ? "1px solid rgba(255,184,0,0.4)"
    : "1px solid rgba(255,184,0,0.15)";

  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <Icon size={15} style={{ color: error ? "#f87171" : "#4A4A58" }} />
        </div>
        <input
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur(); }}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
          style={{ background: "rgba(17,17,22,0.8)", border }}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs flex items-center gap-1" style={{ color: "#f87171" }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

/* ─── Step 5: Shipping ──────────────────────────────────── */
function Step5Shipping({
  form,
  set,
  fieldErrors,
  setFieldErrors,
}: {
  form: FormState;
  set: (k: keyof FormState, v: string) => void;
  fieldErrors: ShippingErrors;
  setFieldErrors: (e: ShippingErrors) => void;
}) {
  /** Validate a single field on blur without touching sibling fields */
  const blurValidate = (field: keyof FormState) => {
    const msg = SHIP_VALIDATORS[field as string]?.(form[field] as string) ?? "";
    setFieldErrors({ ...fieldErrors, [field]: msg });
  };

  /** Pincode: digits only, max 6; auto-prefill state when valid */
  const handlePincodeChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 6);
    set("pincode", digits);
    if (/^[1-9][0-9]{5}$/.test(digits) && !form.state) {
      const guessed = guessStateFromPincode(digits);
      if (guessed) set("state", guessed);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-white mb-1">Where Should We Ship?</h2>
        <p className="text-sm" style={{ color: "#4A4A58" }}>We ship across India. Typically 2–3 days after production.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ShippingField
          label="Full Name" placeholder="Priya Sharma"
          icon={User} value={form.customerName} error={fieldErrors.customerName}
          onChange={(v) => set("customerName", v)}
          onBlur={() => blurValidate("customerName")}
        />
        <ShippingField
          label="Mobile Number" placeholder="9876543210"
          type="tel" inputMode="numeric"
          icon={Phone} value={form.customerPhone} error={fieldErrors.customerPhone}
          onChange={(v) => set("customerPhone", v)}
          onBlur={() => blurValidate("customerPhone")}
        />
      </div>

      <ShippingField
        label="Address Line 1" placeholder="Flat no, Street, Locality, Area"
        icon={MapPin} value={form.addressLine1} error={fieldErrors.addressLine1}
        onChange={(v) => set("addressLine1", v)}
        onBlur={() => blurValidate("addressLine1")}
      />

      <div className="grid grid-cols-2 gap-3">
        <ShippingField
          label="City" placeholder="Mumbai"
          icon={MapPin} value={form.city} error={fieldErrors.city}
          onChange={(v) => set("city", v)}
          onBlur={() => blurValidate("city")}
        />

        {/* Pincode uses a custom onChange to strip non-digits */}
        <ShippingField
          label="Pincode" placeholder="400001"
          inputMode="numeric" maxLength={6}
          icon={MapPin} value={form.pincode} error={fieldErrors.pincode}
          onChange={handlePincodeChange}
          onBlur={() => blurValidate("pincode")}
        />
      </div>

      {/* State — dropdown (not free-text) */}
      <div>
        <label className="block text-sm font-semibold text-white mb-1.5">State</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
            <MapPin size={15} style={{ color: fieldErrors.state ? "#f87171" : "#4A4A58" }} />
          </div>
          <select
            value={form.state}
            onChange={(e) => {
              set("state", e.target.value);
              // Clear error immediately on valid selection
              if (fieldErrors.state)
                setFieldErrors({ ...fieldErrors, state: "" });
            }}
            onBlur={() => blurValidate("state")}
            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all appearance-none"
            style={{
              background: "rgba(17,17,22,0.8)",
              border: fieldErrors.state
                ? "1px solid rgba(239,68,68,0.8)"
                : "1px solid rgba(255,184,0,0.15)",
              color: form.state ? "#ffffff" : "#4A4A58",
            }}
          >
            <option value="" disabled style={{ color: "#4A4A58", background: "#111116" }}>
              Select state…
            </option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s} style={{ background: "#111116", color: "#fff" }}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {fieldErrors.state && (
          <p className="mt-1 text-xs flex items-center gap-1" style={{ color: "#f87171" }}>
            <AlertCircle size={11} /> {fieldErrors.state}
          </p>
        )}
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
  const productEmojis: Record<string, string> = { "T-Shirt": "👕", "Beer Mug": "🍺", Hoodie: "🧥", Cushion: "🛋️" };

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

      {/* Summary card */}
      <div className="rounded-2xl p-5 space-y-1"
        style={{ background: "linear-gradient(145deg, #1A1A24, #111116)", border: "1px solid rgba(255,184,0,0.12)" }}>
        <Row label="Product" value={`${productEmojis[form.productType] ?? ""} ${form.productType}${form.productSize ? ` (${form.productSize})` : ""}`} />
        <Row label="Tier" value={form.tier} />
        {form.occasion && <Row label="Occasion" value={form.occasion} />}
        <Row label="Media files" value={`${form.mediaFiles.length} file${form.mediaFiles.length !== 1 ? "s" : ""}`} />
        <Row label="Shipping to" value={`${form.customerName}, ${form.city}, ${form.pincode}`} />
        <Row label="Phone" value={form.customerPhone} />

        {/* Total */}
        <div className="flex justify-between items-center pt-3 mt-1">
          <span className="font-semibold text-white">Total</span>
          <span className="text-2xl font-black" style={{ color: "#FFD700" }}>{formatINR(price)}</span>
        </div>
      </div>

      {/* Trust row */}
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

      {/* Dev bypass notice */}
      {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID === "rzp_test_PLACEHOLDER" && (
        <div className="flex items-start gap-2 text-xs p-3 rounded-xl"
          style={{ background: "rgba(255,184,0,0.06)", border: "1px solid rgba(255,184,0,0.2)", color: "#FFB800" }}>
          <Sparkles size={13} className="mt-0.5 shrink-0" />
          <span><strong>Dev mode:</strong> Razorpay keys not yet configured. Order will be created & marked paid for testing.</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs p-3 rounded-xl"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={onPay}
        disabled={!!loading}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #FFD700 0%, #FFB800 50%, #FF9A3C 100%)", color: "#0A0A0B" }}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {loading}
          </>
        ) : (
          <>
            <Lock size={16} />
            Confirm & Pay {formatINR(price)}
          </>
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
      {/* Label */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold" style={{ color: "#FFB800" }}>
          Step {step} of {STEP_LABELS.length}
        </span>
        <span className="text-xs font-semibold text-white">{STEP_LABELS[step - 1]}</span>
      </div>
      {/* Bar */}
      <div className="h-1.5 rounded-full" style={{ background: "rgba(255,184,0,0.1)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${((step - 1) / (STEP_LABELS.length - 1)) * 100}%`,
            background: "linear-gradient(90deg, #FFD700, #FF9A3C)",
          }}
        />
      </div>
      {/* Dots */}
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
  const [step, setStep] = useState(1);
  const [form, setFormState] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Field-level errors for the shipping step */
  const [fieldErrors, setFieldErrors] = useState<ShippingErrors>({});

  const set = (key: keyof FormState, value: string) =>
    setFormState((prev) => ({ ...prev, [key]: value }));

  const setFiles = (files: File[]) =>
    setFormState((prev) => ({ ...prev, mediaFiles: files }));

  /* ── Validation per step ───────────────────────────── */
  const validate = (): string | null => {
    switch (step) {
      case 1:
        if (!form.productType) return "Please select a product.";
        if (["T-Shirt", "Hoodie"].includes(form.productType) && !form.productSize)
          return "Please select a size.";
        return null;
      case 2:
        return form.tier ? null : "Please select a tier.";
      case 3:
        return form.mediaFiles.length === 0 ? "Please upload at least one photo." : null;
      case 4:
        return null; // optional
      case 5: {
        /* Run full field-level validation and surface errors inline */
        const errors = validateShippingFields(form);
        setFieldErrors(errors);
        const hasErrors = Object.values(errors).some(Boolean);
        return hasErrors ? "Please fix the errors highlighted above." : null;
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

  /* ── Payment handler ───────────────────────────────── */
  const handlePay = async () => {
    setError(null);
    try {
      /* 1. Upload media files */
      setLoading("Uploading your memories…");
      let mediaUrls: string[] = [];
      if (form.mediaFiles.length > 0) {
        mediaUrls = await uploadMedia(form.mediaFiles);
      }

      /* 2. Call checkout API */
      setLoading("Creating your order…");
      const shippingAddress = `${form.addressLine1}, ${form.city}, ${form.state} - ${form.pincode}`;
      const occasionNote = [form.occasion, form.wishText].filter(Boolean).join(" | ");

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          shippingAddress,
          productType: form.productType,
          productSize: form.productSize || null,
          tier: form.tier,
          occasion: occasionNote || null,
          mediaUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      /* 3a. Dev bypass — skip Razorpay */
      if (data.bypass) {
        setLoading(null);
        router.push(
          `/order/success?slug=${data.secureSlug}&product=${encodeURIComponent(form.productType)}&tier=${encodeURIComponent(form.tier)}&name=${encodeURIComponent(form.customerName)}`
        );
        return;
      }

      /* 3b. Load Razorpay & open modal */
      setLoading("Opening payment…");
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Could not load payment gateway. Please try again.");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "GiftUnlock.in",
        description: `${form.productType} — ${form.tier}`,
        order_id: data.orderId,
        prefill: {
          name: form.customerName,
          contact: form.customerPhone,
        },
        theme: { color: "#FFB800" },
        modal: {
          ondismiss: () => setLoading(null),
        },
        handler: () => {
          setLoading(null);
          router.push(
            `/order/success?slug=${data.secureSlug}&product=${encodeURIComponent(form.productType)}&tier=${encodeURIComponent(form.tier)}&name=${encodeURIComponent(form.customerName)}`
          );
        },
      };

      setLoading(null);
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setLoading(null);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1Product form={form} set={set} />;
      case 2: return <Step2Tier form={form} set={set} />;
      case 3: return <Step3Media form={form} setFiles={setFiles} />;
      case 4: return <Step4Occasion form={form} set={set} />;
      case 5: return <Step5Shipping form={form} set={set} fieldErrors={fieldErrors} setFieldErrors={setFieldErrors} />;
      case 6: return <Step6Review form={form} onPay={handlePay} loading={loading} error={error} />;
    }
  };

  return (
    <main className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
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
            Gift<span style={{
              background: "linear-gradient(135deg, #FFD700, #FF9A3C)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Unlock</span>
          </span>
        </div>
        <div className="text-xs font-semibold" style={{ color: "#4A4A58" }}>
          {step}/{STEP_LABELS.length}
        </div>
      </div>

      {/* Form container */}
      <div className="max-w-lg mx-auto px-4 py-8">
        <ProgressBar step={step} />

        {/* Step content */}
        <div
          key={step}
          style={{ animation: "fadeInUp 0.35s ease both" }}
        >
          {renderStep()}
        </div>

        {/* Validation error (steps 1–5) */}
        {error && step < 6 && (
          <div className="mt-4 flex items-center gap-2 text-xs p-3 rounded-xl"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <AlertCircle size={13} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Navigation button (steps 1–5) */}
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
