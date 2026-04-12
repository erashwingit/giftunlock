/**
 * lib/email.ts — Transactional email via Resend SDK.
 *
 * Required environment variables (server-side only, never expose to client):
 *   RESEND_API_KEY — API key from resend.com dashboard
 *
 * Sender domain `giftunlock.in` must be verified in the Resend dashboard.
 * FROM address: orders@giftunlock.in
 *
 * Security: `server-only` guard throws a build-time error if this module is
 * accidentally imported by a Client Component, preventing RESEND_API_KEY
 * from being bundled into the browser bundle.
 */

// This import causes a build error if accidentally bundled client-side
import "server-only";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "GiftUnlock <orders@giftunlock.in>";

/* ── Order confirmation email ─────────────────────────── */
export interface OrderConfirmationParams {
  to:           string; // customer email
  customerName: string;
  secureSlug:   string;
  productType:  string;
  tier:         string;
}

export async function sendOrderConfirmationEmail(
  params: OrderConfirmationParams
): Promise<void> {
  const { to, customerName, secureSlug, productType, tier } = params;
  const playLink = `https://giftunlock.in/play/${secureSlug}`;
  const trackLink = `https://giftunlock.in/track`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your GiftUnlock Order is Confirmed!</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0B;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0B;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:linear-gradient(145deg,#1A1A24,#111116);border-radius:24px;border:1px solid rgba(255,184,0,0.15);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 24px;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">🎁</div>
              <h1 style="margin:0;font-size:26px;font-weight:900;color:#FFFFFF;line-height:1.2;">
                Your GiftUnlock Order<br/>is Confirmed!
              </h1>
              <p style="margin:12px 0 0;font-size:14px;color:#9B9BAA;line-height:1.6;">
                Hi ${customerName}, thank you for your order.<br/>
                Your cinematic memory gift is now in production.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:rgba(255,184,0,0.1);"></div>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;font-size:12px;color:#4A4A58;">Order ID</td>
                  <td style="padding:8px 0;font-size:12px;font-weight:700;color:#FFFFFF;font-family:monospace;text-align:right;">${secureSlug.toUpperCase()}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:12px;color:#4A4A58;border-top:1px solid rgba(255,255,255,0.04);">Product</td>
                  <td style="padding:8px 0;font-size:12px;font-weight:600;color:#FFFFFF;text-align:right;border-top:1px solid rgba(255,255,255,0.04);">${productType}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:12px;color:#4A4A58;border-top:1px solid rgba(255,255,255,0.04);">Tier</td>
                  <td style="padding:8px 0;font-size:12px;font-weight:700;color:#FFB800;text-align:right;border-top:1px solid rgba(255,255,255,0.04);">${tier}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:12px;color:#4A4A58;border-top:1px solid rgba(255,255,255,0.04);">Est. Ready</td>
                  <td style="padding:8px 0;font-size:12px;font-weight:700;color:#FFB800;text-align:right;border-top:1px solid rgba(255,255,255,0.04);">Within 48 hours</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:rgba(255,184,0,0.1);"></div>
            </td>
          </tr>

          <!-- Play link info -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 16px;font-size:13px;color:#9B9BAA;line-height:1.6;">
                Your gift experience link — share it with the recipient
                once your memory video is ready:
              </p>
              <a href="${playLink}"
                style="display:inline-block;padding:14px 28px;border-radius:14px;background:linear-gradient(135deg,#FFD700,#FF9A3C);color:#0A0A0B;font-size:14px;font-weight:900;text-decoration:none;">
                🎬 Open Gift Experience
              </a>
              <p style="margin:16px 0 0;font-size:11px;color:#252530;word-break:break-all;">
                ${playLink}
              </p>
            </td>
          </tr>

          <!-- Track order -->
          <tr>
            <td style="padding:0 40px 24px;text-align:center;">
              <a href="${trackLink}"
                style="font-size:12px;color:#FFB800;text-decoration:none;">
                Track your order status →
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:rgba(255,184,0,0.1);"></div>
            </td>
          </tr>

          <!-- WhatsApp support -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 12px;font-size:12px;color:#4A4A58;">
                Questions? We're here to help.
              </p>
              <a href="https://wa.me/916396151569?text=Hi! I have a question about my GiftUnlock order ${secureSlug.toUpperCase()}"
                style="display:inline-block;padding:12px 24px;border-radius:14px;background:#25D366;color:#FFFFFF;font-size:13px;font-weight:700;text-decoration:none;">
                💬 Chat on WhatsApp
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 40px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#252530;">
                GiftUnlock.in — Made with ❤️ in India
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      [to],
    subject: "🎁 Your GiftUnlock Order is Confirmed!",
    html,
  });

  if (error) {
    console.error("Failed to send order confirmation email:", error);
    throw error;
  }
}
