import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GiftUnlock.in — Unlock the Memory They Will Never Forget",
  description:
    "Turn your photos & videos into a premium QR memory gift. T-shirts, mugs, hoodies, cushions. Ships in 48hrs across India. 4.9★ rated.",
  keywords: [
    "personalized gifts India",
    "memory gifts",
    "custom QR gift",
    "artistic QR code",
    "emotional gifts",
    "birthday gifts",
    "holi gifts",
    "haldi gifts",
    "custom t-shirt QR code",
    "QR memory gift",
  ],
  openGraph: {
    title: "GiftUnlock.in — Unlock the Memory They Will Never Forget",
    description:
      "Turn your photos & videos into a premium QR memory gift. T-shirts, mugs, hoodies, cushions. Ships in 48hrs across India. 4.9★ rated.",
    url: "https://giftunlock.in",
    siteName: "GiftUnlock.in",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GiftUnlock.in — Unlock the Memory They Will Never Forget",
    description:
      "Turn your photos & videos into a premium QR memory gift. T-shirts, mugs, hoodies, cushions. Ships in 48hrs across India. 4.9★ rated.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-dark-900 text-white`}>
        {children}
      </body>
    </html>
  );
}
