// Shared product catalog — used by both the UI and the Stripe server function.
// Prices are in USD dollars (converted to cents server-side).

export type CatalogKind = "membership" | "credits" | "pack" | "phone";

export type CatalogItem = {
  id: string;
  kind: CatalogKind;
  name: string;
  price: number;
  /** credits granted after a successful payment (credit packs only) */
  credits?: number;
  /** membership length in days (0 = lifetime) */
  days?: number;
  blurb?: string;
};

export const MEMBERSHIP_ITEMS: CatalogItem[] = [
  { id: "mem_silver", kind: "membership", name: "Silver Membership", price: 5, days: 30, blurb: "Silver tag, priority queue, 5% shop discount" },
  { id: "mem_gold", kind: "membership", name: "Gold Membership", price: 10, days: 30, blurb: "Exclusive vehicles, custom plate, 10% off" },
  { id: "mem_platinum", kind: "membership", name: "Platinum Membership", price: 20, days: 30, blurb: "Apartment upgrade, premium garage, 15% off" },
  { id: "mem_diamond", kind: "membership", name: "Diamond Membership", price: 35, days: 30, blurb: "Custom MLO, reserved slot, 20% off" },
  { id: "mem_premium", kind: "membership", name: "Premium Membership", price: 60, days: 30, blurb: "Scripted item, VIP support, 30% off" },
  { id: "mem_infinite", kind: "membership", name: "Infinite Lifetime Membership", price: 299, days: 0, blurb: "Everything, forever. One-time payment." },
];

export const CREDIT_ITEMS: CatalogItem[] = [
  { id: "cr_5k", kind: "credits", name: "5,000 Credits", price: 4.99, credits: 5000 },
  { id: "cr_15k", kind: "credits", name: "15,000 Credits", price: 12.99, credits: 15000 },
  { id: "cr_40k", kind: "credits", name: "40,000 Credits", price: 29.99, credits: 40000 },
  { id: "cr_100k", kind: "credits", name: "100,000 Credits", price: 59.99, credits: 100000 },
  { id: "cr_250k", kind: "credits", name: "250,000 Credits", price: 119.99, credits: 250000 },
  { id: "cr_1m", kind: "credits", name: "1,000,000 Credits", price: 349.99, credits: 1000000 },
];

export const PHONE_ITEM: CatalogItem = {
  id: "phone_access",
  kind: "phone",
  name: "City of Fears Phone Access",
  price: 72.99,
  blurb: "Full in-game phone UI access on the website",
};

export const CATALOG: CatalogItem[] = [...MEMBERSHIP_ITEMS, ...CREDIT_ITEMS, PHONE_ITEM];

export function findCatalogItem(id: string): CatalogItem | undefined {
  return CATALOG.find((i) => i.id === id);
}

export function tierFromMembershipId(id: string): string | null {
  const item = MEMBERSHIP_ITEMS.find((m) => m.id === id);
  if (!item) return null;
  return item.name.split(" ")[0];
}
