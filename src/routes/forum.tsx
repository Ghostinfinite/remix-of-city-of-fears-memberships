import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, Coins, Flag, Lock, MessageSquare, Pin, PlusCircle, Search,
  ShieldAlert, Unlock, Eye,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isOwnerSession } from "@/lib/owner";
import { getBalance } from "@/lib/credits";
import {
  FORUM_CATEGORIES, POST_COST, addReply, bodyWithoutLockedLinks, bumpViews,
  createPost, getPosts, hasUnlocked, parseLockedLinks, reportPost, unlockCount,
  unlockLink, type ForumPost,
} from "@/lib/forum";
import { spendCredits } from "@/lib/credits";

export const Route = createFileRoute("/forum")({
  component: ForumPage,
  head: () => ({
    meta: [
      { title: "Community Forum — City of Fears Roleplay" },
      { name: "description", content: "The City of Fears FiveM forum: releases, crews, support and a player market. Unlock credit-locked downloads with credits." },
      { property: "og:title", content: "City of Fears FiveM Forum" },
      { property: "og:description", content: "Releases, crews, support and credit-locked downloads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ForumPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [owner, setOwner] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postCat, setPostCat] = useState<string>("general");
  const [replyText, setReplyText] = useState("");
  const [balance, setBalance] = useState(0);
  const [tick, setTick] = useState(0);

  const staff = owner || isAdmin;

  useEffect(() => setOwner(isOwnerSession()), []);
  useEffect(() => {
    setPosts(getPosts({ categoryId: category === "all" ? undefined : category, search, includeRemoved: false }));
    if (user) setBalance(getBalance(user.id));
  }, [category, search, user, tick]);

  const openPost = useMemo(() => posts.find((p) => p.id === open) ?? null, [posts, open]);

  function requireUser(): boolean {
    if (!user) {
      toast.error("Sign in to take part in the forum.");
      navigate({ to: "/auth" });
      return false;
    }
    return true;
  }

  function submitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!requireUser() || !user) return;
    if (!staff) {
      const paid = spendCredits(user.id, POST_COST, "Created a forum thread", title);
      if (!paid.ok) { toast.error(paid.error!); return; }
    }
    const res = createPost({
      categoryId: postCat, authorId: user.id, authorName: user.email,
      title, body, isStaff: staff,
    });
    if (!res.ok) { toast.error(res.error!); return; }
    toast.success(staff ? "Post published." : `Post published — ${POST_COST} credits spent.`);
    setTitle(""); setBody(""); setComposing(false); setTick((t) => t + 1);
  }

  function submitReply() {
    if (!requireUser() || !user || !openPost) return;
    const res = addReply(openPost.id, user.id, user.email, replyText);
    if (!res.ok) { toast.error(res.error!); return; }
    setReplyText(""); setTick((t) => t + 1);
  }

  function doUnlock(post: ForumPost, index: number) {
    if (!requireUser() || !user) return;
    const res = unlockLink(user.id, post.id, index);
    if (!res.ok) { toast.error(res.error!); return; }
    toast.success("Link unlocked!");
    setTick((t) => t + 1);
  }

  function doReport(post: ForumPost) {
    if (!requireUser() || !user) return;
    const reason = window.prompt("What is wrong with this post?") ?? "";
    if (!reason) return;
    reportPost(post.id, user.email, reason);
    toast.success("Reported — staff will review it.");
  }

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ backgroundImage: "var(--gradient-dark)" }}>
      <header className="border-b border-border bg-card/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-primary">
            <ArrowLeft size={16} /> City of Fears
          </Link>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/store" className="hover:text-primary uppercase tracking-widest font-bold">Store</Link>
            {user && <span className="flex items-center gap-1 text-primary font-bold"><Coins size={14} />{balance.toLocaleString()}</span>}
            {staff && <Link to="/admin" className="hover:text-primary uppercase tracking-widest font-bold">Admin</Link>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Forum</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Posting costs {POST_COST} credits. Lock a link in your post with <code className="text-primary">[locked:250]https://link[/locked]</code> and
              earn credits every time someone unlocks it.
            </p>
          </div>
          <button
            onClick={() => { if (requireUser()) setComposing((c) => !c); }}
            className="px-4 py-3 rounded text-xs font-black uppercase tracking-widest text-white"
            style={{ background: "var(--gradient-blood)" }}>
            <PlusCircle size={14} className="inline mr-2" />New Post
          </button>
        </div>

        {composing && (
          <form onSubmit={submitPost} className="rounded-lg border border-primary/40 bg-card p-6 mb-8 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title"
                className="px-3 py-2 rounded border border-border bg-input text-foreground" />
              <select value={postCat} onChange={(e) => setPostCat(e.target.value)}
                className="px-3 py-2 rounded border border-border bg-input text-foreground">
                {FORUM_CATEGORIES.filter((c) => staff || !c.staffOnly).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <textarea required rows={6} value={body} onChange={(e) => setBody(e.target.value)}
              placeholder={"Write your post…\n\nPaid link example:\n[locked:250]https://your-download-link[/locked]"}
              className="w-full px-3 py-2 rounded border border-border bg-input text-foreground font-mono text-sm" />
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">{staff ? "Staff posts are free." : `${POST_COST} credits will be deducted.`}</p>
              <button type="submit" className="px-4 py-2 rounded text-xs font-black uppercase tracking-widest text-white" style={{ background: "var(--gradient-blood)" }}>
                Publish
              </button>
            </div>
          </form>
        )}

        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          <aside className="space-y-2 h-fit md:sticky md:top-20">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search"
                className="w-full pl-8 pr-3 py-2 rounded border border-border bg-input text-sm" />
            </div>
            {[{ id: "all", name: "All Categories", desc: "" }, ...FORUM_CATEGORIES].map((c) => (
              <button key={c.id} onClick={() => { setCategory(c.id); setOpen(null); }}
                className={`w-full text-left px-3 py-2 rounded text-xs font-bold uppercase tracking-wide ${category === c.id ? "bg-primary text-white" : "hover:bg-primary/10 text-muted-foreground"}`}>
                {c.name}
              </button>
            ))}
          </aside>

          <section className="space-y-4">
            {posts.length === 0 && (
              <p className="text-sm text-muted-foreground py-12 text-center">No posts here yet — be the first.</p>
            )}
            {posts.map((post) => {
              const links = parseLockedLinks(post.body);
              const isOpen = open === post.id;
              const cat = FORUM_CATEGORIES.find((c) => c.id === post.categoryId);
              return (
                <article key={post.id} className={`rounded-lg border bg-card p-5 ${post.pinned ? "border-primary/60" : "border-border"}`}>
                  <button className="w-full text-left" onClick={() => { setOpen(isOpen ? null : post.id); if (!isOpen) bumpViews(post.id); }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.pinned && <Pin size={13} className="text-primary" />}
                      {post.locked && <Lock size={13} className="text-yellow-400" />}
                      <h2 className="font-black uppercase tracking-wide">{post.title}</h2>
                      <span className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground uppercase tracking-widest">{cat?.name}</span>
                      {links.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase tracking-widest">
                          {links.length} paid link{links.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
                      <span>by <span className="text-foreground font-bold">{post.authorName}</span></span>
                      <span>{new Date(post.createdAt).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={11} />{post.replies.filter((r) => !r.removed).length}</span>
                      <span className="flex items-center gap-1"><Eye size={11} />{post.views}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-5 border-t border-border pt-5 space-y-5">
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground">{bodyWithoutLockedLinks(post.body)}</p>

                      {links.map((link) => {
                        const mine = user?.id === post.authorId;
                        const unlocked = mine || staff || (user ? hasUnlocked(user.id, post.id, link.index) : false);
                        return (
                          <div key={link.index} className="rounded border border-primary/40 bg-primary/5 p-4">
                            <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-widest text-primary">
                              {unlocked ? <Unlock size={13} /> : <Lock size={13} />}
                              {unlocked ? "Unlocked link" : `Locked link — ${link.price.toLocaleString()} credits`}
                            </div>
                            {unlocked ? (
                              <a href={link.url} target="_blank" rel="noreferrer noopener" className="text-sm text-primary underline break-all">{link.url}</a>
                            ) : (
                              <button onClick={() => doUnlock(post, link.index)}
                                className="px-4 py-2 rounded text-xs font-black uppercase tracking-widest text-white"
                                style={{ background: "var(--gradient-blood)" }}>
                                Unlock for {link.price.toLocaleString()} credits
                              </button>
                            )}
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              {unlockCount(post.id, link.index)} unlock{unlockCount(post.id, link.index) === 1 ? "" : "s"} · credits go to {post.authorName}
                            </p>
                          </div>
                        );
                      })}

                      <div className="space-y-3">
                        {post.replies.filter((r) => !r.removed).map((r) => (
                          <div key={r.id} className="rounded border border-border bg-background/40 p-3">
                            <div className="text-[11px] text-muted-foreground mb-1">
                              <span className="text-foreground font-bold">{r.authorName}</span> · {new Date(r.createdAt).toLocaleString()}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                          </div>
                        ))}
                      </div>

                      {!post.locked ? (
                        <div className="flex gap-2">
                          <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply…"
                            className="flex-1 px-3 py-2 rounded border border-border bg-input text-sm" />
                          <button onClick={submitReply} className="px-4 py-2 rounded text-xs font-black uppercase tracking-widest text-white" style={{ background: "var(--gradient-blood)" }}>
                            Reply
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-yellow-400 flex items-center gap-2"><Lock size={12} /> Thread locked by staff.</p>
                      )}

                      <div className="flex gap-4 text-[11px] text-muted-foreground">
                        <button onClick={() => doReport(post)} className="flex items-center gap-1 hover:text-primary"><Flag size={11} /> Report</button>
                        {staff && <Link to="/admin" className="flex items-center gap-1 hover:text-primary"><ShieldAlert size={11} /> Moderate in admin panel</Link>}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
}
