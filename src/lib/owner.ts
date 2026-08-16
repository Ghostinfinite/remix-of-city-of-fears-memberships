import { supabase } from "@/integrations/supabase/client";
import { ownerSignIn } from "./ownerAccount.functions";
import { OWNER_USERNAME, OWNER_PASSWORD, OWNER_EMAIL } from "./ownerConstants";

export { OWNER_USERNAME, OWNER_PASSWORD, OWNER_EMAIL };
export const OWNER_SESSION_KEY = "cof_owner_session";
export const OWNER_USERNAME_KEY = "cof_owner_username";
export const OWNER_PASSWORD_KEY = "cof_owner_password";

export function isOwnerSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(OWNER_SESSION_KEY) === "true";
}

/**
 * Owner login: the username/password is checked on the server, which also
 * provisions the real backend account carrying the owner role.
 */
export async function ownerLogin(username: string, password: string): Promise<boolean> {
  try {
    const result = await ownerSignIn({ data: { username, password } });
    if (!result.ok) {
      console.error("[owner] sign-in rejected:", result.error);
      return false;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: result.email,
      password: result.password,
    });
    if (error) {
      console.error("[owner] session error:", error.message);
      return false;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(OWNER_SESSION_KEY, "true");
      window.localStorage.setItem(OWNER_USERNAME_KEY, username);
      window.localStorage.setItem(OWNER_PASSWORD_KEY, password);
    }
    return true;
  } catch (err) {
    console.error("[owner] login failed:", err);
    return false;
  }
}

export function getOwnerCredentials() {
  if (typeof window === "undefined") return { username: OWNER_USERNAME, password: OWNER_PASSWORD };
  return {
    username: window.localStorage.getItem(OWNER_USERNAME_KEY) || OWNER_USERNAME,
    password: window.localStorage.getItem(OWNER_PASSWORD_KEY) || OWNER_PASSWORD,
  };
}

export function ownerLogout() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(OWNER_SESSION_KEY);
    window.localStorage.removeItem(OWNER_USERNAME_KEY);
    window.localStorage.removeItem(OWNER_PASSWORD_KEY);
  }
  void supabase.auth.signOut();
}
