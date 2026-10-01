/**
 * lib/shipping.ts — Courier tracking URL generator for Indian logistics.
 */

export const SUPPORTED_COURIERS = [
  { id: "shiprocket", name: "Shiprocket" },
  { id: "delhivery",  name: "Delhivery" },
  { id: "bluedart",   name: "Blue Dart" },
  { id: "dtdc",       name: "DTDC" },
  { id: "indiapost",  name: "India Post" },
  { id: "shadowfax",  name: "Shadowfax" },
  { id: "other",      name: "Other" },
] as const;

export function getCourierTrackingUrl(
  courier: string | null | undefined,
  trackingNumber: string | null | undefined
): string | null {
  if (!trackingNumber) return null;
  const c = (courier || "").toLowerCase().trim();
  const tr = encodeURIComponent(trackingNumber.trim());

  if (c.includes("shiprocket")) {
    return `https://shiprocket.co/tracking/${tr}`;
  }
  if (c.includes("delhivery")) {
    return `https://www.delhivery.com/track/package/${tr}`;
  }
  if (c.includes("bluedart") || c.includes("blue dart")) {
    return `https://www.bluedart.com/tracking?trackFor=0&trackNo=${tr}`;
  }
  if (c.includes("dtdc")) {
    return `https://www.dtdc.in/tracking/shipment-tracking.asp?strCnno=${tr}`;
  }
  if (c.includes("india post") || c.includes("indiapost") || c.includes("speed post")) {
    return `https://www.indiapost.gov.in/_layouts/15/dpt.cpt.application/trackconsignment.aspx`;
  }
  if (c.includes("shadowfax")) {
    return `https://tracker.shadowfax.in/#/track/${tr}`;
  }

  // Universal tracker fallback
  return `https://shipway.in/track/${tr}`;
}
