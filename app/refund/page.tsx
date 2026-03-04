import { Lock } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — GiftUnlock.in",
  description: "GiftUnlock.in refund, return, and cancellation policy.",
};

export default function RefundPage() {
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
          <h1 className="text-3xl font-black">Refund & Cancellation Policy</h1>
          <p className="text-xs" style={{ color: "#4A4A58" }}>Last updated: March 2025</p>
        </div>

        {[
          {
            title: "1. Cancellations",
            body: `Because every order is personalised and production begins within 48 hours of payment, cancellations are only accepted within 2 hours of order placement. To cancel, contact us immediately on WhatsApp: +91-6396151569 with your Order ID. Cancellations requested after production has started cannot be honoured.`,
          },
          {
            title: "2. Refunds — Damaged or Defective Items",
            body: `If your product arrives damaged, defective, or with an incorrect print, we will offer a free replacement or a full refund. Please contact us within 48 hours of delivery with photos of the damaged item and your Order ID. We will arrange a pickup and replacement at no additional cost.`,
          },
          {
            title: "3. Refunds — Wrong Item Shipped",
            body: `If you receive the wrong product, contact us within 48 hours of delivery. We will ship the correct item at no charge and arrange a return of the incorrect item.`,
          },
          {
            title: "4. Non-Refundable Situations",
            body: `Refunds are not applicable if: (a) the customer provided incorrect shipping details, (b) the customer uploaded incorrect photos or video links and production has started, (c) the product was delivered correctly and matches the order, (d) the request is made more than 7 days after delivery.`,
          },
          {
            title: "5. Refund Process",
            body: `Approved refunds are processed to the original payment method within 5–7 business days via Razorpay. Bank processing times may add 2–3 additional business days. You will receive a confirmation message once the refund is initiated.`,
          },
          {
            title: "6. Digital Components",
            body: `The QR code and NFC link associated with your order remain active even after a refund or replacement. If a refund is issued for a damaged product, the digital memory URL continues to function at no extra charge.`,
          },
          {
            title: "7. Contact",
            body: `For all refund or cancellation requests, reach us on WhatsApp: +91-6396151569. Please include your Order ID and a brief description of the issue.`,
          },
        ].map(({ title, body }) => (
          <section key={title} className="space-y-2">
            <h2 className="text-base font-bold text-white">{title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#9090A0" }}>{body}</p>
          </section>
        ))}

        {/* Footer nav */}
        <div className="flex gap-4 pt-4 text-xs" style={{ color: "#4A4A58" }}>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
        </div>
      </div>
    </main>
  );
}
