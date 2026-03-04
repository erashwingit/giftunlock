"use client";

/**
 * app/components/MediaUpload.tsx
 *
 * Self-contained media upload component for GiftUnlock orders.
 *
 * Slots:
 *   • selfie  — 1 photo (JPEG / PNG / WEBP, max 50 MB)
 *   • clip1-3 — up to 3 video clips (MP4 / MOV, max 50 MB each, hint: 10-25 s)
 *
 * Each file is:
 *   1. Validated client-side (MIME extension + size) for fast feedback
 *   2. Uploaded immediately via POST /api/upload (server does magic-bytes check + EXIF strip)
 *   3. Shown as a thumbnail (image preview) or clip card with Replace + Remove buttons
 *
 * The parent receives live updates via onChange(data: MediaUploadData).
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type RefObject,
} from "react";
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import {
  clientMimeCheck,
  isSelfieSlot,
  generateSecureSlug,
  type FileSlot,
} from "@/lib/storage-config";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface SlotState {
  status: "idle" | "uploading" | "done" | "error";
  signedUrl?: string;
  storagePath?: string;
  /** Local object URL shown before the server responds */
  previewUrl?: string;
  filename?: string;
  fileSize?: number;
  error?: string;
}

/** Data exposed to the parent via onChange */
export interface MediaUploadData {
  secureSlug: string;
  selfieUrl: string | null;
  /** Array of 3 elements — null means no clip for that slot */
  clipUrls: [string | null, string | null, string | null];
}

