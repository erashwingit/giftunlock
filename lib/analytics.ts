/**
 * lib/analytics.ts — E-commerce & Conversion Tracking helper.
 * Supports Google Analytics (gtag), Meta Pixel (fbq), and safe console fallback.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export interface AnalyticsItem {
  id?: string;
  name: string;
  price: number;
  category?: string;
  quantity?: number;
}

export const analytics = {
  /** Track viewing a product */
  viewItem: (product: string, price: number) => {
    if (typeof window === "undefined") return;

    if (window.gtag) {
      window.gtag("event", "view_item", {
        currency: "INR",
        value: price,
        items: [{ item_name: product, price }],
      });
    }

    if (window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: product,
        currency: "INR",
        value: price,
      });
    }
  },

  /** Track beginning checkout flow */
  beginCheckout: (product: string, tier: string, value: number) => {
    if (typeof window === "undefined") return;

    if (window.gtag) {
      window.gtag("event", "begin_checkout", {
        currency: "INR",
        value,
        items: [{ item_name: `${product} (${tier})`, price: value }],
      });
    }

    if (window.fbq) {
      window.fbq("track", "InitiateCheckout", {
        content_name: `${product} (${tier})`,
        currency: "INR",
        value,
      });
    }
  },

  /** Track successful purchase */
  purchase: (orderId: string, value: number, product: string, tier: string) => {
    if (typeof window === "undefined") return;

    if (window.gtag) {
      window.gtag("event", "purchase", {
        transaction_id: orderId,
        currency: "INR",
        value,
        items: [{ item_name: `${product} (${tier})`, price: value }],
      });
    }

    if (window.fbq) {
      window.fbq("track", "Purchase", {
        currency: "INR",
        value,
        order_id: orderId,
        content_name: `${product} (${tier})`,
      });
    }
  },

  /** Custom interaction event */
  trackEvent: (eventName: string, params?: Record<string, unknown>) => {
    if (typeof window === "undefined") return;

    if (window.gtag) {
      window.gtag("event", eventName, params);
    }

    if (window.fbq) {
      window.fbq("trackCustom", eventName, params);
    }
  },
};
