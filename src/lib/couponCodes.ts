// Coupon / Promo Code System — stored in localStorage under "cof_coupon_codes"

export type CouponCode = {
  id: string;
  code: string;          // e.g. "GHOST20" (always stored uppercase)
  description: string;
  percentOff: number;    // additional % off stacked on top of global discount
  appliesToAll: boolean;
  maxUses: number | null; // null = unlimited
  usedCount: number;
  expiresAt: string | null; // ISO string, null = never expires
  isActive: boolean;
  createdAt: string;
  createdBy: string;
};

const STORAGE_KEY = "cof_coupon_codes";

export function getCoupons(): CouponCode[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCoupons(coupons: CouponCode[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
}

function uid() {
  return `coupon_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createCoupon(opts: {
  code: string;
  description: string;
  percentOff: number;
  appliesToAll?: boolean;
  maxUses?: number | null;
  expiresAt?: string | null;
  createdBy: string;
}): CouponCode {
  const code = opts.code.trim().toUpperCase();
  if (!code) throw new Error("Coupon code cannot be empty.");
  if (code.length < 3 || code.length > 20) throw new Error("Code must be 3–20 characters.");
  if (!/^[A-Z0-9_-]+$/.test(code)) throw new Error("Code can only contain letters, numbers, hyphens, and underscores.");
  if (opts.percentOff < 1 || opts.percentOff > 99) throw new Error("Discount must be between 1% and 99%.");

  const existing = getCoupons();
  if (existing.some((c) => c.code === code)) throw new Error(`Code "${code}" already exists.`);

  const coupon: CouponCode = {
    id: uid(),
    code,
    description: opts.description.trim() || `${opts.percentOff}% off`,
    percentOff: opts.percentOff,
    appliesToAll: opts.appliesToAll ?? true,
    maxUses: opts.maxUses ?? null,
    usedCount: 0,
    expiresAt: opts.expiresAt ?? null,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: opts.createdBy,
  };
  existing.unshift(coupon);
  saveCoupons(existing);
  return coupon;
}

export function deleteCoupon(id: string) {
  saveCoupons(getCoupons().filter((c) => c.id !== id));
}

export function toggleCoupon(id: string) {
  const coupons = getCoupons();
  const c = coupons.find((x) => x.id === id);
  if (!c) throw new Error("Coupon not found.");
  c.isActive = !c.isActive;
  saveCoupons(coupons);
}

export type ValidateResult =
  | { ok: true; coupon: CouponCode }
  | { ok: false; error: string };

export function validateCoupon(code: string): ValidateResult {
  const normalised = code.trim().toUpperCase();
  if (!normalised) return { ok: false, error: "Enter a coupon code." };

  const coupon = getCoupons().find((c) => c.code === normalised);
  if (!coupon) return { ok: false, error: `Code "${normalised}" is not valid.` };
  if (!coupon.isActive) return { ok: false, error: `Code "${normalised}" is no longer active.` };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { ok: false, error: `Code "${normalised}" has expired.` };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: `Code "${normalised}" has reached its usage limit.` };
  }
  return { ok: true, coupon };
}

export function incrementCouponUse(code: string) {
  const coupons = getCoupons();
  const c = coupons.find((x) => x.code === code.trim().toUpperCase());
  if (c) {
    c.usedCount += 1;
    saveCoupons(coupons);
  }
}

export function isCouponExpired(coupon: CouponCode): boolean {
  if (!coupon.expiresAt) return false;
  return new Date(coupon.expiresAt) < new Date();
}

export function couponStatus(coupon: CouponCode): "active" | "inactive" | "expired" | "maxed" {
  if (!coupon.isActive) return "inactive";
  if (isCouponExpired(coupon)) return "expired";
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return "maxed";
  return "active";
}
