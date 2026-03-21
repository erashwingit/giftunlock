import { Lock } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — GiftUnlock.in",
  description: "How GiftUnlock.in collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-black">Privacy Policy</h1>
          <p className="text-xs" style={{ color: "#4A4A58" }}>Last updated: March 2025</p>
        </div>

        {/* Sections */}
        {[
          {
            title: "1. Information We Collect",
            body: `When you place an order, we collect your name, phone number, shipping address, and any photos or media you upload. We also collect payment-related information via Razorpay (we never store raw card details). Usage data such as browser type and pages visited may be collected via analytics.`,
          },
          {
            title: "2. How We Use Your Information",
            body: `We use your data solely to fulfil your order — printing, QR/NFC encoding, shipping, and customer support. Phone numbers may be used to send order updates via WhatsApp. We do not sell or rent your data to third parties.`,
          },
          {
            title: "3. Media & Uploads",
            body: `Photos and videos you upload are stored securely on Supabase Storage and are accessible only via unique, unguessable URLs tied to your order slug. We do not share your uploaded media with anyone other than our internal production team.`,
          },
          {
            title: "4. Payment Processing",
            body: `All payments are processed by Razorpay, a PCI-DSS compliant payment gateway. GiftUnlock.in does not store your card, UPI, or net-banking credentials. Please review Razorpay's privacy policy at razorpay.com for details on how they handle payment data.`,
          },
          {
            title: "5. Cookies",
            body: `We use essential cookies to maintain session state. No third-party advertising or tracking cookies are used. You may disable cookies in your browser settings, though some site features may not function correctly.`,
          },
          {
            title: "6. Data Retention",
            body: `Order records are retained for 3 years for accounting and warranty purposes. Uploaded media is retained for 1 year after order creation, after which it may be deleted. You may request earlier deletion by contacting us.`,
          },
          {
            title: "7. Your Rights",
            body: `You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at the WhatsApp number or address below. We will respond within 30 days.`,
          },
          {
            title: "8. Contact",
            body: `GiftUnlock.in is operated from India. For privacy-related queries, reach us on WhatsApp: +91-6396151569.`,
          },
        ].map(({ title, body }) => (
          <section key={title} className="space-y-2">
            <h2 className="text-base font-bold text-white">{title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#9090A0" }}>{body}</p>
          </section>
        ))}

        {/* Footer nav */}
        <div className="flex gap-4 pt-4 text-xs" style={{ color: "#4A4A58" }}>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
        </div>
      </div>
    </main>
  );
}
