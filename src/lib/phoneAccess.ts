// Phone purchase requests + access state — stored in the database and
// mirrored locally so the UI stays instant. Admins approve to grant access.

import { pushPhoneRequest, deletePhoneRequestRemote, uuid } from "./remote";

const REQUESTS_KEY = "cof_phone_requests";

export const PHONE_PRICE = 72.99;
export const PHONE_NAME = "FiveM Cyber Phone";

export type PhoneRequestStatus = "pending" | "approved" | "denied";

export type PhoneRequest = {
  id: string;
  userId: string;
  username: string;
  email?: string;
  discord?: string;
  note?: string;
  status: PhoneRequestStatus;
  createdAt: number;
  decidedAt?: number;
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function getPhoneRequests(): PhoneRequest[] {
  return safeGet<PhoneRequest[]>(REQUESTS_KEY, []);
}

function saveRequests(reqs: PhoneRequest[]) {
  safeSet(REQUESTS_KEY, reqs);
}

export function getRequestForUser(userId: string): PhoneRequest | undefined {
  return getPhoneRequests()
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
}

export function createPhoneRequest(input: {
  userId: string;
  username: string;
  email?: string;
  discord?: string;
  note?: string;
}): PhoneRequest {
  const reqs = getPhoneRequests();
  // Reuse an existing pending/approved request rather than spamming new ones.
  const existing = reqs.find(
    (r) => r.userId === input.userId && (r.status === "pending" || r.status === "approved")
  );
  if (existing) return existing;

  const req: PhoneRequest = {
    id: uuid(),
    userId: input.userId,
    username: input.username,
    email: input.email,
    discord: input.discord,
    note: input.note,
    status: "pending",
    createdAt: Date.now(),
  };
  reqs.push(req);
  saveRequests(reqs);
  pushPhoneRequest(req);
  return req;
}

export function decidePhoneRequest(id: string, status: "approved" | "denied") {
  const reqs = getPhoneRequests().map((r) =>
    r.id === id ? { ...r, status, decidedAt: Date.now() } : r
  );
  saveRequests(reqs);
  const updated = reqs.find((r) => r.id === id);
  if (updated) pushPhoneRequest(updated);
}

export function deletePhoneRequest(id: string) {
  saveRequests(getPhoneRequests().filter((r) => r.id !== id));
  deletePhoneRequestRemote(id);
}

export function hasPhoneAccess(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const r = getRequestForUser(userId);
  return r?.status === "approved";
}