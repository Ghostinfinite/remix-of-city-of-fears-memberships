// In-app admin notification center — stored in localStorage so any admin
// browsing the site sees new phone requests without a page reload.

const KEY = "cof_admin_notifications";

export type AdminNotification = {
  id: string;
  kind: "phone_request" | "phone_approved" | "info";
  title: string;
  body?: string;
  createdAt: number;
  read: boolean;
  link?: string;
};

function read(): AdminNotification[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminNotification[]) : [];
  } catch {
    return [];
  }
}

function write(list: AdminNotification[]) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

export function getAdminNotifications(): AdminNotification[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function unreadAdminCount(): number {
  return read().filter((n) => !n.read).length;
}

export function addAdminNotification(input: {
  kind: AdminNotification["kind"];
  title: string;
  body?: string;
  link?: string;
}): AdminNotification {
  const n: AdminNotification = {
    id: "ntf_" + Math.random().toString(36).slice(2, 10),
    createdAt: Date.now(),
    read: false,
    ...input,
  };
  write([n, ...read()]);
  return n;
}

export function markAdminNotificationRead(id: string) {
  write(read().map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function markAllAdminNotificationsRead() {
  write(read().map((n) => ({ ...n, read: true })));
}

export function deleteAdminNotification(id: string) {
  write(read().filter((n) => n.id !== id));
}

export function clearAdminNotifications() {
  write([]);
}