import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your AI Memory Gift",
  description:
    "Upload your photos & clips. Our AI recreates them into a cinematic memory video — printed as an artistic QR code on your chosen gift. Ships pan India in 48hr.",
  openGraph: {
    title: "Create Your AI Memory Gift — GiftUnlock",
    description:
      "Upload your photos & clips. Our AI recreates them into a cinematic memory video — printed as an artistic QR code on your chosen gift.",
    url: "https://giftunlock.in/order",
    type: "website",
  },
  alternates: { canonical: "https://giftunlock.in/order" },
};

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
