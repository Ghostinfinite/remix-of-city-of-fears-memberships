// FiveM-style community forum with credit-gated links.
//
// Locked links: a poster writes  [locked:250]https://example.com/file[/locked]
// inside their post body. Everyone sees the link is locked; unlocking costs
// 250 credits, which are transferred to the poster. Admins see everything and
// can remove/restore/delete posts and replies.

import { transferCredits } from "./credits";
import { logAdminAction } from "./auditLog";
import {
  pushPost, deletePostRemote, pushReply, deleteReplyRemote,
  pushUnlock, pushReport, uuid,
} from "./remote";

const POSTS_KEY = "cof_forum_posts";
const UNLOCKS_KEY = "cof_forum_unlocks";
const REPORTS_KEY = "cof_forum_reports";

export const FORUM_CATEGORIES = [
  { id: "announcements", name: "Announcements", desc: "Official City of Fears news", staffOnly: true },
  { id: "general", name: "General Discussion", desc: "Talk about anything RP related", staffOnly: false },
  { id: "releases", name: "Releases & Resources", desc: "Scripts, MLOs, liveries — free or credit-locked", staffOnly: false },
  { id: "looking-for", name: "Looking For", desc: "Crews, jobs and departments recruiting", staffOnly: false },
  { id: "support", name: "Help & Support", desc: "Stuck? Ask the community", staffOnly: false },
  { id: "market", name: "Player Market", desc: "Trade in-game goods for credits", staffOnly: false },
] as const;

export type ForumCategoryId = (typeof FORUM_CATEGORIES)[number]["id"];

export type ForumReply = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: number;
  removed: boolean;
};

export type ForumPost = {
  id: string;
  categoryId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  pinned: boolean;
  locked: boolean;      // locked = no new replies
  removed: boolean;     // hidden by an admin
  removedReason?: string;
  views: number;
  createdAt: number;
  updatedAt: number;
  replies: ForumReply[];
};

export type LockedLink = { index: number; price: number; url: string; raw: string };

// ── storage ───────────────────────────────────────────────────────────────────

function readPosts(): ForumPost[] {
  try {
    if (typeof window === "undefined") return [];
    return JSON.parse(window.localStorage.getItem(POSTS_KEY) || "[]") as ForumPost[];
  } catch {
    return [];
  }
}

