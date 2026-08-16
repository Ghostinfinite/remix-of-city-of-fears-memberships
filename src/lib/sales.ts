// Sale manager — admins can put any catalog item on sale and take it off again.

import { logAdminAction } from "./auditLog";
import { pushSale, deleteSaleRemote, uuid } from "./remote";

const KEY = "cof_sales_v1";

export type Sale = {
  id: string;
  itemId: string;        // catalog item id, or "ALL" for a site-wide sale
  label: string;
  percentOff: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdBy: string;
  createdAt: string;
};

function read(): Sale[] {
  try {
    if (typeof window === "undefined") return [];
    return JSON.parse(window.localStorage.getItem(KEY) || "[]") as Sale[];
  } catch {
    return [];
  }
}

function write(list: Sale[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function getSales(): Sale[] {
  return read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function isSaleLive(s: Sale, now = new Date()): boolean {
  if (!s.active) return false;
  if (s.startsAt && new Date(s.startsAt) > now) return false;
  if (s.endsAt && new Date(s.endsAt) < now) return false;
  return true;
}

export function saleStatus(s: Sale): "live" | "scheduled" | "ended" | "off" {
  if (!s.active) return "off";
  const now = new Date();
  if (s.startsAt && new Date(s.startsAt) > now) return "scheduled";
  if (s.endsAt && new Date(s.endsAt) < now) return "ended";
  return "live";
}

export function createSale(opts: {
  itemId: string;
  label: string;
  percentOff: number;
  startsAt?: string | null;
  endsAt?: string | null;
  createdBy: string;
}): Sale {
  const pct = Math.max(1, Math.min(90, Math.round(opts.percentOff)));
  const sale: Sale = {
    id: uuid(),
    itemId: opts.itemId,
    label: opts.label || "Sale",
    percentOff: pct,
    active: true,
    startsAt: opts.startsAt || null,
    endsAt: opts.endsAt || null,
    createdBy: opts.createdBy,
    createdAt: new Date().toISOString(),
  };
  write([sale, ...read()]);
  pushSale(sale);
  logAdminAction({
    actor: opts.createdBy, category: "sales", action: "Created sale",
    target: sale.itemId, details: `${sale.label} — ${pct}% off`,
  });
  return sale;
}

export function toggleSale(id: string, actor: string): Sale | null {
  const list = read();
  const sale = list.find((s) => s.id === id);
  if (!sale) return null;
  sale.active = !sale.active;
  write(list);
  pushSale(sale);
  logAdminAction({
    actor, category: "sales", action: sale.active ? "Turned sale ON" : "Turned sale OFF",
    target: sale.itemId, details: `${sale.label} — ${sale.percentOff}% off`,
  });
  return sale;
}

export function updateSale(id: string, patch: Partial<Pick<Sale, "label" | "percentOff" | "startsAt" | "endsAt">>, actor: string) {
  const list = read();
  const sale = list.find((s) => s.id === id);
  if (!sale) return;
  if (typeof patch.percentOff === "number") patch.percentOff = Math.max(1, Math.min(90, Math.round(patch.percentOff)));
  Object.assign(sale, patch);
  write(list);
  pushSale(sale);
  logAdminAction({ actor, category: "sales", action: "Updated sale", target: sale.itemId, details: sale.label });
}

export function deleteSale(id: string, actor: string) {
  const sale = read().find((s) => s.id === id);
  write(read().filter((s) => s.id !== id));
  deleteSaleRemote(id);
  if (sale) {
    logAdminAction({ actor, category: "sales", action: "Deleted sale", target: sale.itemId, details: sale.label });
  }
}

/** Best live sale for an item (item-specific wins, then highest %). */
export function saleForItem(itemId: string): Sale | null {
  const live = read().filter((s) => isSaleLive(s)).filter((s) => s.itemId === itemId || s.itemId === "ALL");
  if (live.length === 0) return null;
  live.sort((a, b) => {
    const aAll = a.itemId === "ALL", bAll = b.itemId === "ALL";
    if (aAll !== bAll) return aAll ? 1 : -1;
    return b.percentOff - a.percentOff;
  });
  return live[0];
}

export function salePrice(price: number, itemId: string): { price: number; percentOff: number; sale: Sale | null } {
  const sale = saleForItem(itemId);
  if (!sale) return { price, percentOff: 0, sale: null };
  const next = Math.round(price * (1 - sale.percentOff / 100) * 100) / 100;
  return { price: next, percentOff: sale.percentOff, sale };
}
