import { Lock } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — GiftUnlock.in",
  description: "Terms and conditions for using GiftUnlock.in.",
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-black">Terms of Service</h1>
          <p className="text-xs" style={{ color: "#4A4A58" }}>Last updated: March 2025</p>
        </div>

        {[
          {
            title: "1. Acceptance",
            body: `By placing an order or using GiftUnlock.in, you agree to these Terms of Service. If you do not agree, please do not use the service.`,
          },
          {
            title: "2. Products & Customisation",
            body: `GiftUnlock.in sells personalised physical products (T-Shirts, Beer Mugs, Hoodies, Cushions, and more) embedded with QR codes or NFC chips linking to a customer-uploaded memory video. You are responsible for ensuring all uploaded content is lawful and does not infringe third-party rights (copyright, privacy, etc.).`,
          },
          {
            title: "3. Production & Delivery",
            body: `Production begins within 48 hours of confirmed payment. Estimated delivery is 5–7 business days for standard orders and 3–5 days for express. Timelines are estimates and may vary due to logistics partner delays. We are not liable for courier delays beyond our control.`,
          },
          {
            title: "4. Payment",
            body: `All prices are in Indian Rupees (INR) and include applicable taxes. Payment is processed via Razorpay. Orders are only confirmed upon successful payment capture. In the event of a payment failure, no order is created and no amount is deducted.`,
          },
          {
            title: "5. Prohibited Content",
            body: `You must not upload content that is illegal, defamatory, obscene, hateful, or infringes on any intellectual property rights. GiftUnlock.in reserves the right to cancel any order that contains prohibited content and to report it to relevant authorities if required.`,
          },
          {
            title: "6. Intellectual Property",
            body: `The GiftUnlock.in brand, website design, and software are the property of GiftUnlock.in. You retain ownership of the photos and videos you upload; by uploading, you grant us a limited licence to use them solely for fulfilling your order.`,
          },
          {
            title: "7. Limitation of Liability",
            body: `GiftUnlock.in's liability is limited to the amount paid for the specific order in question. We are not liable for indirect, incidental, or consequential damages including loss of data or emotional distress.`,
          },
          {
            title: "8. Governing Law",
            body: `These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Uttar Pradesh, India.`,
          },
          {
            title: "9. Changes",
            body: `We may update these Terms from time to time. Continued use of the service after changes constitutes acceptance of the revised Terms.`,
          },
          {
            title: "10. Contact",
            body: `For any questions regarding these Terms, contact us on WhatsApp: +91-6396151569.`,
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
          <Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
        </div>
      </div>
    </main>
  );
}
