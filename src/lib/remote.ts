// Backend sync layer.
//
// Every feature lib keeps a synchronous localStorage cache (so the UI stays
// instant) but the database is the source of truth: `pullAll()` hydrates the
// caches on boot / sign-in, and each write calls the matching `push*()` here.

import { supabase } from "@/integrations/supabase/client";

const K = {
  users: "cof_local_users",
  ledger: "cof_credit_ledger",
  posts: "cof_forum_posts",
  unlocks: "cof_forum_unlocks",
  reports: "cof_forum_reports",
  sales: "cof_sales_v1",
  phone: "cof_phone_requests",
  audit: "cof_admin_audit_log",
} as const;

export function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "00000000-0000-4000-8000-" + Date.now().toString(16).padStart(12, "0");
}

function get<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Fire-and-forget wrapper — the UI never blocks on a sync. */
function bg(work: () => Promise<unknown>) {
  if (typeof window === "undefined") return;
  void work().catch((err) => console.warn("[sync]", err));
}

const ms = (v: string | null | undefined) => (v ? new Date(v).getTime() : Date.now());
const iso = (v: number | null | undefined) => new Date(v ?? Date.now()).toISOString();

// ── PULL ──────────────────────────────────────────────────────────────────────

let pulling: Promise<void> | null = null;

export function pullAll(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  pulling = doPull().catch((err) => console.warn("[sync] pull failed", err));
  return pulling;
}

