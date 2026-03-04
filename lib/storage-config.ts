/**
 * lib/storage-config.ts
 * Shared storage constants + validators (client & server).
 * Keep this file free of server-only imports so it is safe in client components.
 */

// ─── Bucket ──────────────────────────────────────────────────────────────────
export const MEDIA_BUCKET = "order-media";

// ─── Size limits ─────────────────────────────────────────────────────────────
/** Hard limit per file: 50 MB */
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
/** Supabase free-tier quota: 1 GB — block new uploads at this threshold */
export const QUOTA_MAX_BYTES = 1024 * 1024 * 1024;
/** Warn admin when total usage exceeds 900 MB */
export const QUOTA_WARN_BYTES = 900 * 1024 * 1024;
/** Orders abandoned/pending longer than this are eligible for cleanup (48 h) */
export const CLEANUP_CUTOFF_MS = 48 * 60 * 60 * 1000;

// ─── Allowed MIME types ───────────────────────────────────────────────────────
/** Server-side magic-bytes allowlist for selfie uploads */
export const SELFIE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
/** Server-side magic-bytes allowlist for video clips */
export const CLIP_MIME = new Set(["video/mp4", "video/quicktime"]);

// ─── Allowed extensions (client-side fast check) ─────────────────────────────
export const SELFIE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
export const CLIP_EXT = new Set([".mp4", ".mov"]);

// ─── Blocked extensions (always reject regardless of MIME) ───────────────────
export const BLOCKED_EXT = new Set([
  ".exe", ".js", ".mjs", ".cjs", ".ts",
  ".php", ".php3", ".php4", ".php5", ".phtml",
  ".zip", ".tar", ".gz", ".rar", ".7z",
  ".sh", ".bash", ".zsh", ".fish", ".cmd", ".bat", ".ps1",
  ".svg", ".html", ".htm", ".xml",
  ".py", ".rb", ".pl", ".go", ".rs",
  ".dll", ".so", ".dylib", ".jar",
]);

// ─── Slot types ───────────────────────────────────────────────────────────────
export type FileSlot = "selfie" | "clip1" | "clip2" | "clip3";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the Supabase Storage folder path for an order.
 * Centralises the path scheme so it never diverges between upload and cleanup.
 */
export function getOrderFolder(secureSlug: string): string {
  return `orders/${secureSlug}`;
}

/**
 * Returns true when a filename contains a double extension attack pattern
 * e.g. "malware.php.jpg" → true   "photo.jpg" → false
 */
export function hasDoubleExtension(filename: string): boolean {
  const parts = filename.toLowerCase().trim().split(".");
  if (parts.length < 3) return false;
  const hiddenExt = "." + parts[parts.length - 2];
  return BLOCKED_EXT.has(hiddenExt);
}

/** Returns true when the outermost extension is blocked */
export function isBlockedExtension(filename: string): boolean {
  const name = filename.toLowerCase().trim();
  const dot = name.lastIndexOf(".");
  if (dot === -1) return false;
  return BLOCKED_EXT.has(name.slice(dot));
}

/** Maps a slot to its canonical storage filename */
export function slotToFilename(slot: FileSlot, isVideo: boolean): string {
  const ext = isVideo ? ".mp4" : ".jpg";
  return slot === "selfie" ? `selfie${ext}` : `${slot}${ext}`;
}

/** Returns true when the slot is the selfie slot */
export function isSelfieSlot(slot: FileSlot): boolean {
  return slot === "selfie";
}

/**
 * Client-side MIME / extension check (runs in browser before upload).
 * Returns an error string on failure, null on success.
 */
export function clientMimeCheck(file: File, slot: FileSlot): string | null {
  const name = file.name.toLowerCase().trim();
  const dotIdx = name.lastIndexOf(".");
  const ext = dotIdx !== -1 ? name.slice(dotIdx) : "";

  if (isBlockedExtension(name)) return `File type not allowed: ${ext || "unknown"}`;
  if (hasDoubleExtension(name)) return `Double extensions not allowed: ${file.name}`;

  if (isSelfieSlot(slot)) {
    if (!SELFIE_EXT.has(ext)) return "Selfie must be JPEG, PNG, or WEBP";
  } else {
    if (!CLIP_EXT.has(ext)) return "Clips must be MP4 or MOV";
  }

  return null;
}

/**
 * Generate a cryptographically-random 8-char hex slug (4 random bytes).
 * Safe to call in both browser and Node.js (Web Crypto API).
 */
export function generateSecureSlug(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
