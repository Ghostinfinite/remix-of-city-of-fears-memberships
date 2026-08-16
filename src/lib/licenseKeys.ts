// ─── License Key + Purchase System ───────────────────────────────────────────
// Keys stored in localStorage under "cof_license_keys"
// Memberships stored under "cof_memberships"
// Support tickets stored under "cof_support_tickets"
// One free trial per account — tracked under "cof_trial_used_<userId>"

export type TierName = "Silver" | "Gold" | "Platinum" | "Diamond" | "Premium" | "Infinite";
export type PackName =
  | "Rookie Welcome Pack" | "Quick Cash Drop" | "Street Hustler Bundle"
  | "Garage Starter" | "Gun Runner Pack" | "Ultimate Crew Pack"
  | "Ghost Elite Pack" | "Property Mogul" | "Kingpin Empire" | "Apex Predator Pack"
  | "Main Departments" | "Main Dept Lifetime" | "Sub Departments" | "Sub Dept Lifetime";

export type KeyType = "trial" | "membership" | "pack" | "credits";

export type LicenseKey = {
  key: string;
  type: KeyType;
  tier: TierName | null;       // set for membership/trial keys
  packName: PackName | null;   // set for pack keys
  creditsAmount: number | null; // set for casino credit keys
  durationDays: number;        // 3 for every membership/trial, 0 for packs/credits (permanent)
  isTrial: boolean;
  createdBy: string;
  createdAt: string;
  redeemedBy: string | null;
  redeemedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  note: string;                // admin note e.g. "for PlayerOne"
};

export type Membership = {
  userId: string;
  tier: TierName;
  activatedAt: string;
  expiresAt: string;
  keyUsed: string;
  isTrial: boolean;
};

export type RedeemedPack = {
  userId: string;
  packName: PackName;
  redeemedAt: string;
  keyUsed: string;
};

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketType = "purchase_request" | "support" | "appeal" | "other";

export type SupportTicket = {
  id: string;
  userId: string;
  userEmail: string;
  type: TicketType;
  subject: string;
  body: string;
  // For purchase requests
  requestedItem: string | null;   // tier name or pack name
  requestedItemType: "membership" | "pack" | "credits" | null;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
  assignedKey: string | null;     // key assigned by admin after approval
};

export type TicketReply = {
  id: string;
  author: string;   // "admin" | "owner" | user email
  body: string;
  createdAt: string;
  isStaff: boolean;
};

// ── Exclusive Content ─────────────────────────────────────────────────────────

export type ExclusiveContent = {
  id: string;
  title: string;
  description: string;
  type: "download" | "code" | "guide" | "media";
  content: string;             // the actual content / code / link
  unlockedBy: TierName[];      // which tiers unlock this
  unlockedByPacks: PackName[]; // which packs also unlock this
  icon: string;
};

