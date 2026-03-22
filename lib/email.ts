/**
 * lib/email.ts — Resend transactional email wrapper (server-only)
 * Uses the Resend SDK to send order lifecycle emails.
 * Requires RESEND_API_KEY env var.
 */
import { Resend } from "resend";

let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY!);
  return resend;
}

const FROM = "GiftUnlock <orders@giftunlock.in>";
const SITE = "https://giftunlock.in";

/* ── Email A: Order Confirmed (fires on payment.captured) ── */
export async function sendOrderConfirmationEmail(opts: {
  to:           string;
  customerName: string;
  productType:  string;
  tier:         string;
  secureSlug:   string;
}) {
  const trackUrl = `${SITE}/track/${opts.secureSlug}`;
  await getResend().emails.send({
    from:    FROM,
    to:      opts.to,
    subject: `🎁 Your GiftUnlock order is confirmed!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#FFB800">Order Confirmed ✅</h2>
        <p>Hi ${opts.customerName},</p>
        <p>Your order for <strong>${opts.productType} (${opts.tier})</strong> has been confirmed and is now in production.</p>
        <p>We'll craft your artistic QR and ship within 48 hours.</p>
        <p>
          <a href="${trackUrl}" style="display:inline-block;padding:10px 20px;background:#FFB800;color:#0A0A0B;border-radius:8px;font-weight:bold;text-decoration:none">
            Track Your Order →
          </a>
        </p>
        <p style="color:#888;font-size:12px">Order ref: ${opts.secureSlug.toUpperCase()}</p>
        <hr style="border:none;border-top:1px solid #eee"/>
        <p style="color:#888;font-size:11px">GiftUnlock.in · Unlock the Memory They Will Never Forget</p>
      </div>
    `,
  });
}

/* ── Email B: Order Fulfilled (fires when admin marks fulfilled) ── */
export async function sendOrderFulfilledEmail(opts: {
  to:           string;
  customerName: string;
  productType:  string;
  tier:         string;
  secureSlug:   string;
}) {
  const trackUrl = `${SITE}/track/${opts.secureSlug}`;
  await getResend().emails.send({
    from:    FROM,
    to:      opts.to,
    subject: `📦 Your GiftUnlock order has been dispatched!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#FFB800">Your Gift is on Its Way 🚚</h2>
        <p>Hi ${opts.customerName},</p>
        <p>Your <strong>${opts.productType} (${opts.tier})</strong> has been crafted, QR-tested, and dispatched!</p>
        <p>Expected delivery: 2–5 business days.</p>
        <p>
          <a href="${trackUrl}" style="display:inline-block;padding:10px 20px;background:#FFB800;color:#0A0A0B;border-radius:8px;font-weight:bold;text-decoration:none">
            View Order Status →
          </a>
        </p>
        <p style="color:#888;font-size:12px">Order ref: ${opts.secureSlug.toUpperCase()}</p>
        <hr style="border:none;border-top:1px solid #eee"/>
        <p style="color:#888;font-size:11px">GiftUnlock.in · Unlock the Memory They Will Never Forget</p>
      </div>
    `,
  });
}

/* ── Email C: Follow-up / Review Request (~3 days after fulfilled) ── */
export async function sendFollowUpEmail(opts: {
  to:           string;
  customerName: string;
  productType:  string;
  secureSlug:   string;
}) {
  await getResend().emails.send({
    from:    FROM,
    to:      opts.to,
    subject: `❤️ How did your GiftUnlock gift land?`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a">
        <h2 style="color:#FFB800">Did They Love It? ❤️</h2>
        <p>Hi ${opts.customerName},</p>
        <p>We hope your <strong>${opts.productType}</strong> gift created an unforgettable moment!</p>
        <p>We'd love to hear how it went — a quick review helps us grow and helps other customers decide:</p>
        <p>
          <a href="https://g.page/r/giftunlock/review" style="display:inline-block;padding:10px 20px;background:#FFB800;color:#0A0A0B;border-radius:8px;font-weight:bold;text-decoration:none">
            Leave a Quick Review →
          </a>
        </p>
        <p style="color:#888;font-size:12px">Order ref: ${opts.secureSlug.toUpperCase()}</p>
        <hr style="border:none;border-top:1px solid #eee"/>
        <p style="color:#888;font-size:11px">GiftUnlock.in · Unlock the Memory They Will Never Forget</p>
      </div>
    `,
  });
}
