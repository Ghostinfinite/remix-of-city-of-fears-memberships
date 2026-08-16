import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { pullAll } from "@/lib/remote";

export type MemberSession = {
  id: string;
  email: string;
  displayName: string;
  role: "member" | "admin";
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<MemberSession | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load(next: Session | null) {
      if (!active) return;
      setSession(next);
      if (!next?.user) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", next.user.id),
        supabase.from("profiles").select("display_name").eq("user_id", next.user.id).maybeSingle(),
      ]);
      if (!active) return;
      const staff = (roles ?? []).some((r) => r.role === "admin" || r.role === "owner");
      setIsAdmin(staff);
      setUser({
        id: next.user.id,
        email: next.user.email ?? "",
        displayName: profile?.display_name ?? next.user.email?.split("@")[0] ?? "Member",
        role: staff ? "admin" : "member",
      });
      setLoading(false);
      void pullAll();
    }

    supabase.auth.getSession().then(({ data }) => load(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      void load(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user, isAdmin, loading };
}

export async function signOut() {
  await supabase.auth.signOut();
}