export const EXCLUSIVE_CONTENT: ExclusiveContent[] = [
  {
    id: "silver-discord",
    title: "Silver Discord Role Code",
    description: "Claim your exclusive Silver Discord role with this code.",
    type: "code",
    content: "SILVER-ROLE-2025",
    unlockedBy: ["Silver", "Gold", "Platinum", "Diamond", "Premium", "Infinite"],
    unlockedByPacks: [],
    icon: "🥈",
  },
  {
    id: "gold-vehicle-pack",
    title: "Gold Vehicle Pack",
    description: "Exclusive vehicle spawn codes for Gold+ members.",
    type: "code",
    content: "GOLD-VEH-SPAWN-G7X2",
    unlockedBy: ["Gold", "Platinum", "Diamond", "Premium", "Infinite"],
    unlockedByPacks: ["Garage Starter", "Ultimate Crew Pack", "Ghost Elite Pack", "Kingpin Empire", "Apex Predator Pack"],
    icon: "🚗",
  },
  {
    id: "platinum-apartment",
    title: "Platinum Apartment Access",
    description: "Your personal apartment MLO access code. Show this to staff in-game.",
    type: "code",
    content: "PLAT-APT-COF-9K3M",
    unlockedBy: ["Platinum", "Diamond", "Premium", "Infinite"],
    unlockedByPacks: ["Property Mogul", "Kingpin Empire", "Apex Predator Pack"],
    icon: "🏠",
  },
  {
    id: "diamond-mlo",
    title: "Diamond Custom MLO Interior",
    description: "Request form and access code for your custom MLO interior.",
    type: "guide",
    content: "Open a support ticket with subject 'Diamond MLO Request' and include this code: DIAM-MLO-2025-VIP. Staff will set it up within 48 hours.",
    unlockedBy: ["Diamond", "Premium", "Infinite"],
    unlockedByPacks: ["Property Mogul", "Kingpin Empire", "Apex Predator Pack"],
    icon: "💎",
  },
  {
    id: "premium-scripted-item",
    title: "Premium Custom Scripted Item",
    description: "Your unique scripted item request code. One per account.",
    type: "code",
    content: "PREM-SCRIPT-ITEM-COF",
    unlockedBy: ["Premium", "Infinite"],
    unlockedByPacks: ["Apex Predator Pack"],
    icon: "⚡",
  },
  {
    id: "infinite-npc",
    title: "Infinite NPC Cameo",
    description: "Your personal NPC cameo setup guide. Only Infinite members get this.",
    type: "guide",
    content: "Open a ticket with subject 'Infinite NPC Setup' and include your character name and description. The owner will personally set this up within 72 hours.",
    unlockedBy: ["Infinite"],
    unlockedByPacks: [],
    icon: "👻",
  },
  {
    id: "crew-pack-weapons",
    title: "Ultimate Crew Weapon Codes",
    description: "Weapon delivery codes for your Ultimate Crew Pack.",
    type: "code",
    content: "CREW-WPNS-UC-4F9R",
    unlockedBy: ["Diamond", "Premium", "Infinite"],
    unlockedByPacks: ["Gun Runner Pack", "Ultimate Crew Pack", "Ghost Elite Pack", "Kingpin Empire", "Apex Predator Pack"],
    icon: "🔫",
  },
  {
    id: "ghost-elite-cash",
    title: "Ghost Elite Cash Drop Code",
    description: "Present this code to staff to receive your $5M cash drop.",
    type: "code",
    content: "GHOST-CASH-5M-COF",
    unlockedBy: ["Infinite"],
    unlockedByPacks: ["Ghost Elite Pack", "Kingpin Empire", "Apex Predator Pack"],
    icon: "💰",
  },
  {
    id: "server-guide",
    title: "New Member Server Guide",
    description: "Full guide to getting started on City of Fears.",
    type: "guide",
    content: "1. Connect via F8: connect 6aa9y6\n2. Join Discord: discord.gg/UPxFnhurmb\n3. Read #rules and #getting-started\n4. Open a ticket if you need help with your purchased items.",
    unlockedBy: ["Silver", "Gold", "Platinum", "Diamond", "Premium", "Infinite"],
    unlockedByPacks: ["Rookie Welcome Pack", "Quick Cash Drop", "Street Hustler Bundle", "Garage Starter", "Gun Runner Pack", "Ultimate Crew Pack", "Ghost Elite Pack", "Property Mogul", "Kingpin Empire", "Apex Predator Pack"],
    icon: "📖",
  },
];

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEYS_KEY = "cof_license_keys";
const MEMBERSHIPS_KEY = "cof_memberships";
const PACKS_KEY = "cof_redeemed_packs";
const TICKETS_KEY = "cof_support_tickets";
const TRIAL_PREFIX = "cof_trial_used_";

// ── Helpers ───────────────────────────────────────────────────────────────────

function rand(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function tierCode(tier: TierName): string {
  return tier.slice(0, 4).toUpperCase();
}

function packCode(pack: PackName): string {
  return pack.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 4);
}

export function generateKeyString(tier: TierName | null, pack: PackName | null): string {
  const code = tier ? tierCode(tier) : pack ? packCode(pack) : "CRED";
  return `COF-${code}-${rand(4)}-${rand(4)}-${rand(4)}`;
}

// ── License Key Storage ───────────────────────────────────────────────────────

export function getLicenseKeys(): LicenseKey[] {
  try { return JSON.parse(localStorage.getItem(KEYS_KEY) || "[]"); }
  catch { return []; }
}

function saveLicenseKeys(keys: LicenseKey[]) {
  localStorage.setItem(KEYS_KEY, JSON.stringify(keys));
}

// ── Membership Storage ────────────────────────────────────────────────────────

export function getMemberships(): Membership[] {
  try { return JSON.parse(localStorage.getItem(MEMBERSHIPS_KEY) || "[]"); }
  catch { return []; }
}

