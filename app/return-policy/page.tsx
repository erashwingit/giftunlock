import { Lock } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Reprint Policy — GiftUnlock.in",
  description: "GiftUnlock.in return, reprint, and replacement policy.",
};

export default function ReturnPolicyPage() {
  return (
    <main className="min-h-screen bg-dark-900 text-white px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-10">

        {/* Header */}
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#FFB800" }}>
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "#FFB800" }}>
              <Lock size={9} style={{ color: "#0A0A0B" }} />
            </div>
            GiftUnlock.in
          </Link>
          <h1 className="text-3xl font-black">Return &amp; Reprint Policy</h1>
          <p className="text-xs" style={{ color: "#4A4A58" }}>Last updated: March 2025</p>
        </div>

        {[
          {
            title: "1. Custom Goods & Non-Returnable Policy",
            body: `Every GiftUnlock product is individually manufactured and custom-printed with your personal photos, videos, and dynamic QR artwork. Because personalized items cannot be restocked or resold, custom goods are strictly non-returnable once accepted. Please review your media, spelling, and product sizing carefully before completing your order.`,
          },
          {
            title: "2. 24-Hour On-Arrival Scan & Damage Guarantee",
            body: `Every product undergoes 3-step quality verification and scan validation prior to dispatch. If your order arrives damaged in transit or the QR code fails to scan on initial arrival, you must report it within 24 hours of delivery. To qualify for a free replacement reprint, share a continuous unboxing video clearly displaying the package label and the scanning test on WhatsApp (+91-8882414728) along with your Order ID. Once verified, a replacement will be printed and shipped at zero additional cost.`,
          },
          {
            title: "3. Cancellations",
            body: `Cancellations are only accepted within 2 hours of order placement, before digital artwork remastering and DTF printing commence. Contact us immediately on WhatsApp with your Order ID. Once production has started, orders cannot be cancelled.`,
          },
          {
            title: "4. Refund Process",
            body: `Approved refunds (e.g. duplicate payments or orders cancelled within 2 hours) are processed to the original payment method within 5–7 business days via Razorpay.`,
          },
          {
            title: "5. Contact & Support",
            body: `For all replacement, order status, or delivery inquiries, reach our team directly on WhatsApp: +91-8882414728 (orders@giftunlock.in). Please have your 8-character Order ID ready.`,
          },
        ].map(({ title, body }) => (
          <section key={title} className="space-y-2">
            <h2 className="text-base font-bold text-white">{title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#9090A0" }}>{body}</p>
          </section>
        ))}

        {/* Footer nav */}
        <div className="flex flex-wrap gap-4 pt-4 text-xs" style={{ color: "#4A4A58" }}>
          <Link href="/refund"  className="hover:text-white transition-colors">Refund Policy</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms"   className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/"        className="hover:text-white transition-colors">Home</Link>
        </div>
      </div>
    </main>
  );
}
