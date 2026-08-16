export type Discount = {
  id: string;
  label: string;
  description: string | null;
  percent_off: number;
  starts_at: string;
  ends_at: string;
  applies_to_pack_ids: string[] | null;
  applies_to_all: boolean;
  is_active: boolean;
};

export function isDiscountLive(d: Discount, now = new Date()): boolean {
  if (!d.is_active) return false;
  const start = new Date(d.starts_at);
  const end = new Date(d.ends_at);
  return now >= start && now <= end;
}

export function discountForPack(packId: string, discounts: Discount[]): Discount | null {
  const live = discounts.filter(d => isDiscountLive(d));
  // Prefer pack-specific over global, then highest percent_off
  const matches = live.filter(d => d.applies_to_all || (d.applies_to_pack_ids ?? []).includes(packId));
  if (matches.length === 0) return null;
  matches.sort((a, b) => {
    if (a.applies_to_all !== b.applies_to_all) return a.applies_to_all ? 1 : -1;
    return b.percent_off - a.percent_off;
  });
  return matches[0];
}

export function applyDiscount(price: number, percentOff: number): number {
  return Math.max(0, price * (1 - percentOff / 100));
}

export function formatTimeLeft(endsAt: string): string {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h left`;
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m left`;
}
