import { createAdminClient } from "@/lib/supabase";
import type { Order } from "@/lib/supabase";
import { Lock, Gift, AlertCircle, Play, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

/* ─── Helpers ─────────────────────────────────────────────── */

/** Extract YouTube video ID from various YouTube URL formats */
function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

/* ─── Not Found ───────────────────────────────────────────── */
function NotFound() {
  return (
    <main className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center px-4 py-16">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(239,68,68,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md text-center space-y-6">
        <div
          className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          <AlertCircle size={36} style={{ color: "#f87171" }} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Gift Not Found</h1>
          <p className="text-sm leading-relaxed" style={{ color: "#4A4A58" }}>
            This gift link is invalid or expired. The link may have been
            mistyped, or the order associated with it no longer exists.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #FFD700, #FF9A3C)",
            color: "#0A0A0B",
          }}
        >
          <Gift size={14} /> Create Your Own Gift
        </Link>

        <div
          className="flex items-center justify-center gap-1.5 pt-2 text-xs"
          style={{ color: "#252530" }}
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: "#FFB800" }}
          >
            <Lock size={9} style={{ color: "#0A0A0B" }} />
          </div>
          GiftUnlock.in — Made with ❤️ in India
        </div>
      </div>
    </main>
  );
}

/* ─── Gift Page ───────────────────────────────────────────── */
function GiftPage({ order }: { order: Order }) {
  const videoId = youtubeId(order.destination_video_url);
  const isReady = !!videoId;
  const photos = (order.media_urls ?? []).filter((u) =>
    /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(u)
  );
  const occasion = order.occasion ?? null;

  return (
    <main className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-center"
        style={{
          background: "rgba(10,10,11,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,184,0,0.08)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: "#FFB800" }}
          >
            <Lock size={11} style={{ color: "#0A0A0B" }} />
          </div>
          <span className="font-bold text-sm">
            Gift
            <span
              style={{
                background: "linear-gradient(135deg, #FFD700, #FF9A3C)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Unlock
            </span>
          </span>
        </div>
      </div>

      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(255,184,0,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-lg mx-auto px-4 py-10 space-y-8">

        {/* Heading */}
        <div
          className="text-center space-y-2"
          style={{ animation: "fadeInUp 0.5s ease both" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#FFB800" }}
          >
            🎁 A gift was unlocked for you
          </p>
          <h1 className="text-3xl font-black text-white">
            {occasion ? `${occasion} Gift` : "Your Special Gift"}
          </h1>
          {order.product_type && (
            <p className="text-sm" style={{ color: "#4A4A58" }}>
              Printed on a {order.product_type}
              {order.tier === "NFC VIP" ? " · NFC VIP" : ""}
            </p>
          )}
        </div>

        {/* Video Player */}
        <div style={{ animation: "fadeInUp 0.5s ease 0.1s both" }}>
          {isReady ? (
            <div
              className="w-full rounded-2xl overflow-hidden"
              style={{
                border: "1px solid rgba(255,184,0,0.2)",
                aspectRatio: "16/9",
              }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`}
                title="Gift Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                style={{ border: "none" }}
              />
            </div>
          ) : (
            /* Video not ready yet */
            <div
              className="w-full rounded-2xl flex flex-col items-center justify-center gap-4 py-16"
              style={{
                background: "linear-gradient(145deg, #1A1A24, #111116)",
                border: "1px solid rgba(255,184,0,0.12)",
                aspectRatio: "16/9",
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(255,184,0,0.1)",
                  border: "1px solid rgba(255,184,0,0.2)",
                }}
              >
                <Play size={28} style={{ color: "#FFB800" }} />
              </div>
              <div className="text-center px-4">
                <p className="font-bold text-white text-sm">
                  Video Being Crafted
                </p>
                <p className="text-xs mt-1" style={{ color: "#4A4A58" }}>
                  Your personalised gift video is still being produced. Check
                  back in 48 hours!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Occasion & Wish */}
        {occasion && (
          <div
            className="rounded-2xl p-5 space-y-2"
            style={{
              background: "linear-gradient(145deg, #1A1A24, #111116)",
              border: "1px solid rgba(255,184,0,0.12)",
              animation: "fadeInUp 0.5s ease 0.2s both",
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "#FFB800" }}
            >
              The Occasion
            </p>
            <p className="text-white font-semibold">{occasion}</p>
          </div>
        )}

        {/* Uploaded Photos */}
        {photos.length > 0 && (
          <div style={{ animation: "fadeInUp 0.5s ease 0.3s both" }}>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: "#FFB800" }}
            >
              <ImageIcon size={11} className="inline mr-1" />
              Photos
            </p>
            <div className="grid grid-cols-2 gap-3">
              {photos.map((url, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden"
                  style={{
                    aspectRatio: "1/1",
                    border: "1px solid rgba(255,184,0,0.1)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          className="text-center pt-2"
          style={{ animation: "fadeInUp 0.5s ease 0.4s both" }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #FFD700, #FF9A3C)",
              color: "#0A0A0B",
            }}
          >
            <Gift size={14} /> Create Your Own Gift
          </Link>
        </div>

        {/* Brand footer */}
        <div
          className="flex items-center justify-center gap-1.5 pt-2 text-xs"
          style={{ color: "#252530" }}
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ background: "#FFB800" }}
          >
            <Lock size={9} style={{ color: "#0A0A0B" }} />
          </div>
          GiftUnlock.in — Made with ❤️ in India
        </div>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE EXPORT  (Server Component — safe to call Supabase here)
═══════════════════════════════════════════════════════════ */
export default async function PlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const db = createAdminClient();
  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("secure_slug", slug.toLowerCase())
    .single();

  if (error || !order) {
    return <NotFound />;
  }

  return <GiftPage order={order as Order} />;
}

/* ── Metadata ─────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select("occasion, product_type")
    .eq("secure_slug", slug.toLowerCase())
    .single();

  if (!order) {
    return {
      title: "Gift Not Found — GiftUnlock.in",
      description: "This gift link is invalid or expired.",
    };
  }

  return {
    title: `${order.occasion ?? "Special"} Gift — GiftUnlock.in`,
    description: `A personalised ${order.product_type} gift created with love on GiftUnlock.in`,
    openGraph: {
      title: `${order.occasion ?? "Special"} Gift — GiftUnlock.in`,
      description: "A personalised gift crafted just for you.",
    },
  };
}
