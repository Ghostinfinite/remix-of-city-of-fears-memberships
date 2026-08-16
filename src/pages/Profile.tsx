import { Link } from "@/lib/wouter-compat";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Coins, Gift, KeyRound, Lock, LogOut, MessageCircle, Package, Shield, Sparkles, Ticket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ownerLogout } from "@/lib/owner";
import { signOutLocal } from "@/lib/localAuth";
import {
  ALL_PACKS,
  ALL_TIERS,
  createSupportTicket,
  getUnlockedContent,
  getUserMembership,
  getUserRedeemedPacks,
  getUserTickets,
  hasUsedTrial,
  redeemLicenseKey,
  type PackName,
  type TierName,
  type TicketType,
} from "@/lib/licenseKeys";

const inputCls = "w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none";
const cardCls = "rounded-lg border border-border bg-card p-6";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [keyInput, setKeyInput] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [ticketType, setTicketType] = useState<TicketType>("purchase_request");
  const [requestedItemType, setRequestedItemType] = useState<"membership" | "pack" | "credits">("membership");
  const [requestedMembership, setRequestedMembership] = useState<TierName>("Silver");
  const [requestedPack, setRequestedPack] = useState<PackName>("Rookie Welcome Pack");
  const [creditPack, setCreditPack] = useState("10,000 Casino Credits");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const userId = user?.id ?? "";
  const email = user?.email ?? "member@local";
  const membership = useMemo(() => userId ? getUserMembership(userId) : null, [userId, refresh]);
  const packs = useMemo(() => userId ? getUserRedeemedPacks(userId) : [], [userId, refresh]);
  const tickets = useMemo(() => userId ? getUserTickets(userId) : [], [userId, refresh]);
  const unlocked = useMemo(() => userId ? getUnlockedContent(userId) : [], [userId, refresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const request = params.get("request");
    const type = params.get("type") as "membership" | "pack" | "credits" | null;
    if (!request) return;
    setTicketType("purchase_request");
    if (type === "credits") {
      setRequestedItemType("credits");
      setCreditPack(request);
    } else if (type === "pack") {
      setRequestedItemType("pack");
      setRequestedPack(request as PackName);
    } else {
      setRequestedItemType("membership");
      setRequestedMembership(request as TierName);
    }
    setSubject(`Purchase approval request: ${request}`);
    setBody(`I want to request owner/admin approval and a unique license key for ${request}.`);
  }, []);
  const credits = Number(localStorage.getItem("cof_credits") || "2500");

  function redeem() {
    if (!userId) return toast.error("Sign in first");
    const result = redeemLicenseKey(keyInput, userId);
    if (!result.ok) return toast.error(result.error);
    if (result.type === "credits") {
      const next = credits + (result.creditsAmount ?? 0);
      localStorage.setItem("cof_credits", String(next));
      toast.success(`Redeemed ${(result.creditsAmount ?? 0).toLocaleString()} casino credits`);
    } else if (result.type === "pack") {
      toast.success(`Redeemed ${result.packName}`);
    } else {
      toast.success(`Activated ${result.tier} for 3 days`);
    }
    setKeyInput("");
    setRefresh(x => x + 1);
  }

  function submitTicket() {
    if (!userId) return toast.error("Sign in first");
    const item = ticketType === "purchase_request"
      ? requestedItemType === "membership" ? requestedMembership : requestedItemType === "pack" ? requestedPack : creditPack
      : null;
    const finalSubject = subject.trim() || (ticketType === "purchase_request" ? `Purchase request: ${item}` : "Support request");
    const finalBody = body.trim() || (ticketType === "purchase_request" ? `I want to request approval and a license key for ${item}.` : "I need support.");
    createSupportTicket({
      userId,
      userEmail: email,
      type: ticketType,
      subject: finalSubject,
      body: finalBody,
      requestedItem: item ?? undefined,
      requestedItemType: ticketType === "purchase_request" ? requestedItemType : undefined,
    });
    setSubject("");
    setBody("");
    setRefresh(x => x + 1);
    toast.success("Support ticket created. Admin/owner can approve it and assign a license key.");
  }

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>;
  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center px-4 bg-background">
        <div className={cardCls + " max-w-md text-center"}>
          <Lock className="mx-auto text-primary" size={40} />
          <h1 className="mt-4 text-3xl font-black uppercase">Profile Locked</h1>
          <p className="mt-2 text-muted-foreground">Sign in to redeem license keys, request purchases, and view exclusive content.</p>
          <Link href="/auth" className="mt-5 inline-block px-5 py-3 rounded bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10" style={{ background: "var(--gradient-dark)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase">My Profile</h1>
            <p className="text-muted-foreground">{email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="px-4 py-2 rounded border border-border bg-secondary text-xs font-black uppercase tracking-widest">Back Home</Link>
            <button
              onClick={async () => {
                ownerLogout();
                signOutLocal();
                await supabase.auth.signOut().catch(() => undefined);
                window.location.href = "/";
              }}
              className="flex items-center gap-2 px-4 py-2 rounded border border-border bg-secondary text-xs font-black uppercase tracking-widest hover:bg-accent transition"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className={cardCls}><Shield className="text-primary mb-2" /><div className="text-xs uppercase text-muted-foreground">Membership</div><div className="text-2xl font-black">{membership ? membership.tier : "None"}</div>{membership && <div className="text-xs text-muted-foreground">Expires {new Date(membership.expiresAt).toLocaleString()}</div>}</div>
          <div className={cardCls}><Coins className="text-primary mb-2" /><div className="text-xs uppercase text-muted-foreground">Casino Credits</div><div className="text-2xl font-black">{credits.toLocaleString()}</div><div className="text-xs text-muted-foreground">Credit packs need an admin/owner-approved key.</div></div>
          <div className={cardCls}><Gift className="text-primary mb-2" /><div className="text-xs uppercase text-muted-foreground">Free Trial</div><div className="text-2xl font-black">{hasUsedTrial(userId) ? "Used" : "Available"}</div><div className="text-xs text-muted-foreground">One free 3-day trial per account.</div></div>
        </div>

        <section className={cardCls}>
          <div className="flex items-center gap-2 mb-3"><KeyRound className="text-primary" /><h2 className="text-xl font-black uppercase">Redeem License Key</h2></div>
          <p className="text-sm text-muted-foreground mb-4">Membership keys activate 3-day access. Pack and casino credit keys unlock their exact item. Every purchase requires its own license key from an admin or owner.</p>
          <div className="flex flex-col md:flex-row gap-3">
            <input placeholder="COF-XXXX-XXXX-XXXX-XXXX" value={keyInput} onChange={e => setKeyInput(e.target.value)} className={inputCls + " font-mono uppercase"} />
            <button onClick={redeem} className="px-5 py-2 rounded bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest whitespace-nowrap"><CheckCircle2 size={14} className="inline mr-1" />Redeem</button>
          </div>
        </section>

        <section className={cardCls}>
          <div className="flex items-center gap-2 mb-3"><Ticket className="text-primary" /><h2 className="text-xl font-black uppercase">Support Tickets / Purchase Requests</h2></div>
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <select value={ticketType} onChange={e => setTicketType(e.target.value as TicketType)} className={inputCls}><option value="purchase_request">Purchase / License Request</option><option value="support">Support</option><option value="appeal">Appeal</option><option value="other">Other</option></select>
            {ticketType === "purchase_request" && <select value={requestedItemType} onChange={e => setRequestedItemType(e.target.value as any)} className={inputCls}><option value="membership">Membership</option><option value="pack">Item / Pack</option><option value="credits">Casino Credits</option></select>}
            {ticketType === "purchase_request" && requestedItemType === "membership" && <select value={requestedMembership} onChange={e => setRequestedMembership(e.target.value as TierName)} className={inputCls}>{ALL_TIERS.map(t => <option key={t}>{t}</option>)}</select>}
            {ticketType === "purchase_request" && requestedItemType === "pack" && <select value={requestedPack} onChange={e => setRequestedPack(e.target.value as PackName)} className={inputCls}>{ALL_PACKS.map(p => <option key={p}>{p}</option>)}</select>}
            {ticketType === "purchase_request" && requestedItemType === "credits" && <select value={creditPack} onChange={e => setCreditPack(e.target.value)} className={inputCls}>{["5,000 Casino Credits", "10,000 Casino Credits", "25,000 Casino Credits", "50,000 Casino Credits", "100,000 Casino Credits"].map(p => <option key={p}>{p}</option>)}</select>}
          </div>
          <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className={inputCls + " mb-3"} />
          <textarea placeholder="Message to admin/owner" value={body} onChange={e => setBody(e.target.value)} className={inputCls + " min-h-24 mb-3"} />
          <button onClick={submitTicket} className="px-5 py-3 rounded bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest"><MessageCircle size={14} className="inline mr-1" />Create Ticket</button>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-3"><Package className="text-primary" /><h2 className="text-xl font-black uppercase">Unlocked Packs</h2></div>
            {packs.length === 0 ? <p className="text-sm text-muted-foreground">No packs redeemed yet.</p> : packs.map(p => <div key={p.keyUsed} className="rounded border border-border p-3 mb-2"><b>{p.packName}</b><div className="text-xs text-muted-foreground">Redeemed {new Date(p.redeemedAt).toLocaleString()}</div></div>)}
          </div>
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-3"><Ticket className="text-primary" /><h2 className="text-xl font-black uppercase">My Tickets</h2></div>
            {tickets.length === 0 ? <p className="text-sm text-muted-foreground">No tickets yet.</p> : tickets.map(t => <div key={t.id} className="rounded border border-border p-3 mb-2"><div className="font-bold">{t.subject}</div><div className="text-xs text-muted-foreground">{t.status} · {new Date(t.createdAt).toLocaleString()}</div>{t.assignedKey && <code className="mt-2 block text-xs text-green-300">Key: {t.assignedKey}</code>}{t.replies.map(r => <p key={r.id} className="mt-2 text-xs bg-secondary rounded p-2">{r.author}: {r.body}</p>)}</div>)}
          </div>
        </section>

        <section className={cardCls}>
          <div className="flex items-center gap-2 mb-3"><Sparkles className="text-primary" /><h2 className="text-xl font-black uppercase">Special Content</h2></div>
          <p className="text-sm text-muted-foreground mb-4">Content unlocks from your active membership or redeemed item packs.</p>
          {unlocked.length === 0 ? <p className="text-sm text-muted-foreground">No exclusive content unlocked yet. Redeem a license key or request a purchase.</p> : <div className="grid md:grid-cols-2 gap-3">{unlocked.map(c => <div key={c.id} className="rounded border border-border p-4"><div className="font-black">{c.icon} {c.title}</div><p className="text-xs text-muted-foreground mt-1">{c.description}</p><pre className="mt-3 whitespace-pre-wrap rounded bg-secondary p-3 text-xs">{c.content}</pre></div>)}</div>}
        </section>
      </div>
    </main>
  );
}
