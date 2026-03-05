/**
 * Admin audit logging — writes to Supabase `admin_audit_log` table.
 * Non-blocking: failures are swallowed so they never break the request.
 */
import { createAdminClient } from "@/lib/supabase";
import { NextRequest } from "next/server";

export type AuditAction =
  | "login_success"
  | "login_failure"
  | "login_blocked"
  | "logout"
  | "promo_create"
  | "promo_update"
  | "promo_delete"
  | "order_fulfill"
  | "order_media_delete"
  | "storage_cleanup";

/** Extract a best-effort IP from the request headers */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function auditLog(
  action: AuditAction,
  req: NextRequest,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("admin_audit_log").insert({
      action,
      ip:         getClientIp(req),
      user_agent: req.headers.get("user-agent") ?? null,
      details:    details ?? null,
    });
  } catch {
    // Audit log failures must never block the actual request
  }
}