function writePosts(list: ForumPost[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(POSTS_KEY, JSON.stringify(list));
}

function readUnlocks(): Record<string, true> {
  try {
    if (typeof window === "undefined") return {};
    return JSON.parse(window.localStorage.getItem(UNLOCKS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeUnlocks(map: Record<string, true>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(UNLOCKS_KEY, JSON.stringify(map));
}

// ── locked link parsing ───────────────────────────────────────────────────────

const LOCKED_RE = /\[locked(?::\s*(\d+))?\]([\s\S]*?)\[\/locked\]/gi;

export function parseLockedLinks(body: string, defaultPrice = 100): LockedLink[] {
  const out: LockedLink[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(LOCKED_RE.source, "gi");
  let i = 0;
  while ((m = re.exec(body))) {
    out.push({
      index: i++,
      price: m[1] ? Math.max(1, parseInt(m[1], 10)) : defaultPrice,
      url: m[2].trim(),
      raw: m[0],
    });
  }
  return out;
}

/** Body with every [locked]...[/locked] block replaced by a placeholder token. */
export function bodyWithoutLockedLinks(body: string): string {
  return body.replace(new RegExp(LOCKED_RE.source, "gi"), "").trim();
}

export function unlockKey(userId: string, postId: string, index: number) {
  return `${userId}:${postId}:${index}`;
}

export function hasUnlocked(userId: string, postId: string, index: number): boolean {
  return Boolean(readUnlocks()[unlockKey(userId, postId, index)]);
}

export function unlockLink(userId: string, postId: string, index: number): { ok: boolean; error?: string; url?: string } {
  const post = readPosts().find((p) => p.id === postId);
  if (!post) return { ok: false, error: "Post not found." };
  const link = parseLockedLinks(post.body)[index];
  if (!link) return { ok: false, error: "Locked link not found." };
  if (post.authorId === userId) return { ok: true, url: link.url };
  if (hasUnlocked(userId, postId, index)) return { ok: true, url: link.url };

  const result = transferCredits(userId, post.authorId, link.price, `Unlocked link in "${post.title}"`);
  if (!result.ok) return { ok: false, error: result.error };

  const map = readUnlocks();
  map[unlockKey(userId, postId, index)] = true;
  writeUnlocks(map);
  pushUnlock(userId, postId, index, link.price);
  return { ok: true, url: link.url };
}

export function unlockCount(postId: string, index: number): number {
  const suffix = `:${postId}:${index}`;
  return Object.keys(readUnlocks()).filter((k) => k.endsWith(suffix)).length;
}

// ── reading ───────────────────────────────────────────────────────────────────

export function getPosts(opts?: { categoryId?: string; includeRemoved?: boolean; search?: string }): ForumPost[] {
  let list = readPosts();
  if (!opts?.includeRemoved) list = list.filter((p) => !p.removed);
  if (opts?.categoryId) list = list.filter((p) => p.categoryId === opts.categoryId);
  if (opts?.search) {
    const q = opts.search.toLowerCase();
    list = list.filter((p) => (p.title + " " + p.body + " " + p.authorName).toLowerCase().includes(q));
  }
  return list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt);
}

export function getPost(id: string): ForumPost | null {
  return readPosts().find((p) => p.id === id) ?? null;
}

export function bumpViews(id: string) {
  const list = readPosts();
  const post = list.find((p) => p.id === id);
  if (!post) return;
  post.views += 1;
  writePosts(list);
  pushPost(post);
}

// ── writing ───────────────────────────────────────────────────────────────────

export const POST_COST = 25; // credits to open a new thread

export function createPost(opts: {
  categoryId: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  isStaff?: boolean;
  pinned?: boolean;
}): { ok: boolean; error?: string; post?: ForumPost } {
  const title = opts.title.trim();
  const body = opts.body.trim();
  if (title.length < 4) return { ok: false, error: "Give your post a longer title." };
  if (body.length < 4) return { ok: false, error: "Write something in the post body." };

  const cat = FORUM_CATEGORIES.find((c) => c.id === opts.categoryId);
  if (cat?.staffOnly && !opts.isStaff) return { ok: false, error: "Only staff can post in that category." };

  const post: ForumPost = {
    id: uuid(),
    categoryId: opts.categoryId,
    authorId: opts.authorId,
    authorName: opts.authorName,
    title,
    body,
    pinned: Boolean(opts.pinned),
    locked: false,
    removed: false,
    views: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    replies: [],
  };
  writePosts([post, ...readPosts()]);
  pushPost(post);
  if (opts.isStaff) {
    logAdminAction({ actor: opts.authorName, category: "forum", action: "Created post", target: title });
  }
  return { ok: true, post };
}

export function addReply(postId: string, authorId: string, authorName: string, body: string): { ok: boolean; error?: string } {
  const list = readPosts();
  const post = list.find((p) => p.id === postId);
  if (!post) return { ok: false, error: "Post not found." };
  if (post.locked) return { ok: false, error: "This thread is locked." };
  if (body.trim().length < 2) return { ok: false, error: "Write a reply first." };
  const reply = {
    id: uuid(),
    authorId, authorName, body: body.trim(), createdAt: Date.now(), removed: false,
  };
  post.replies.push(reply);
  post.updatedAt = Date.now();
  writePosts(list);
  pushReply(postId, reply);
  return { ok: true };
}

export function editPost(postId: string, patch: Partial<Pick<ForumPost, "title" | "body" | "categoryId">>) {
  const list = readPosts();
  const post = list.find((p) => p.id === postId);
  if (!post) return;
  Object.assign(post, patch, { updatedAt: Date.now() });
  writePosts(list);
  pushPost(post);
}

// ── moderation ────────────────────────────────────────────────────────────────

export function setPostFlag(postId: string, flag: "pinned" | "locked", value: boolean, actor: string) {
  const list = readPosts();
  const post = list.find((p) => p.id === postId);
  if (!post) return;
  post[flag] = value;
  writePosts(list);
  pushPost(post);
  logAdminAction({
    actor, category: "forum",
    action: `${value ? "Enabled" : "Disabled"} ${flag} on post`,
    target: post.title,
  });
}

export function removePost(postId: string, actor: string, reason = "") {
  const list = readPosts();
  const post = list.find((p) => p.id === postId);
  if (!post) return;
  post.removed = true;
  post.removedReason = reason;
  writePosts(list);
  pushPost(post);
  logAdminAction({ actor, category: "forum", action: "Removed post", target: post.title, details: reason });
}

export function restorePost(postId: string, actor: string) {
  const list = readPosts();
  const post = list.find((p) => p.id === postId);
  if (!post) return;
  post.removed = false;
  post.removedReason = "";
  writePosts(list);
  pushPost(post);
  logAdminAction({ actor, category: "forum", action: "Restored post", target: post.title });
}

export function deletePostForever(postId: string, actor: string) {
  const post = readPosts().find((p) => p.id === postId);
  writePosts(readPosts().filter((p) => p.id !== postId));
  deletePostRemote(postId);
  if (post) logAdminAction({ actor, category: "forum", action: "Deleted post permanently", target: post.title });
}

export function removeReply(postId: string, replyId: string, actor: string) {
  const list = readPosts();
  const post = list.find((p) => p.id === postId);
  const reply = post?.replies.find((r) => r.id === replyId);
  if (!post || !reply) return;
  reply.removed = true;
  writePosts(list);
  pushReply(postId, reply);
  logAdminAction({ actor, category: "forum", action: "Removed reply", target: post.title, details: reply.authorName });
}

export function deleteReply(postId: string, replyId: string, actor: string) {
  const list = readPosts();
  const post = list.find((p) => p.id === postId);
  if (!post) return;
  post.replies = post.replies.filter((r) => r.id !== replyId);
  writePosts(list);
  deleteReplyRemote(replyId);
  logAdminAction({ actor, category: "forum", action: "Deleted reply", target: post.title });
}

// ── reports ───────────────────────────────────────────────────────────────────

export type ForumReport = {
  id: string;
  postId: string;
  postTitle: string;
  reporter: string;
  reason: string;
  createdAt: number;
  handled: boolean;
};

export function getReports(): ForumReport[] {
  try {
    if (typeof window === "undefined") return [];
    return (JSON.parse(window.localStorage.getItem(REPORTS_KEY) || "[]") as ForumReport[])
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function writeReports(list: ForumReport[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REPORTS_KEY, JSON.stringify(list.slice(0, 300)));
}

export function reportPost(postId: string, reporter: string, reason: string) {
  const post = getPost(postId);
  const report = {
    id: uuid(),
    postId, postTitle: post?.title ?? postId, reporter,
    reason: reason.trim() || "No reason given", createdAt: Date.now(), handled: false,
  };
  writeReports([report, ...getReports()]);
  pushReport(report);
}

export function markReportHandled(id: string, actor: string) {
  const list = getReports();
  const report = list.find((r) => r.id === id);
  if (!report) return;
  report.handled = true;
  writeReports(list);
  pushReport(report);
  logAdminAction({ actor, category: "forum", action: "Handled report", target: report.postTitle });
}

export function forumStats() {
  const posts = readPosts();
  return {
    total: posts.length,
    visible: posts.filter((p) => !p.removed).length,
    removed: posts.filter((p) => p.removed).length,
    replies: posts.reduce((s, p) => s + p.replies.length, 0),
    lockedLinks: posts.reduce((s, p) => s + parseLockedLinks(p.body).length, 0),
    openReports: getReports().filter((r) => !r.handled).length,
  };
}
