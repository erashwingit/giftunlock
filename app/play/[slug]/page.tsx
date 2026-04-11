import { createAdminClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Your Gift Awaits — GiftUnlock.in`,
    description: `Unlock a personalized memory. Order #${slug.toUpperCase()}`,
    openGraph: {
      title: "🎁 You've received a GiftUnlock!",
      description: "Click to reveal your personalized gift memory.",
    },
  };
}

/**
 * GET /play/[slug]
 * Magic redirect — QR code destination.
 * - If video ready  → redirect to destination_video_url
 * - If paid / in production → show "coming soon" status
 * - If unpaid → redirect to home
 */
export default async function PlayPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "secure_slug, payment_status, destination_video_url, customer_name, product_type, tier, occasion, personal_message, created_at"
    )
    .eq("secure_slug", slug)
    .single();

  if (!order) notFound();

  /* ── Video ready → redirect immediately ─────────── */
  if (order.destination_video_url) {
    redirect(order.destination_video_url);
  }

  /* ── Unpaid → home ───────────────────────────────── */
  if (order.payment_status !== "paid") {
    redirect("/");
  }

  /* ── Paid, video in production ───────────────────── */
  const PRODUCTION_HOURS = 48;
  const createdAt = new Date(order.created_at);
  const readyAt = new Date(createdAt.getTime() + PRODUCTION_HOURS * 60 * 60 * 1000);
  const hoursLeft = Math.max(
    0,
    Math.ceil((readyAt.getTime() - Date.now()) / (1000 * 60 * 60))
  );
  const progressPct =
    hoursLeft > 0
      ? Math.round(((PRODUCTION_HOURS - hoursLeft) / PRODUCTION_HOURS) * 100)
      : 95;

  return (
    <main
      className="min-h-screen text-white flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "linear-gradient(135deg, #0A0A0B 0%, #12121A 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,184,0,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm text-center space-y-8">
        {/* Gift icon */}
        <div className="flex justify-center">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{
              background: "linear-gradient(135deg, #FFD700 0%, #FF9A3C 100%)",
              boxShadow: "0 0 60px rgba(255,184,0,0.3)",
            }}
          >
            🎁
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black">Your Memory is Being Crafted</h1>
          <p className="text-sm" style={{ color: "#9B9BAA" }}>
            Your cinematic memory is being prepared. You&apos;ll receive an email when
            it&apos;s ready to play.
          </p>
        </div>

        {/* Status card */}
        <div
          className="rounded-2xl p-5 space-y-4 text-left"
          style={{
            background: "linear-gradient(145deg, #1A1A24, #111116)",
            border: "1px solid rgba(255,184,0,0.12)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ background: "#FFB800" }}
            />
            <span className="text-sm font-semibold text-white">In Production</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "#4A4A58" }}>Order</span>
              <span className="font-mono font-bold text-white text-xs">
                {slug.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#4A4A58" }}>Recipient</span>
              <span className="font-semibold text-white">{order.customer_name}</span>
            </div>
            {order.occasion && (
              <div className="flex justify-between">
                <span style={{ color: "#4A4A58" }}>Occasion</span>
                <span className="font-semibold text-white">{order.occasion}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: "#4A4A58" }}>Gift</span>
              <span className="font-semibold text-white">{order.product_type}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#4A4A58" }}>Tier</span>
              <span className="font-semibold text-white">{order.tier}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "#4A4A58" }}>Est. ready</span>
              <span className="font-semibold" style={{ color: "#FFB800" }}>
                {hoursLeft > 0 ? `~${hoursLeft}h` : "Very soon!"}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div
              className="flex justify-between text-xs mb-1.5"
              style={{ color: "#4A4A58" }}
            >
              <span>Production progress</span>
              <span>{progressPct}%</span>
            </div>
            <div
              className="w-full h-1.5 rounded-full"
              style={{ background: "rgba(255,184,0,0.1)" }}
            >
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #FFD700, #FF9A3C)",
                }}
              />
            </div>
          </div>
        </div>

        <p className="text-xs" style={{ color: "#252530" }}>
          Share this link with your gift recipient — it'll auto-play when ready 🎬
        </p>

        <a
          href={`https://wa.me/919999999999?text=Hi! My GiftUnlock order ${slug.toUpperCase()} status?`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] w-full justify-center"
          style={{ background: "#25D366", color: "#fff" }}
        >
          💬 Ask for update on WhatsApp
        </a>

        <p className="text-xs" style={{ color: "#252530" }}>
          GiftUnlock.in — Made with ❤️ in India
        </p>
      </div>
    </main>
  );
}
