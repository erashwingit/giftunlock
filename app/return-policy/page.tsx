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
            title: "1. Reprint Policy",
            body: `Free reprints are offered only when the QR code is confirmed non-functional upon arrival and reported within 48 hours of delivery. To qualify, you must contact us on WhatsApp (+91-6396151569) with your Order ID and a short video showing the QR scan failing. Reprints are not applicable for physical damage, scratches, fading, or misuse after delivery.`,
          },
          {
            title: "2. Returns — Damaged or Wrong Item",
            body: `If your product arrives physically damaged or is the wrong item, contact us within 48 hours of delivery with photos of the issue and your Order ID. We will arrange a free pickup and ship the correct or replacement product at no additional cost.`,
          },
          {
            title: "3. Non-Returnable Items",
            body: `Because every product is custom-printed to order, we do not accept returns or exchanges for change of mind, incorrect customisation details provided by the customer, or normal wear and tear. Please review your order carefully before confirming payment.`,
          },
          {
            title: "4. Cancellations",
            body: `Cancellations are only accepted within 2 hours of order placement, before production begins. Contact us immediately on WhatsApp with your Order ID. Once production has started, cancellations cannot be honoured.`,
          },
          {
            title: "5. Refund Process",
            body: `Approved refunds are processed to the original payment method within 5–7 business days via Razorpay. You will receive a WhatsApp confirmation once the refund is initiated.`,
          },
          {
            title: "6. Contact",
            body: `For all return, reprint, or refund requests, reach us on WhatsApp: +91-6396151569. Please include your Order ID and a description of the issue.`,
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
