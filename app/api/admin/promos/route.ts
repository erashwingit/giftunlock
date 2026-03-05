import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { auditLog } from "@/lib/admin-audit";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;
  const headerSecret = req.headers.get("x-admin-secret");
  return !!process.env.ADMIN_SECRET && headerSecret === process.env.ADMIN_SECRET;
}

/* ── Input validation ─────────────────────────────────── */
const CODE_RE = /^[A-Z0-9_-]{1,20}$/;

function validatePromoInput(body: {
  code?: unknown; type?: unknown; value?: unknown; max_uses?: unknown;
}): string | null {
  if (typeof body.code !== "string" || !CODE_RE.test(body.code.toUpperCase().trim())) {
    return "Code must be 1-20 uppercase alphanumeric characters (A-Z, 0-9, _ -)";
  }
  if (!["flat", "percent"].includes(body.type as string)) {
    return "type must be 'flat' or 'percent'";
  }
  const v = Number(body.value);
  if (!Number.isInteger(v) || v < 1) return "value must be a positive integer";
  if (body.type === "percent" && (v < 1 || v > 99)) return "Percent must be 1-99";
  if (body.type === "flat"    && v > 10000)          return "Flat discount cannot exceed ₹10,000";
  if (body.max_uses !== undefined && body.max_uses !== null) {
    const m = Number(body.max_uses);
    if (!Number.isInteger(m) || m < 1 || m > 1_000_000) return "max_uses must be 1-1,000,000";
  }
  return null;
}

/** GET /api/admin/promos — list all promo codes */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** POST /api/admin/promos — create promo code */
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { code?: unknown; type?: unknown; value?: unknown; max_uses?: unknown };
  const validationErr = validatePromoInput(body);
  if (validationErr) return NextResponse.json({ error: validationErr }, { status: 400 });

  const code     = (body.code as string).toUpperCase().trim();
  const type     = body.type as "flat" | "percent";
  const value    = Number(body.value);
  const max_uses = body.max_uses != null ? Number(body.max_uses) : null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .insert({ code, type, value, max_uses, used_count: 0, active: true })
    .select()
    .single();

  if (error) {
    const msg = error.code === "23505" ? "Code already exists" : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  void auditLog("promo_create", req, { code, type, value, max_uses });
  return NextResponse.json(data, { status: 201 });
}