function saveMemberships(m: Membership[]) {
  localStorage.setItem(MEMBERSHIPS_KEY, JSON.stringify(m));
}

export function getUserMembership(userId: string): Membership | null {
  const active = getMemberships()
    .filter(m => m.userId === userId && new Date(m.expiresAt) > new Date())
    .sort((a, b) => new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime());
  return active[0] ?? null;
}

// ── Redeemed Packs Storage ────────────────────────────────────────────────────

export function getRedeemedPacks(): RedeemedPack[] {
  try { return JSON.parse(localStorage.getItem(PACKS_KEY) || "[]"); }
  catch { return []; }
}

function saveRedeemedPacks(p: RedeemedPack[]) {
  localStorage.setItem(PACKS_KEY, JSON.stringify(p));
}

export function getUserRedeemedPacks(userId: string): RedeemedPack[] {
  return getRedeemedPacks().filter(p => p.userId === userId);
}

// ── Trial Tracking ────────────────────────────────────────────────────────────

export function hasUsedTrial(userId: string): boolean {
  return localStorage.getItem(TRIAL_PREFIX + userId) === "true";
}

function markTrialUsed(userId: string) {
  localStorage.setItem(TRIAL_PREFIX + userId, "true");
}

// ── Create License Key ────────────────────────────────────────────────────────

export function createLicenseKey(opts: {
  tier?: TierName;
  packName?: PackName;
  type: KeyType;
  createdBy: string;
  isTrial?: boolean;
  durationDays?: number;
  creditsAmount?: number;
  note?: string;
}): LicenseKey {
  const isTrial = opts.isTrial ?? false;
  const durationDays = opts.durationDays ?? ((opts.type === "pack" || opts.type === "credits") ? 0 : 3);
  const key: LicenseKey = {
    key: generateKeyString(opts.tier ?? null, opts.packName ?? null),
    type: opts.type,
    tier: opts.tier ?? null,
    packName: opts.packName ?? null,
    creditsAmount: opts.creditsAmount ?? null,
    durationDays,
    isTrial,
    createdBy: opts.createdBy,
    createdAt: new Date().toISOString(),
    redeemedBy: null,
    redeemedAt: null,
    expiresAt: null,
    isActive: true,
    note: opts.note ?? "",
  };
  const keys = getLicenseKeys();
  keys.unshift(key);
  saveLicenseKeys(keys);
  return key;
}

// ── Redeem License Key ────────────────────────────────────────────────────────

export type RedeemResult =
  | { ok: true; type: KeyType; tier?: TierName; packName?: PackName; creditsAmount?: number; expiresAt?: string }
  | { ok: false; error: string };

export function redeemLicenseKey(keyStr: string, userId: string): RedeemResult {
  const clean = keyStr.trim().toUpperCase();
  const keys = getLicenseKeys();
  const idx = keys.findIndex(k => k.key === clean);

  if (idx === -1) return { ok: false, error: "Invalid license key." };
  const k = keys[idx];
  if (!k.isActive) return { ok: false, error: "This key has been deactivated." };
  if (k.redeemedBy) return { ok: false, error: "This key has already been redeemed." };
  if (k.isTrial && hasUsedTrial(userId)) {
    return { ok: false, error: "You have already used your free 3-day trial." };
  }

  const now = new Date();
  const expiresAt = k.durationDays > 0
    ? new Date(now.getTime() + k.durationDays * 86400000).toISOString()
    : null;

  keys[idx] = { ...k, redeemedBy: userId, redeemedAt: now.toISOString(), expiresAt };
  saveLicenseKeys(keys);

  if (k.isTrial) markTrialUsed(userId);

  if (k.type === "membership" || k.type === "trial") {
    const membership: Membership = {
      userId,
      tier: k.tier!,
      activatedAt: now.toISOString(),
      expiresAt: expiresAt!,
      keyUsed: clean,
      isTrial: k.isTrial,
    };
    saveMemberships([...getMemberships(), membership]);
    return { ok: true, type: k.type, tier: k.tier!, expiresAt: expiresAt! };
  }

  if (k.type === "credits") {
    return { ok: true, type: "credits", creditsAmount: k.creditsAmount ?? 0 };
  }

  if (k.type === "pack") {
    const rp: RedeemedPack = {
      userId,
      packName: k.packName!,
      redeemedAt: now.toISOString(),
      keyUsed: clean,
    };
    saveRedeemedPacks([...getRedeemedPacks(), rp]);
    return { ok: true, type: "pack", packName: k.packName! };
  }

  return { ok: false, error: "Unknown key type." };
}

