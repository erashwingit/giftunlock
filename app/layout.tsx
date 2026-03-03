import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GiftUnlock.in — Unlock the Memory They Will Never Forget",
  description:
    "We print your love story on a premium gift. Upload selfie & video clips. We create a 15–30 sec cinematic memory, print a festive artistic QR code. One scan → pure emotion.",
  keywords: [
    "personalized gifts India",
    "memory gifts",
    "custom QR gift",
    "emotional gifts",
    "birthday gifts",
    "holi gifts",
    "custom t-shirt QR code",
  ],
  openGraph: {
    title: "GiftUnlock.in — Unlock the Memory They Will Never Forget",
    description:
      "Personalized memory gifts with a festive QR code. Scan to relive your best moments.",
    url: "https://giftunlock.in",
    siteName: "GiftUnlock.in",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GiftUnlock.in — Unlock the Memory They Will Never Forget",
    description:
      "Personalized memory gifts with a festive QR code. Scan to relive your best moments.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-dark-900 text-white`}
      >
        {children}
      </body>
    </html>
  );
}
