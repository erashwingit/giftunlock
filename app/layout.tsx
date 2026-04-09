import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GiftUnlock",
  url: "https://giftunlock.in",
  logo: "https://giftunlock.in/logo.png",
  description:
    "India's AI-powered personalized memory gift brand. We recreate your photos and videos into cinematic AI memories printed as artistic QR codes on premium gifts.",
  foundingLocation: "Delhi, India",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: ["English", "Hindi"],
    telephone: "+91-6396151569",
  },
  sameAs: ["https://instagram.com/giftunlock", "https://wa.me/916396151569"],
};

export const metadata: Metadata = {
  title: {
    default: "GiftUnlock — AI-Crafted Memory Gifts with QR Code | India",
    template: "%s — GiftUnlock",
  },
  description:
    "We take your photos & videos and recreate them into a cinematic AI memory — printed as an artistic QR code on T-shirts, mugs & more. Scan to unlock. Ships pan India in 48hr. From ₹499.",
  keywords: [
    "personalized memory gift India",
    "QR code gift India",
    "AI personalized gift",
    "custom QR code gift",
    "cinematic memory video gift",
    "scan to unlock gift",
    "personalized T-shirt QR code",
    "NFC gift India",
    "memory video gift",
    "best personalized gift India 2026",
  ],
  openGraph: {
    title: "GiftUnlock — AI-Crafted Memory Gifts with QR Code | India",
    description:
      "We take your photos & videos and recreate them into a cinematic AI memory — printed as an artistic QR code on T-shirts, mugs & more. Scan to unlock. Ships pan India in 48hr. From ₹499.",
    url: "https://giftunlock.in",
    siteName: "GiftUnlock",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://giftunlock.in/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "GiftUnlock — AI-Crafted Cinematic Memory Gift with QR Code",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GiftUnlock — AI-Crafted Memory Gifts with QR Code | India",
    description:
      "Turn your memories into a cinematic AI gift. Scan the QR → the magic plays. Ships pan India in 48hr.",
    images: ["https://giftunlock.in/og-image.jpg"],
  },
  alternates: {
    canonical: "https://giftunlock.in",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-dark-900 text-white`}
      >
        {children}
        <Analytics />
        {/* Organization schema — site-wide, parsed by AI tools & Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </body>
    </html>
  );
}
