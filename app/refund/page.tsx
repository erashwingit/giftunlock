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
            body: `Because every order is custom-personalised and production begins shortly after payment, cancellations are strictly accepted within 2 hours of order placement. To cancel, contact us immediately on WhatsApp: +91-8882414728 with your Order ID. Cancellations requested after digital processing has started cannot be accepted.`,
          },
          {
            title: "2. Replacements — Damaged or Non-Functional on Arrival",
            body: `Every item is 3-step scanned and quality checked prior to shipping. If your product arrives physically damaged in transit or the QR code fails to scan upon arrival, report it within 24 hours of delivery with continuous unboxing & scan test video proof on WhatsApp (+91-8882414728). Once verified, a replacement reprint will be issued free of cost. Due to the custom-printed nature of the goods, physical returns for non-defective items are not accepted.`,
          },
          {
            title: "3. Refunds — Wrong Item Shipped",
            body: `If an incorrect product type was mistakenly dispatched, contact us within 24 hours of delivery. We will immediately expedite the correct replacement at zero cost to you.`,
          },
          {
            title: "4. Non-Refundable Situations",
            body: `Refunds are not applicable if: (a) the customer provided incorrect shipping details or incomplete address, (b) the customer uploaded poor quality or incorrect photos/videos and production has completed, (c) the request is made more than 24 hours after delivery without unboxing video proof.`,
          },
          {
            title: "5. Refund Process",
            body: `Approved refunds are processed to the original payment method within 5–7 business days via Razorpay. You will receive an automated confirmation once the refund is initiated.`,
          },
          {
            title: "6. Digital Components",
            body: `The QR code and NFC link associated with your order remain active. If a reprint is issued, the digital memory URL continues to function seamlessly with your existing video memory.`,
          },
          {
            title: "7. Contact & Support",
            body: `For all order inquiries, replacements, or support, reach us on WhatsApp: +91-8882414728 (orders@giftunlock.in). Please include your Order ID.`,
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
