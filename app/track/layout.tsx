import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track your AI memory gift order. Enter your order ID to see real-time production and shipping status.",
  alternates: { canonical: "https://giftunlock.in/track" },
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
