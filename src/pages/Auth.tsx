import { Link, useLocation } from "@/lib/wouter-compat";
import { useState, useEffect } from "react";
import { Skull } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ownerLogin } from "@/lib/owner";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { session, isAdmin, loading } = useAuth();
  // Default to "signin" — most returning users want to sign in, not create a new account
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");

  useEffect(() => {
    if (!loading && session) {
      navigate(isAdmin ? "/admin" : "/");
    }
  }, [session, isAdmin, loading, navigate]);

  async function handleOwnerLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (await ownerLogin(ownerUsername, ownerPassword)) {
        toast.success("Owner logged in");
        navigate("/admin");
      } else {
        toast.error("Wrong owner username or password");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { display_name: email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Member account created. Sign in to claim your starting credits.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" style={{ background: "var(--gradient-dark)" }}>
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Skull className="text-primary" size={28} />
          <span className="font-black tracking-widest">CITY OF FEARS</span>
        </Link>
        <div className="rounded-lg border border-border bg-card p-8">
          <h1 className="text-2xl font-black uppercase tracking-wide">
            {mode === "signin" ? "Member / Admin Sign In" : "Create Member Account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Members sign in here. Admins can also sign in after the owner promotes them."
              : "Create your member account first. Only the owner can promote members into admins."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full px-4 py-3 rounded text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
              style={{ background: "var(--gradient-blood)", boxShadow: "var(--shadow-blood)" }}
            >
              {busy ? "…" : mode === "signin" ? "Sign In" : "Create Member Account"}
            </button>
          </form>

          <button
            onClick={() => setMode(m => m === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary transition"
          >
            {mode === "signin"
              ? "Need a member account? Create one"
              : "Already have a member or admin account? Sign in"}
          </button>

          <div className="my-6 h-px bg-border" />
          <form onSubmit={handleOwnerLogin} className="space-y-4">
            <div className="text-xs uppercase font-black tracking-widest text-primary">Owner Master Login</div>
            <p className="text-xs text-muted-foreground">
              Owner login unlocks the admin panel and lets the owner create/promote admins.
            </p>
            <input
              required
              placeholder="Owner username"
              value={ownerUsername}
              onChange={e => setOwnerUsername(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none"
            />
            <input
              required
              type="password"
              placeholder="Owner password"
              value={ownerPassword}
              onChange={e => setOwnerPassword(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="w-full px-4 py-3 rounded text-sm font-bold uppercase tracking-widest border border-primary text-primary hover:bg-primary/10"
            >
              Owner Panel Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
