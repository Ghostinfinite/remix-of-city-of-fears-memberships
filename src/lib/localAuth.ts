import { pushProfile, deleteProfileRemote, setRoleRemote } from "./remote";

export type LocalUser = {
  id: string;
  email: string;
  password: string;
  display_name?: string;
  credits: number;
  is_banned: boolean;
  role: "member" | "admin";
  created_at: string;
};

const USERS_KEY = "cof_local_users";
const SESSION_KEY = "cof_local_session";

function uid() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getLocalUsers(): LocalUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveLocalUsers(users: LocalUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getLocalSessionUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  return getLocalUsers().find((u) => u.id === id) || null;
}

export function createLocalMember(
  email: string,
  password: string,
  displayName?: string,
  role: "member" | "admin" = "member",
) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes("@")) throw new Error("Enter a valid email address.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  const users = getLocalUsers();
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error("This member account already exists. Sign in instead.");
  }
  const user: LocalUser = {
    id: uid(),
    email: cleanEmail,
    password,
    display_name: displayName || cleanEmail.split("@")[0],
    credits: 2600,
    is_banned: false,
    role,
    created_at: new Date().toISOString(),
  };
  users.unshift(user);
  saveLocalUsers(users);
  return user;
}

export function signInLocal(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();
  const user = getLocalUsers().find((u) => u.email.toLowerCase() === cleanEmail && u.password === password);
  if (!user) throw new Error("Wrong email or password.");
  if (user.is_banned) throw new Error("This member account is banned.");
  window.localStorage.setItem(SESSION_KEY, user.id);
  return user;
}

export function signOutLocal() {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
}

export function promoteLocalAdmin(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  const users = getLocalUsers();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) throw new Error("Member not found. Create the member account first, then promote it.");
  user.role = "admin";
  saveLocalUsers(users);
  setRoleRemote(user.id, "admin");
}

export function removeLocalAdmin(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  const users = getLocalUsers();
  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) throw new Error("Admin/member not found.");
  user.role = "member";
  saveLocalUsers(users);
  setRoleRemote(user.id, "member");
}

export function addLocalSiteMember(email: string, displayName: string, credits: number) {
  const existing = getLocalUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) throw new Error("Member already exists.");
  const user = createLocalMember(email, "ChangeMe123!", displayName || email);
  // Apply the specified credits amount if different from the default
  if (credits !== 2600) {
    updateLocalMember(user.id, { credits });
  }
  return user;
}

export function updateLocalMember(id: string, patch: Partial<Pick<LocalUser, "credits" | "is_banned" | "display_name">>) {
  const users = getLocalUsers();
  const user = users.find((u) => u.id === id);
  if (!user) throw new Error("Member not found.");
  Object.assign(user, patch);
  saveLocalUsers(users);
  pushProfile(user.id, patch);
}

export function deleteLocalMember(id: string) {
  saveLocalUsers(getLocalUsers().filter((u) => u.id !== id));
  deleteProfileRemote(id);
}

export function isSupabaseFetchError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err || "");
  return (
    msg.toLowerCase().includes("failed to fetch") ||
    msg.toLowerCase().includes("fetch failed") ||
    msg.toLowerCase().includes("placeholder.supabase") ||
    msg.toLowerCase().includes("supabase is not configured")
  );
}