async function doPull() {
  const [posts, replies, sales, unlocks, reports, phone, audit, profiles, ledger] = await Promise.all([
    supabase.from("forum_posts").select("*").order("created_at", { ascending: false }),
    supabase.from("forum_replies").select("*").order("created_at", { ascending: true }),
    supabase.from("product_sales").select("*"),
    supabase.from("forum_unlocks").select("*"),
    supabase.from("forum_reports").select("*").order("created_at", { ascending: false }),
    supabase.from("phone_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("credit_ledger").select("*").order("created_at", { ascending: false }).limit(500),
  ]);

  if (posts.data) {
    const byPost = new Map<string, any[]>();
    for (const r of replies.data ?? []) {
      const list = byPost.get(r.post_id) ?? [];
      list.push({
        id: r.id,
        authorId: r.author_id ?? "",
        authorName: r.author_name,
        body: r.body,
        createdAt: ms(r.created_at),
        removed: r.is_removed,
      });
      byPost.set(r.post_id, list);
    }
    set(
      K.posts,
      posts.data.map((p) => ({
        id: p.id,
        categoryId: p.category,
        authorId: p.author_id ?? "",
        authorName: p.author_name,
        title: p.title,
        body: p.body,
        pinned: p.is_pinned,
        locked: p.is_locked,
        removed: p.is_removed,
        views: p.views,
        createdAt: ms(p.created_at),
        updatedAt: ms(p.updated_at),
        replies: byPost.get(p.id) ?? [],
      })),
    );
  }

  if (sales.data) {
    set(
      K.sales,
      sales.data.map((s) => ({
        id: s.id,
        itemId: s.product_id,
        label: s.label ?? "",
        percentOff: s.percent_off,
        active: s.active,
        startsAt: s.starts_at,
        endsAt: s.ends_at,
        createdBy: s.created_by,
        createdAt: s.created_at,
      })),
    );
  }

  if (unlocks.data) {
    const map: Record<string, true> = {};
    for (const u of unlocks.data) map[`${u.user_id}:${u.post_id}:${u.link_index}`] = true;
    set(K.unlocks, map);
  }

  if (reports.data) {
    const titles = new Map((posts.data ?? []).map((p) => [p.id, p.title]));
    set(
      K.reports,
      reports.data.map((r) => ({
        id: r.id,
        postId: r.post_id ?? "",
        postTitle: titles.get(r.post_id ?? "") ?? "(post removed)",
        reporter: r.reporter_id ?? "member",
        reason: r.reason,
        createdAt: ms(r.created_at),
        handled: r.resolved,
      })),
    );
  }

  if (phone.data) {
    set(
      K.phone,
      phone.data.map((r) => ({
        id: r.id,
        userId: r.user_id,
        username: r.username,
        email: r.email ?? undefined,
        discord: r.discord ?? undefined,
        note: r.note ?? undefined,
        status: r.status,
        createdAt: ms(r.created_at),
        decidedAt: r.decided_at ? ms(r.decided_at) : undefined,
      })),
    );
  }

  if (audit.data) {
    set(
      K.audit,
      audit.data.map((a) => ({
        id: a.id,
        actor: a.actor,
        action: a.action,
        category: a.category,
        target: a.target ?? undefined,
        details: a.details ?? undefined,
        createdAt: ms(a.created_at),
      })),
    );
  }

  if (profiles.data && profiles.data.length) {
    const { data: roleRows } = await supabase.from("user_roles").select("user_id, role");
    const staff = new Set((roleRows ?? []).filter((r) => r.role !== "member").map((r) => r.user_id));
    set(
      K.users,
      profiles.data.map((p) => ({
        id: p.user_id,
        email: p.email ?? "",
        password: "",
        display_name: p.display_name ?? p.email ?? "Member",
        credits: p.credits,
        is_banned: p.is_banned,
        role: staff.has(p.user_id) ? "admin" : "member",
        created_at: p.created_at,
      })),
    );
  }

  if (ledger.data) {
    set(
      K.ledger,
      ledger.data.map((e) => ({
        id: e.id,
        userId: e.user_id,
        amount: e.amount,
        reason: e.reason,
        meta: e.meta ?? undefined,
        createdAt: ms(e.created_at),
      })),
    );
  }
}

// ── PUSH ──────────────────────────────────────────────────────────────────────

export function pushPost(post: any) {
  if (!isUuid(post?.id)) return;
  bg(async () => {
    await supabase.from("forum_posts").upsert({
      id: post.id,
      author_id: isUuid(post.authorId) ? post.authorId : null,
      author_name: post.authorName ?? "Member",
      category: post.categoryId,
      title: post.title,
      body: post.body,
      is_pinned: !!post.pinned,
      is_locked: !!post.locked,
      is_removed: !!post.removed,
      views: post.views ?? 0,
      created_at: iso(post.createdAt),
    });
  });
}

export function deletePostRemote(postId: string) {
  if (!isUuid(postId)) return;
  bg(async () => {
    await supabase.from("forum_posts").delete().eq("id", postId);
  });
}

export function pushReply(postId: string, reply: any) {
  if (!isUuid(postId) || !isUuid(reply?.id)) return;
  bg(async () => {
    await supabase.from("forum_replies").upsert({
      id: reply.id,
      post_id: postId,
      author_id: isUuid(reply.authorId) ? reply.authorId : null,
      author_name: reply.authorName ?? "Member",
      body: reply.body,
      is_removed: !!reply.removed,
      created_at: iso(reply.createdAt),
    });
  });
}

export function deleteReplyRemote(replyId: string) {
  if (!isUuid(replyId)) return;
  bg(async () => {
    await supabase.from("forum_replies").delete().eq("id", replyId);
  });
}

export function pushUnlock(userId: string, postId: string, linkIndex: number, price: number) {
  if (!isUuid(userId) || !isUuid(postId)) return;
  bg(async () => {
    await supabase.from("forum_unlocks").upsert(
      { user_id: userId, post_id: postId, link_index: linkIndex, price_paid: price },
      { onConflict: "post_id,user_id,link_index" },
    );
  });
}

export function pushSale(sale: any) {
  if (!isUuid(sale?.id)) return;
  bg(async () => {
    await supabase.from("product_sales").upsert({
      id: sale.id,
      product_id: sale.itemId,
      label: sale.label,
      percent_off: sale.percentOff,
      active: sale.active,
      starts_at: sale.startsAt,
      ends_at: sale.endsAt,
      created_by: sale.createdBy ?? "staff",
    });
  });
}

export function deleteSaleRemote(id: string) {
  if (!isUuid(id)) return;
  bg(async () => {
    await supabase.from("product_sales").delete().eq("id", id);
  });
}

export function pushPhoneRequest(req: any) {
  if (!isUuid(req?.id) || !isUuid(req?.userId)) return;
  bg(async () => {
    await supabase.from("phone_requests").upsert({
      id: req.id,
      user_id: req.userId,
      username: req.username ?? "",
      email: req.email ?? null,
      discord: req.discord ?? null,
      note: req.note ?? null,
      status: req.status,
      decided_at: req.decidedAt ? iso(req.decidedAt) : null,
      created_at: iso(req.createdAt),
    });
  });
}

export function deletePhoneRequestRemote(id: string) {
  if (!isUuid(id)) return;
  bg(async () => {
    await supabase.from("phone_requests").delete().eq("id", id);
  });
}

export function pushReport(report: any) {
  if (!isUuid(report?.id)) return;
  bg(async () => {
    const { data } = await supabase.auth.getUser();
    await supabase.from("forum_reports").upsert({
      id: report.id,
      post_id: isUuid(report.postId) ? report.postId : null,
      reporter_id: data.user?.id ?? null,
      reason: report.reason,
      resolved: !!report.handled,
    });
  });
}

export function pushAudit(entry: any) {
  if (!isUuid(entry?.id)) return;
  bg(async () => {
    const { data } = await supabase.auth.getUser();
    await supabase.from("admin_audit_log").insert({
      id: entry.id,
      actor_id: data.user?.id ?? null,
      actor: entry.actor,
      action: entry.action,
      category: entry.category,
      target: entry.target ?? null,
      details: entry.details ?? null,
    });
  });
}

/** Credits move through a database function so the balance and ledger stay in step. */
export function pushCredits(userId: string, delta: number, reason: string, meta?: string) {
  if (!isUuid(userId) || !delta) return;
  bg(async () => {
    await supabase.rpc("apply_credits", { _user_id: userId, _amount: delta, _reason: reason, _meta: meta ?? undefined });
  });
}

export function pushProfile(userId: string, patch: { credits?: number; is_banned?: boolean; display_name?: string; discord?: string }) {
  if (!isUuid(userId)) return;
  bg(async () => {
    await supabase.from("profiles").update(patch).eq("user_id", userId);
  });
}

export function deleteProfileRemote(userId: string) {
  if (!isUuid(userId)) return;
  bg(async () => {
    await supabase.from("profiles").delete().eq("user_id", userId);
  });
}

export function setRoleRemote(userId: string, role: "member" | "admin") {
  if (!isUuid(userId)) return;
  bg(async () => {
    if (role === "admin") {
      await supabase.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    } else {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    }
  });
}

export function pushPurchase(row: {
  productId: string;
  productName: string;
  kind: string;
  amountCents: number;
  creditsGranted?: number;
  licenseKey?: string | null;
  stripeSessionId?: string | null;
}) {
  bg(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("purchases").insert({
      user_id: data.user.id,
      product_id: row.productId,
      product_name: row.productName,
      kind: row.kind,
      amount_cents: row.amountCents,
      credits_granted: row.creditsGranted ?? 0,
      license_key: row.licenseKey ?? null,
      stripe_session_id: row.stripeSessionId ?? null,
    });
  });
}
