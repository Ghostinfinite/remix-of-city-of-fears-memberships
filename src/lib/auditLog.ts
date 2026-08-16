// Automatic admin audit log — every admin action is recorded here.

import { pushAudit, uuid } from "./remote";

const KEY = "cof_admin_audit_log";
const MAX = 1000;

export type AuditCategory =
  | "sales" | "forum" | "credits" | "members" | "keys" | "phone"
  | "settings" | "auth" | "store" | "payments" | "other";

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  category: AuditCategory;
  target?: string;
  details?: string;
  createdAt: number;
};

function read(): AuditEntry[] {
  try {
    if (typeof window === "undefined") return [];
    return JSON.parse(window.localStorage.getItem(KEY) || "[]") as AuditEntry[];
  } catch {
    return [];
  }
}

function write(list: AuditEntry[]) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function logAdminAction(input: {
  actor: string;
  action: string;
  category?: AuditCategory;
  target?: string;
  details?: string;
}): AuditEntry {
  const entry: AuditEntry = {
    id: uuid(),
    createdAt: Date.now(),
    category: input.category ?? "other",
    actor: input.actor,
    action: input.action,
    target: input.target,
    details: input.details,
  };
  write([entry, ...read()]);
  pushAudit(entry);
  return entry;
}

export function getAuditLog(filter?: { category?: AuditCategory | "all"; search?: string }): AuditEntry[] {
  let list = read().sort((a, b) => b.createdAt - a.createdAt);
  if (filter?.category && filter.category !== "all") list = list.filter((e) => e.category === filter.category);
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter((e) =>
      [e.actor, e.action, e.target, e.details].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }
  return list;
}

export function clearAuditLog() {
  write([]);
}

export function auditLogCsv(): string {
  const rows = getAuditLog().map((e) =>
    [new Date(e.createdAt).toISOString(), e.actor, e.category, e.action, e.target ?? "", (e.details ?? "").replace(/"/g, "'")]
      .map((v) => `"${v}"`)
      .join(","),
  );
  return ["\"time\",\"actor\",\"category\",\"action\",\"target\",\"details\"", ...rows].join("\n");
}
