import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Smartphone, ShieldCheck, Lock, Loader2, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { notifyAdminsOfPhoneRequest } from "@/lib/phoneNotify.functions";
import { addAdminNotification } from "@/lib/adminNotifications";
import { isOwnerSession } from "@/lib/owner";
import {
  PHONE_PRICE,
  PHONE_NAME,
  createPhoneRequest,
  getRequestForUser,
  hasPhoneAccess,
  type PhoneRequest,
} from "@/lib/phoneAccess";

export const Route = createFileRoute("/phone")({
  component: PhonePage,
  head: () => ({
    meta: [
      { title: "FiveM Cyber Phone — For Sale $72.99" },
      {
        name: "description",
        content:
          "Premium FiveM Cyber Phone with 50 apps and 100 features. Request access for $72.99 — admin-approved.",
      },
    ],
  }),
});

type Tab = "store" | "phone";

function PhonePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("store");
  const [request, setRequest] = useState<PhoneRequest | undefined>(undefined);
  const [isOwner, setIsOwner] = useState(false);
  const [note, setNote] = useState("");
  const [discord, setDiscord] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userId = user?.id ?? null;
  const email = user?.email;
  const username = email ?? "Guest";

  useEffect(() => {
    const refresh = () => {
      if (userId) setRequest(getRequestForUser(userId));
      setIsOwner(isOwnerSession());
    };
    refresh();
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, [userId]);

  const approved = isOwner || hasPhoneAccess(userId);
  const pending = request?.status === "pending";
  const denied = request?.status === "denied";

  async function handleRequest() {
    if (!userId) {
      toast.error("Please sign in first to request the phone.");
      navigate({ to: "/auth" });
      return;
    }
    setSubmitting(true);
    try {
      const r = createPhoneRequest({ userId, username, email, discord, note });
      setRequest(r);
      addAdminNotification({
        kind: "phone_request",
        title: `Phone request from ${username}`,
        body: discord ? `Discord: ${discord}` : note || undefined,
        link: "/admin",
      });
      try {
        await notifyAdminsOfPhoneRequest({
          data: { username, email, discord, note, price: PHONE_PRICE },
        });
      } catch {
        /* alerts are best-effort; the request itself is saved */
      }
      toast.success("Request sent! An admin will review it shortly.");
    } catch {
      toast.error("Could not send request. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:text-primary transition">
            <ArrowLeft className="h-4 w-4" />
            Back to City of Fears
          </Link>
          <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
            <button
              onClick={() => setTab("store")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition ${tab === "store" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Store
            </button>
            <button
              onClick={() => setTab("phone")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${tab === "phone" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Use Phone
              {approved && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {tab === "store" ? (
          <StoreView
            approved={approved}
            pending={pending}
            denied={denied}
            signedIn={!!user}
            note={note}
            setNote={setNote}
            discord={discord}
            setDiscord={setDiscord}
            submitting={submitting}
            onRequest={handleRequest}
            onOpenPhone={() => setTab("phone")}
          />
        ) : (
          <PhoneView approved={approved} onBack={() => setTab("store")} />
        )}
      </main>
    </div>
  );
}

function StoreView({
  approved, pending, denied, signedIn, note, setNote, discord, setDiscord, submitting, onRequest, onOpenPhone,
}: {
  approved: boolean; pending: boolean; denied: boolean; signedIn: boolean;
  note: string; setNote: (s: string) => void;
  discord: string; setDiscord: (s: string) => void; submitting: boolean;
  onRequest: () => void; onOpenPhone: () => void;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <div className="relative">
        <div className="absolute inset-0 -z-10 blur-3xl opacity-60" style={{ background: "var(--gradient-blood)" }} />
        <div className="relative mx-auto aspect-square w-full max-w-md rounded-3xl border border-border bg-secondary/30 flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <Smartphone className="mx-auto h-24 w-24 text-primary drop-shadow-[0_0_30px_rgba(220,38,38,0.6)]" />
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">50 Apps · 100 Features</p>
          </div>
        </div>
      </div>

      <div>
        <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-primary">For Sell</span>
        <h1 className="mt-3 text-4xl font-black tracking-tight lg:text-5xl">{PHONE_NAME}</h1>
        <p className="mt-3 text-muted-foreground">
          A premium in-game phone with 50 apps and 100 features — banking, GPS, social, dispatch, dark web, music, taxi, mechanic, and more. Sold to City of Fears members after admin approval.
        </p>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-5xl font-black text-primary">${PHONE_PRICE.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">one-time</span>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-secondary/30 p-5">
          {approved ? (
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-500/15 p-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-300">Access granted</p>
                <p className="mt-1 text-xs text-muted-foreground">Your purchase has been approved. Open the phone any time.</p>
                <button onClick={onOpenPhone} className="mt-4 inline-flex items-center gap-2 rounded px-5 py-2.5 text-sm font-black uppercase tracking-widest text-primary-foreground" style={{ background: "var(--gradient-blood)" }}>
                  <Smartphone className="h-4 w-4" /> Open Phone
                </button>
              </div>
            </div>
          ) : pending ? (
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-500/15 p-2">
                <Loader2 className="h-5 w-5 text-amber-400 animate-spin" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-300">Awaiting admin approval</p>
                <p className="mt-1 text-xs text-muted-foreground">Your request has been sent. An admin will review it shortly — this page will unlock automatically when approved.</p>
              </div>
            </div>
          ) : (
            <>
              {denied && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-red-300">
                  <X className="h-4 w-4" /> Your previous request was denied. You may submit a new one below.
                </div>
              )}
              <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Your Discord (username or ID)</label>
              <input value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="yourname or 123456789012345678" className="mt-2 mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Optional note for admin</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="In-game name, why you want it, etc." className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <button disabled={submitting} onClick={onRequest} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded px-5 py-3 text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60" style={{ background: "var(--gradient-blood)" }}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {signedIn ? `Request to Purchase — $${PHONE_PRICE.toFixed(2)}` : "Sign in to Request"}
              </button>
              <p className="mt-3 text-[10px] text-muted-foreground">Access is granted manually by an admin after payment is confirmed in Discord. You'll see the phone unlock here automatically, and your Discord phone role is applied on approval.</p>
            </>
          )}
        </div>

        <ul className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          {["50 working apps","Banking & wallet","GPS & navigation","Dispatch & PD radio","Dark web marketplace","Taxi & mechanic call","Music & camera","Custom wallpapers"].map((f) => (
            <li key={f} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" />{f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PhoneView({ approved, onBack }: { approved: boolean; onBack: () => void }) {
  if (!approved) {
    return (
      <div className="mx-auto max-w-md text-center rounded-2xl border border-border bg-secondary/30 p-10">
        <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-black tracking-tight">Locked</h2>
        <p className="mt-2 text-sm text-muted-foreground">You need an approved purchase to use the phone. Request access from the Store tab.</p>
        <button onClick={onBack} className="mt-6 inline-flex items-center gap-2 rounded px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground" style={{ background: "var(--gradient-blood)" }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Store
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <iframe src="/phone.html" title={PHONE_NAME} className="w-full max-w-[420px] h-[820px] border-0 rounded-[52px] shadow-2xl bg-black" />
      <button onClick={onBack} className="mt-6 inline-flex items-center gap-2 rounded border border-border bg-secondary px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-secondary/70">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Store
      </button>
    </div>
  );
}