// ── Deactivate Key ────────────────────────────────────────────────────────────

export function deactivateLicenseKey(keyStr: string): boolean {
  const keys = getLicenseKeys();
  const idx = keys.findIndex(k => k.key === keyStr);
  if (idx === -1) return false;
  keys[idx] = { ...keys[idx], isActive: false };
  saveLicenseKeys(keys);
  return true;
}

// ── Exclusive Content Helpers ─────────────────────────────────────────────────

export function getUnlockedContent(userId: string): ExclusiveContent[] {
  const membership = getUserMembership(userId);
  const packs = getUserRedeemedPacks(userId).map(p => p.packName);
  return EXCLUSIVE_CONTENT.filter(c =>
    (membership && c.unlockedBy.includes(membership.tier)) ||
    packs.some(p => c.unlockedByPacks.includes(p))
  );
}

// ── Support Tickets ───────────────────────────────────────────────────────────

export function getSupportTickets(): SupportTicket[] {
  try { return JSON.parse(localStorage.getItem(TICKETS_KEY) || "[]"); }
  catch { return []; }
}

function saveSupportTickets(t: SupportTicket[]) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(t));
}

export function createSupportTicket(opts: {
  userId: string;
  userEmail: string;
  type: TicketType;
  subject: string;
  body: string;
  requestedItem?: string;
  requestedItemType?: "membership" | "pack" | "credits";
}): SupportTicket {
  const ticket: SupportTicket = {
    id: uid(),
    userId: opts.userId,
    userEmail: opts.userEmail,
    type: opts.type,
    subject: opts.subject,
    body: opts.body,
    requestedItem: opts.requestedItem ?? null,
    requestedItemType: opts.requestedItemType ?? null,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    replies: [],
    assignedKey: null,
  };
  const tickets = getSupportTickets();
  tickets.unshift(ticket);
  saveSupportTickets(tickets);
  return ticket;
}

export function replyToTicket(ticketId: string, author: string, body: string, isStaff: boolean): boolean {
  const tickets = getSupportTickets();
  const idx = tickets.findIndex(t => t.id === ticketId);
  if (idx === -1) return false;
  const reply: TicketReply = { id: uid(), author, body, createdAt: new Date().toISOString(), isStaff };
  tickets[idx].replies.push(reply);
  tickets[idx].updatedAt = new Date().toISOString();
  if (isStaff && tickets[idx].status === "open") tickets[idx].status = "in_progress";
  saveSupportTickets(tickets);
  return true;
}

export function updateTicketStatus(ticketId: string, status: TicketStatus): boolean {
  const tickets = getSupportTickets();
  const idx = tickets.findIndex(t => t.id === ticketId);
  if (idx === -1) return false;
  tickets[idx].status = status;
  tickets[idx].updatedAt = new Date().toISOString();
  saveSupportTickets(tickets);
  return true;
}

export function assignKeyToTicket(ticketId: string, keyStr: string): boolean {
  const tickets = getSupportTickets();
  const idx = tickets.findIndex(t => t.id === ticketId);
  if (idx === -1) return false;
  tickets[idx].assignedKey = keyStr;
  tickets[idx].status = "resolved";
  tickets[idx].updatedAt = new Date().toISOString();
  saveSupportTickets(tickets);
  return true;
}

export function getUserTickets(userId: string): SupportTicket[] {
  return getSupportTickets().filter(t => t.userId === userId);
}

// ── Tier / Pack constants ─────────────────────────────────────────────────────

export const ALL_TIERS: TierName[] = ["Silver", "Gold", "Platinum", "Diamond", "Premium", "Infinite"];
export const ALL_PACKS: PackName[] = [
  "Rookie Welcome Pack", "Quick Cash Drop", "Street Hustler Bundle",
  "Garage Starter", "Gun Runner Pack", "Ultimate Crew Pack",
  "Ghost Elite Pack", "Property Mogul", "Kingpin Empire", "Apex Predator Pack",
  "Main Departments", "Main Dept Lifetime", "Sub Departments", "Sub Dept Lifetime",
];

export const TIER_ORDER: TierName[] = ["Silver", "Gold", "Platinum", "Diamond", "Premium", "Infinite"];

export function tierRank(tier: TierName): number {
  return TIER_ORDER.indexOf(tier);
}
