// Credit wallet + ledger. Wallets live on the local member record; the ledger
// records every movement so admins can audit the economy.

import { getLocalUsers, saveLocalUsers } from "./localAuth";
import { logAdminAction } from "./auditLog";
import { pushCredits, uuid } from "./remote";

const LEDGER_KEY = "cof_credit_ledger";

export type CreditEntry = {
  id: string;
  userId: string;
  amount: number;           // positive = earned, negative = spent
  reason: string;
  meta?: string;
  createdAt: number;
};

function readLedger(): CreditEntry[] {
  try {
    if (typeof window === "undefined") return [];
    return JSON.parse(window.localStorage.getItem(LEDGER_KEY) || "[]") as CreditEntry[];
  } catch {
    return [];
  }
}

function writeLedger(list: CreditEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEDGER_KEY, JSON.stringify(list.slice(0, 2000)));
}

export function getLedger(userId?: string): CreditEntry[] {
  const list = readLedger().sort((a, b) => b.createdAt - a.createdAt);
  return userId ? list.filter((e) => e.userId === userId) : list;
}

function record(userId: string, amount: number, reason: string, meta?: string) {
  writeLedger([
    { id: uuid(), userId, amount, reason, meta, createdAt: Date.now() },
    ...readLedger(),
  ]);
  pushCredits(userId, amount, reason, meta);
}

export function getBalance(userId: string): number {
  const user = getLocalUsers().find((u) => u.id === userId);
  if (user) return user.credits;
  // owner / non-member session: keep a standalone wallet
  try {
    if (typeof window === "undefined") return 0;
    return Number(window.localStorage.getItem("cof_wallet_" + userId) || 0);
  } catch {
    return 0;
  }
}

function setBalance(userId: string, value: number) {
  const users = getLocalUsers();
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.credits = Math.max(0, Math.round(value));
    saveLocalUsers(users);
    return;
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem("cof_wallet_" + userId, String(Math.max(0, Math.round(value))));
  }
}

export function addCredits(userId: string, amount: number, reason: string, meta?: string) {
  if (amount <= 0) return getBalance(userId);
  setBalance(userId, getBalance(userId) + amount);
  record(userId, amount, reason, meta);
  return getBalance(userId);
}

export function spendCredits(userId: string, amount: number, reason: string, meta?: string): { ok: boolean; error?: string; balance: number } {
  const balance = getBalance(userId);
  if (amount <= 0) return { ok: true, balance };
  if (balance < amount) return { ok: false, error: `Not enough credits — you need ${amount.toLocaleString()} and have ${balance.toLocaleString()}.`, balance };
  setBalance(userId, balance - amount);
  record(userId, -amount, reason, meta);
  return { ok: true, balance: getBalance(userId) };
}

export function transferCredits(fromUserId: string, toUserId: string, amount: number, reason: string) {
  const spent = spendCredits(fromUserId, amount, reason);
  if (!spent.ok) return spent;
  addCredits(toUserId, amount, reason + " (received)");
  return spent;
}

/** Admin adjustment — always audit-logged. */
export function adminAdjustCredits(actor: string, userId: string, delta: number, note = "") {
  if (delta >= 0) addCredits(userId, delta, "Admin grant", note);
  else spendCredits(userId, -delta, "Admin deduction", note);
  logAdminAction({
    actor, category: "credits", action: delta >= 0 ? "Granted credits" : "Removed credits",
    target: userId, details: `${delta > 0 ? "+" : ""}${delta.toLocaleString()} ${note}`.trim(),
  });
  return getBalance(userId);
}

export function economyStats() {
  const ledger = readLedger();
  const users = getLocalUsers();
  return {
    totalInCirculation: users.reduce((sum, u) => sum + u.credits, 0),
    totalEarned: ledger.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0),
    totalSpent: Math.abs(ledger.filter((e) => e.amount < 0).reduce((s, e) => s + e.amount, 0)),
    transactions: ledger.length,
    wallets: users.length,
  };
}
