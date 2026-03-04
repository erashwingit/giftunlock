/**
 * ONE-TIME migration endpoint.
 * DELETE this file after running once.
 * Call: POST /api/admin/migrate  (with admin cookie or x-admin-secret header)
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isValidAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (await isValidAdminToken(cookieToken)) return true;
  const h = req.headers.get("x-admin-secret");
  return !!process.env.ADMIN_SECRET && h === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: Record<string, string> = {};

  // 1. Create promo_codes table
  const { error: e1 } = await supabase.from("promo_codes").select("id").limit(1);
  if (e1?.code === "42P01") {
    // Table doesn't exist — create via raw RPC call using pg_execute shim
    // We use the Supabase REST /sql endpoint (service role only)
    const sqlUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`;
    const createSQL = `
      CREATE TABLE IF NOT EXISTS promo_codes (
        id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        code        TEXT        UNIQUE NOT NULL,
        type        TEXT        NOT NULL CHECK (type IN ('flat','percent')),
        value       INTEGER     NOT NULL CHECK (value > 0),
        max_uses    INTEGER,
        used_count  INTEGER     NOT NULL DEFAULT 0,
        active      BOOLEAN     NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE OR REPLACE FUNCTION increment_promo_used(promo_id UUID)
      RETURNS void LANGUAGE plpgsql AS $$
      BEGIN
        UPDATE promo_codes SET used_count = used_count + 1 WHERE id = promo_id;
      END;
      $$;
    `;
    const execRes = await fetch(sqlUrl, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "apikey":        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
      body: JSON.stringify({ sql: createSQL }),
    });
    results.create_table = execRes.ok ? "ok" : `${execRes.status}: ${await execRes.text()}`;
  } else {
    results.create_table = "already exists";
  }

  // 2. Seed promo codes using upsert (works after table exists)
  const seeds = [
    { code: "FIRST100", type: "flat"    as const, value: 100, max_uses: null, used_count: 0, active: true },
    { code: "HOLI2026", type: "percent" as const, value:  15, max_uses: null, used_count: 0, active: true },
    { code: "SQUAD10",  type: "percent" as const, value:  10, max_uses: null, used_count: 0, active: true },
    { code: "GIFTNOW",  type: "flat"    as const, value:  50, max_uses: null, used_count: 0, active: true },
  ];
  const { error: e2 } = await supabase.from("promo_codes").upsert(seeds, { onConflict: "code", ignoreDuplicates: true });
  results.seed = e2 ? e2.message : "ok";

  // 3. Add order_status column to orders (ignore error if already exists)
  // Supabase: we can't run ALTER TABLE directly, but we can try to select it
  const { error: e3 } = await supabase.from("orders").select("order_status").limit(1);
  results.order_status_column = e3 ? `missing (${e3.message})` : "ok";

  return NextResponse.json(results);
}
