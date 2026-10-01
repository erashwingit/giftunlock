import { WHATSAPP_NUMBER } from "./constants";

/**
 * lib/whatsapp.ts — Centralized WhatsApp message URL generators.
 */

/** Link for customer asking for support regarding their order */
export function getWhatsAppOrderHelpUrl(slug: string): string {
  const text = encodeURIComponent(
    `Hi GiftUnlock team! I have a question about my order ${slug.toUpperCase()}.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

/** Link for customer to share the memory gift link with their recipient */
export function getWhatsAppRecipientShareUrl(
  slug: string,
  senderName?: string
): string {
  const sender = senderName ? `from ${senderName}` : "";
  const text = encodeURIComponent(
    `🎁 I made a special personalized memory gift for you ${sender}! Unlock it here: https://giftunlock.in/play/${slug}`
  );
  return `https://api.whatsapp.com/send?text=${text}`;
}

/** Admin link to notify customer about their order status */
export function getWhatsAppCustomerNotifyUrl(
  phone: string,
  slug: string,
  type: "video_ready" | "shipped" | "confirmed",
  customerName?: string
): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const name = customerName ? customerName.split(" ")[0] : "there";

  let message = "";
  if (type === "video_ready") {
    message = `Hi ${name}! 🎉 Your GiftUnlock cinematic memory for order #${slug.toUpperCase()} is ready! Watch and share it here: https://giftunlock.in/play/${slug} ❤️`;
  } else if (type === "shipped") {
    message = `Hi ${name}! 🚀 Great news! Your GiftUnlock customized gift for order #${slug.toUpperCase()} has been printed and shipped! Track here: https://giftunlock.in/track`;
  } else {
    message = `Hi ${name}! 🎁 Your GiftUnlock order #${slug.toUpperCase()} has been confirmed and is now in production. Track status: https://giftunlock.in/track`;
  }

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

/** General support chat link */
export function getWhatsAppSupportUrl(message?: string): string {
  const defaultText = "Hi! I have a question about GiftUnlock.in";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message || defaultText
  )}`;
}