interface Props {
  /** Pre-generated secureSlug. If omitted, the component generates one. */
  secureSlug?: string;
  onChange: (data: MediaUploadData) => void;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const MAX_MB    = 50;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const CLIP_SLOTS: FileSlot[] = ["clip1", "clip2", "clip3"];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function formatBytes(b: number): string {
  if (b < 1024)        return `${b} B`;
  if (b < 1_048_576)   return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1_048_576).toFixed(1)} MB`;
}

const IDLE_SLOT: SlotState = { status: "idle" };

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function MediaUpload({ secureSlug: slugProp, onChange }: Props) {
  // Slug is generated once and stays stable for the component's lifetime.
  const [slug] = useState<string>(() => slugProp ?? generateSecureSlug());

  const [slots, setSlots] = useState<Record<FileSlot, SlotState>>({
    selfie: IDLE_SLOT,
    clip1:  IDLE_SLOT,
    clip2:  IDLE_SLOT,
    clip3:  IDLE_SLOT,
  });

  // One hidden file input per slot
  const inputRefs: Record<FileSlot, RefObject<HTMLInputElement | null>> = {
    selfie: useRef<HTMLInputElement>(null),
    clip1:  useRef<HTMLInputElement>(null),
    clip2:  useRef<HTMLInputElement>(null),
    clip3:  useRef<HTMLInputElement>(null),
  };

  // Emit changes whenever slots update
  useEffect(() => {
    onChange({
      secureSlug: slug,
      selfieUrl: slots.selfie.signedUrl ?? null,
      clipUrls: [
        slots.clip1.signedUrl ?? null,
        slots.clip2.signedUrl ?? null,
        slots.clip3.signedUrl ?? null,
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, slug]);

  // Patch a single slot without touching others
  const patchSlot = useCallback(
    (slot: FileSlot, patch: Partial<SlotState>) =>
      setSlots((prev) => ({ ...prev, [slot]: { ...prev[slot], ...patch } })),
    []
  );

  // ── Upload a file ──────────────────────────────────────────────────────────
  const uploadFile = useCallback(
    async (slot: FileSlot, file: File) => {
      // Client-side fast validation
      const mimeErr = clientMimeCheck(file, slot);
      if (mimeErr) {
        patchSlot(slot, { status: "error", error: mimeErr });
        return;
      }
      if (file.size > MAX_BYTES) {
        patchSlot(slot, {
          status: "error",
          error: `File too large: ${formatBytes(file.size)} (max ${MAX_MB} MB)`,
        });
        return;
      }

      // Revoke old preview before creating a new one
      const oldPreview = slots[slot].previewUrl;
      if (oldPreview) URL.revokeObjectURL(oldPreview);

      // Show local preview immediately for better UX
      const previewUrl = URL.createObjectURL(file);
      patchSlot(slot, {
        status:    "uploading",
        previewUrl,
        filename:  file.name,
        fileSize:  file.size,
        error:     undefined,
      });

      try {
        const fd = new FormData();
        fd.append("file",        file);
        fd.append("slot",        slot);
        fd.append("secureSlug",  slug);

        const res  = await fetch("/api/upload", { method: "POST", body: fd });
        const data = (await res.json()) as {
          signedUrl?: string;
          storagePath?: string;
          slot?: string;
          error?: string;
        };

        if (!res.ok || !data.signedUrl) {
          patchSlot(slot, {
            status: "error",
            error:  data.error ?? "Upload failed. Please try again.",
          });
          return;
        }

        patchSlot(slot, {
          status:      "done",
          signedUrl:   data.signedUrl,
          storagePath: data.storagePath,
          filename:    file.name,
          fileSize:    file.size,
        });
      } catch {
        patchSlot(slot, {
          status: "error",
          error:  "Network error. Please check your connection and try again.",
        });
      }
    },
    [slug, slots, patchSlot]
  );

  // ── Replace: delete server file then re-open picker ───────────────────────
  const handleReplace = useCallback(
    async (slot: FileSlot) => {
      if (slots[slot].storagePath) {
        // Fire and forget — even if delete fails, next upload uses upsert=true
        fetch("/api/upload", {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ slot, secureSlug: slug }),
        }).catch(console.warn);
      }
      if (slots[slot].previewUrl) URL.revokeObjectURL(slots[slot].previewUrl!);
      patchSlot(slot, IDLE_SLOT);
      // Small delay so state flushes before the file dialog opens
      setTimeout(() => inputRefs[slot].current?.click(), 50);
    },
    [slug, slots, patchSlot, inputRefs]
  );

  // ── Remove: delete server file + clear slot ───────────────────────────────
  const handleRemove = useCallback(
    async (slot: FileSlot) => {
      if (slots[slot].storagePath) {
        fetch("/api/upload", {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ slot, secureSlug: slug }),
        }).catch(console.warn);
      }
      if (slots[slot].previewUrl) URL.revokeObjectURL(slots[slot].previewUrl!);
      patchSlot(slot, IDLE_SLOT);
    },
    [slug, slots, patchSlot]
  );

  // Cleanup all object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(slots).forEach((s) => {
        if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Only reveal next clip slot once the previous one is done
  const visibleClips = CLIP_SLOTS.slice(
    0,
    slots.clip1.status === "done" ? (slots.clip2.status === "done" ? 3 : 2) : 1
  );

  return (
    <div className="space-y-6">
      {/* ── Helper text ─────────────────────────────────────────────────── */}
      <div
        className="flex items-start gap-2 p-3 rounded-xl text-xs"
        style={{
          background: "rgba(255,184,0,0.06)",
          border:     "1px solid rgba(255,184,0,0.18)",
          color:      "#997300",
        }}
      >
        <Upload size={13} className="mt-0.5 shrink-0" style={{ color: "#FFB800" }} />
        <span>
          <strong style={{ color: "#FFB800" }}>1 selfie</strong> max {MAX_MB} MB
          &nbsp;(JPEG / PNG / WEBP)&nbsp;+&nbsp;
          <strong style={{ color: "#FFB800" }}>up to 3 clips</strong> max {MAX_MB} MB each
          &nbsp;(MP4 / MOV · 10–25 s)
        </span>
      </div>

      {/* ── Selfie slot ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-white">Selfie Photo</p>
        <SlotCard
          slot="selfie"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          state={slots.selfie}
          inputRef={inputRefs.selfie}
          onFileChange={(f) => uploadFile("selfie", f)}
          onReplace={() => handleReplace("selfie")}
          onRemove={() => handleRemove("selfie")}
        />
      </div>

      {/* ── Clip slots ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">Video Clips</p>

        {visibleClips.map((slot, i) => (
          <SlotCard
            key={slot}
            slot={slot}
            accept="video/mp4,video/quicktime,.mp4,.mov"
            label={`Clip ${i + 1}`}
            state={slots[slot]}
            inputRef={inputRefs[slot]}
            onFileChange={(f) => uploadFile(slot, f)}
            onReplace={() => handleReplace(slot)}
            onRemove={() => handleRemove(slot)}
          />
        ))}

        {visibleClips.length < 3 && (
          <p className="text-xs" style={{ color: "#333340" }}>
            Upload clip {visibleClips.length} to unlock slot {visibleClips.length + 1}
          </p>
        )}
      </div>

      {/* ── Selfie required warning ──────────────────────────────────────── */}
      {slots.selfie.status !== "done" && (
        <div
          className="flex items-center gap-2 text-xs p-3 rounded-xl"
          style={{
            background: "rgba(255,107,53,0.08)",
            border:     "1px solid rgba(255,107,53,0.2)",
            color:      "#FF9A3C",
          }}
        >
          <AlertCircle size={13} className="shrink-0" />
          A selfie photo is required to continue.
        </div>
      )}
    </div>
  );
}

/* ─── SlotCard ───────────────────────────────────────────────────────────── */

interface SlotCardProps {
  slot:         FileSlot;
  accept:       string;
  state:        SlotState;
  inputRef:     RefObject<HTMLInputElement | null>;
  onFileChange: (file: File) => void;
  onReplace:    () => void;
  onRemove:     () => void;
  /** Override display label (defaults to "Selfie" or "Clip N") */
  label?: string;
}

function SlotCard({
  slot, accept, state, inputRef, onFileChange, onReplace, onRemove, label,
}: SlotCardProps) {
  const isImage  = isSelfieSlot(slot);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFileChange(f);
  };

  const slotLabel = label ?? (isImage ? "Selfie" : slot.replace("clip", "Clip "));

  /* ── Shared hidden input ─────────────────────────────────────────────── */
  const HiddenInput = () => (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onFileChange(f);
        e.target.value = ""; // allow re-selecting same file
      }}
    />
  );

  /* ── IDLE: drop zone ─────────────────────────────────────────────────── */
  if (state.status === "idle") {
    return (
      <>
        <HiddenInput />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          className="w-full rounded-2xl p-6 flex flex-col items-center gap-3 transition-all"
          style={{
            border:     `2px dashed ${drag ? "#FFB800" : "rgba(255,184,0,0.2)"}`,
            background: drag ? "rgba(255,184,0,0.04)" : "rgba(17,17,22,0.5)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,184,0,0.1)" }}
          >
            {isImage
              ? <ImageIcon size={18} style={{ color: "#FFB800" }} />
              : <Film      size={18} style={{ color: "#FF9A3C" }} />}
          </div>
          <div className="text-center">
            <p className="font-semibold text-white text-sm">{slotLabel}</p>
            <p className="text-xs mt-0.5" style={{ color: "#4A4A58" }}>
              Click or drag & drop · max {MAX_MB} MB
            </p>
          </div>
        </button>
      </>
    );
  }

  /* ── UPLOADING ───────────────────────────────────────────────────────── */
  if (state.status === "uploading") {
    return (
      <div
        className="rounded-2xl p-4 flex items-center gap-3"
        style={{
          background: "rgba(17,17,22,0.8)",
          border:     "1px solid rgba(255,184,0,0.12)",
        }}
      >
        {/* Preview thumbnail */}
        {isImage && state.previewUrl ? (
          <img
            src={state.previewUrl}
            alt="preview"
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,150,0,0.08)" }}
          >
            <Film size={22} style={{ color: "#FF9A3C" }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{state.filename}</p>
          {state.fileSize && (
            <p className="text-xs" style={{ color: "#4A4A58" }}>
              {formatBytes(state.fileSize)}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <Loader2 size={12} className="animate-spin" style={{ color: "#FFB800" }} />
            <span className="text-xs" style={{ color: "#4A4A58" }}>
              Uploading securely…
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ── DONE ────────────────────────────────────────────────────────────── */
  if (state.status === "done") {
    return (
      <div
        className="rounded-2xl p-4 flex items-center gap-3"
        style={{
          background: "rgba(17,17,22,0.8)",
          border:     "1px solid rgba(34,197,94,0.25)",
        }}
      >
        {/* Thumbnail */}
        {isImage && state.signedUrl ? (
          <img
            src={state.signedUrl}
            alt={slotLabel}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,150,0,0.08)" }}
          >
            <Film size={22} style={{ color: "#FF9A3C" }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} style={{ color: "#22c55e" }} />
            <p className="text-sm text-white truncate">{state.filename}</p>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#4A4A58" }}>
            {state.fileSize ? formatBytes(state.fileSize) : ""}&nbsp;·&nbsp;
            {isImage ? "EXIF stripped" : "Uploaded"}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReplace}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{
              background: "rgba(255,184,0,0.1)",
              color:      "#FFB800",
              border:     "1px solid rgba(255,184,0,0.2)",
            }}
          >
            <RefreshCw size={11} />
            Replace
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
            style={{
              background: "rgba(239,68,68,0.1)",
              color:      "#f87171",
              border:     "1px solid rgba(239,68,68,0.2)",
            }}
            aria-label="Remove file"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  /* ── ERROR ───────────────────────────────────────────────────────────── */
  return (
    <>
      <HiddenInput />
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{
          background: "rgba(239,68,68,0.06)",
          border:     "1px solid rgba(239,68,68,0.2)",
        }}
      >
        <div className="flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "#f87171" }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "#f87171" }}>
              {slotLabel} — Failed to upload
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#4A4A58" }}>
              {state.error}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{
            background: "rgba(255,184,0,0.1)",
            color:      "#FFB800",
            border:     "1px solid rgba(255,184,0,0.2)",
          }}
        >
          Try again
        </button>
      </div>
    </>
  );
}
