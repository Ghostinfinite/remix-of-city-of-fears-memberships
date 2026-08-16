import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "@/lib/wouter-compat";
import {
  Crown, Hash, Lock, MessageCircle, Plus, Send, Skull, Users, X,
  Eye, EyeOff, Clock, Coins, ShieldAlert, LogIn, Trash2, Star,
  ChevronRight, Radio,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { isOwnerSession } from "@/lib/owner";
import { getLocalSessionUser } from "@/lib/localAuth";
import { getUserMembership } from "@/lib/licenseKeys";
import {
  BUILT_IN_ROOMS, getCustomRooms, getMessages, sendMessage, deleteMessage,
  createPrivateRoom, deleteRoom, canAccessRoom, tierColor, tierEmoji,
  formatTimeLeft, getJoinedPrivateRooms, joinPrivateRoom,
  PRIVATE_COST, TIER_ORDER,
  type ChatRoom, type ChatMessage, type MembershipTier,
} from "@/lib/chatRooms";

const labelCls = "text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block";
const inputCls = "w-full px-3 py-2 rounded border border-border bg-input text-foreground focus:border-primary focus:outline-none text-sm";

function RoomBadge({ room }: { room: ChatRoom }) {
  if (room.type === "staff") return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-600/30 text-fuchsia-200 font-black uppercase border border-fuchsia-400/30">Staff</span>
  );
  if (room.type === "membership" && room.requiredTier) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase border" style={{ color: tierColor(room.requiredTier as MembershipTier), borderColor: tierColor(room.requiredTier as MembershipTier) + "50", background: tierColor(room.requiredTier as MembershipTier) + "15" }}>
      {room.requiredTier}+
    </span>
  );
  if (room.type === "private") return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black uppercase border border-amber-400/30">Private</span>
  );
  return null;
}

function MessageBubble({ msg, canDelete, onDelete }: { msg: ChatMessage; canDelete: boolean; onDelete: () => void }) {
  const isSystem = msg.userId === "system";
  if (isSystem) return (
    <div className="text-center text-xs text-muted-foreground py-1 italic">{msg.body}</div>
  );
  return (
    <div className="group flex gap-3 px-4 py-2 hover:bg-white/[0.02] rounded-lg transition">
      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
        {msg.isOwner ? <Crown size={14} className="text-fuchsia-300" /> : msg.isAdmin ? <ShieldAlert size={14} className="text-fuchsia-400" /> : (msg.displayName[0] || "?").toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`text-sm font-black ${msg.isOwner ? "text-fuchsia-300" : msg.isAdmin ? "text-fuchsia-400" : "text-foreground"}`}>
            {msg.displayName}
          </span>
          {msg.isOwner && <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-600/30 text-fuchsia-200 font-black uppercase border border-fuchsia-400/30">Owner</span>}
          {!msg.isOwner && msg.isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-600/20 text-fuchsia-300 font-black uppercase border border-fuchsia-400/20">Admin</span>}
          <span className="text-[11px] text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString()}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 break-words">{msg.body}</p>
      </div>
      {canDelete && (
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-destructive/20 text-destructive/60 hover:text-destructive shrink-0">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

export default function ChatPage() {
  const { user, isAdmin, loading } = useAuth();
  const isOwner = isOwnerSession();
  const userId = user?.id ?? "";
  const userEmail = user?.email ?? "";

  const [userTier, setUserTier] = useState<MembershipTier | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [customRooms, setCustomRooms] = useState<ChatRoom[]>([]);
  const [joinedPrivate, setJoinedPrivate] = useState<string[]>([]);
  const [credits, setCredits] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPin, setCreatePin] = useState("");
  const [showCreatePin, setShowCreatePin] = useState(false);

  const [showJoin, setShowJoin] = useState(false);
  const [joinPin, setJoinPin] = useState("");
  const [showJoinPin, setShowJoinPin] = useState(false);

  const [showRoomPin, setShowRoomPin] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId) {
      const m = getUserMembership(userId);
      setUserTier((m?.tier as MembershipTier) ?? null);
    }
    setCredits(Number(localStorage.getItem("cof_credits") || "0"));
    setJoinedPrivate(getJoinedPrivateRooms());
  }, [userId]);

  const loadRooms = useCallback(() => { setCustomRooms(getCustomRooms()); }, []);
  useEffect(() => { loadRooms(); }, [loadRooms]);

  const loadMessages = useCallback(() => {
    if (!selectedRoom) return;
    setMessages(getMessages(selectedRoom.id));
  }, [selectedRoom]);

  useEffect(() => {
    loadMessages();
    const id = setInterval(loadMessages, 2000);
    return () => clearInterval(id);
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const localUser = getLocalSessionUser();
  const displayName = localUser?.display_name || userEmail.split("@")[0] || "Member";

  const accessibleBuiltIn = BUILT_IN_ROOMS.filter(r => canAccessRoom(r, isAdmin, isOwner, userTier));
  const accessiblePrivate = customRooms.filter(r =>
    joinedPrivate.includes(r.id) || r.createdBy === userId
  );

  function handleSelectRoom(room: ChatRoom) {
    setSelectedRoom(room);
    setMessages(getMessages(room.id));
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoom || !input.trim() || !userId) return;
    sendMessage(selectedRoom.id, {
      roomId: selectedRoom.id,
      userId,
      userEmail,
      displayName,
      body: input.trim(),
      isOwner,
      isAdmin,
    });
    setInput("");
    loadMessages();
  }

  function handleCreatePrivate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return toast.error("Sign in first");
    if (credits < PRIVATE_COST) return toast.error(`You need ${PRIVATE_COST.toLocaleString()} credits. You have ${credits.toLocaleString()}.`);
    if (!/^\d{4}$/.test(createPin)) return toast.error("PIN must be exactly 4 digits (0-9)");
    const newCredits = credits - PRIVATE_COST;
    localStorage.setItem("cof_credits", String(newCredits));
    setCredits(newCredits);
    const room = createPrivateRoom(createName || "Private Room", createPin, userId);
    joinPrivateRoom(room.id);
    setJoinedPrivate(getJoinedPrivateRooms());
    loadRooms();
    setShowCreate(false);
    setCreateName("");
    setCreatePin("");
    handleSelectRoom(room);
    toast.success(`Room created! PIN: ${room.pin} — share it with others to let them join.`);
  }

  function handleJoinPrivate(e: React.FormEvent) {
    e.preventDefault();
    const pin = joinPin.trim();
    const room = customRooms.find(r => r.pin === pin);
    if (!room) return toast.error("No active room found with that PIN.");
    joinPrivateRoom(room.id);
    setJoinedPrivate(getJoinedPrivateRooms());
    setShowJoin(false);
    setJoinPin("");
    handleSelectRoom(room);
    toast.success(`Joined "${room.name}"!`);
  }

  function handleDeleteMsg(msg: ChatMessage) {
    if (!selectedRoom) return;
    deleteMessage(selectedRoom.id, msg.id);
    loadMessages();
  }

  const canDeleteMsg = (msg: ChatMessage) => isOwner || isAdmin || msg.userId === userId;

  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">Loading…</div>
  );

  if (!user) return (
    <div className="min-h-screen grid place-items-center bg-background px-4" style={{ background: "var(--gradient-dark)" }}>
      <div className="max-w-md w-full rounded-lg border border-border bg-card p-10 text-center">
        <Lock className="mx-auto text-primary mb-4" size={44} />
        <h1 className="text-3xl font-black uppercase">Chat Rooms</h1>
        <p className="mt-3 text-muted-foreground text-sm">Sign in to access staff rooms, membership lounges, and private chat rooms.</p>
        <Link href="/auth" className="mt-6 inline-block px-6 py-3 rounded font-black uppercase tracking-widest text-primary-foreground text-sm" style={{ background: "var(--gradient-blood)" }}>
          Sign In
        </Link>
        <div className="mt-3"><Link href="/" className="text-xs text-muted-foreground hover:text-primary transition">← Back home</Link></div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden" style={{ background: "var(--gradient-dark)" }}>
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur z-10">
        <div className="max-w-full px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-sm font-black tracking-widest hover:text-primary transition">
              <Skull className="text-primary" size={20} />
              <span className="hidden sm:block">CITY OF FEARS</span>
            </Link>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="font-black uppercase tracking-widest text-sm">Chat Rooms</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Coins size={13} className="text-primary" />{credits.toLocaleString()} credits</span>
            {userTier && <span className="font-bold" style={{ color: tierColor(userTier) }}>{tierEmoji(userTier)} {userTier}</span>}
            <Link href="/" className="hover:text-primary transition">← Home</Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-border bg-card/40 flex flex-col overflow-y-auto">

          {/* Staff Rooms */}
          {accessibleBuiltIn.some(r => r.type === "staff") && (
            <div className="p-3">
              <div className={labelCls + " flex items-center gap-1"}><ShieldAlert size={11} />Staff Only</div>
              {accessibleBuiltIn.filter(r => r.type === "staff").map(room => (
                <button key={room.id} onClick={() => handleSelectRoom(room)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-bold transition mb-1 ${selectedRoom?.id === room.id ? "bg-fuchsia-600 text-white" : "hover:bg-fuchsia-500/10 text-muted-foreground hover:text-fuchsia-100"}`}>
                  <Hash size={14} />{room.name}
                </button>
              ))}
            </div>
          )}

          {/* Membership Rooms */}
          {accessibleBuiltIn.some(r => r.type === "membership") && (
            <div className="p-3 border-t border-border">
              <div className={labelCls + " flex items-center gap-1"}><Star size={11} />Membership Lounges</div>
              {accessibleBuiltIn.filter(r => r.type === "membership").map(room => (
                <button key={room.id} onClick={() => handleSelectRoom(room)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-bold transition mb-1 ${selectedRoom?.id === room.id ? "bg-primary text-primary-foreground" : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"}`}>
                  <span>{tierEmoji(room.requiredTier as MembershipTier)}</span>
                  <span className="flex-1 text-left">{room.name}</span>
                  {room.requiredTier && <span className="text-[10px] font-bold" style={{ color: tierColor(room.requiredTier as MembershipTier) }}>{room.requiredTier}+</span>}
                </button>
              ))}
            </div>
          )}

          {/* Locked membership rooms */}
          {(() => {
            const locked = BUILT_IN_ROOMS.filter(r => r.type === "membership" && !canAccessRoom(r, isAdmin, isOwner, userTier));
            if (locked.length === 0) return null;
            return (
              <div className="p-3 border-t border-border">
                <div className={labelCls + " flex items-center gap-1 opacity-50"}><Lock size={11} />Locked Lounges</div>
                {locked.map(room => (
                  <div key={room.id} className="flex items-center gap-2 px-3 py-2 rounded text-sm text-muted-foreground/40 mb-1 cursor-not-allowed">
                    <Lock size={12} />
                    <span className="flex-1 truncate">{room.name}</span>
                    {room.requiredTier && <span className="text-[10px]" style={{ color: tierColor(room.requiredTier as MembershipTier) + "60" }}>{room.requiredTier}+</span>}
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Private Rooms */}
          <div className="p-3 border-t border-border">
            <div className={labelCls + " flex items-center gap-1"}><Lock size={11} />Private Rooms</div>
            {accessiblePrivate.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 mb-2">No private rooms joined yet.</p>
            )}
            {accessiblePrivate.map(room => (
              <button key={room.id} onClick={() => handleSelectRoom(room)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-bold transition mb-1 ${selectedRoom?.id === room.id ? "bg-amber-600 text-white" : "hover:bg-amber-500/10 text-muted-foreground hover:text-amber-100"}`}>
                <Lock size={12} />
                <span className="flex-1 text-left truncate">{room.name}</span>
                {room.expiresAt && <span className="text-[10px] opacity-60">{formatTimeLeft(room.expiresAt)}</span>}
              </button>
            ))}
            <button onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-bold text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10 transition mt-1">
              <Plus size={14} />Create Private Room
            </button>
            <button onClick={() => setShowJoin(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
              <LogIn size={14} />Join by PIN
            </button>
          </div>

          {/* All locked — no membership */}
          {!isAdmin && !isOwner && !userTier && accessibleBuiltIn.filter(r => r.type !== "staff").length === 0 && (
            <div className="p-4 border-t border-border">
              <div className="rounded-lg border border-border bg-card/50 p-4 text-center">
                <Star className="mx-auto text-primary mb-2" size={20} />
                <p className="text-xs text-muted-foreground">Get a membership to unlock lounges</p>
                <Link href="/#memberships" className="mt-2 inline-block text-xs font-bold text-primary hover:underline">View Plans</Link>
              </div>
            </div>
          )}
        </aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedRoom ? (
            <div className="flex-1 grid place-items-center text-center px-6">
              <div>
                <MessageCircle className="mx-auto text-primary/30 mb-4" size={64} />
                <h2 className="text-2xl font-black uppercase text-muted-foreground">Select a Room</h2>
                <p className="mt-2 text-sm text-muted-foreground/60">Pick a room from the left sidebar to start chatting.</p>
                {!userTier && !isAdmin && !isOwner && (
                  <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4 max-w-sm mx-auto">
                    <p className="text-sm text-muted-foreground">You have access to <span className="text-foreground font-bold">private rooms</span> only. Get a membership to unlock exclusive lounges.</p>
                    <Link href="/#memberships" className="mt-3 inline-block px-4 py-2 rounded font-bold uppercase text-xs text-primary-foreground" style={{ background: "var(--gradient-blood)" }}>Get Membership</Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Room Header */}
              <div className="shrink-0 border-b border-border bg-card/40 px-5 py-3 flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {selectedRoom.type === "staff" && <ShieldAlert size={18} className="text-fuchsia-300 shrink-0" />}
                  {selectedRoom.type === "membership" && <span className="text-lg">{tierEmoji(selectedRoom.requiredTier as MembershipTier)}</span>}
                  {selectedRoom.type === "private" && <Lock size={16} className="text-amber-400 shrink-0" />}
                  <div className="min-w-0">
                    <div className="font-black flex items-center gap-2 flex-wrap">
                      {selectedRoom.name}
                      <RoomBadge room={selectedRoom} />
                      {selectedRoom.type === "private" && <Radio size={12} className="text-green-400 animate-pulse" />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{selectedRoom.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRoom.type === "private" && selectedRoom.pin && (
                    <button onClick={() => setShowRoomPin(v => !v)} className="flex items-center gap-1 px-3 py-1.5 rounded border border-amber-400/30 text-amber-300 text-xs font-bold uppercase hover:bg-amber-500/10 transition">
                      {showRoomPin ? <><EyeOff size={12} />Hide PIN</> : <><Eye size={12} />Show PIN</>}
                    </button>
                  )}
                  {showRoomPin && selectedRoom.pin && (
                    <span className="font-mono font-black text-amber-300 bg-amber-500/10 px-3 py-1 rounded border border-amber-400/30">{selectedRoom.pin}</span>
                  )}
                  {selectedRoom.expiresAt && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} />{formatTimeLeft(selectedRoom.expiresAt)}</span>
                  )}
                  {(isOwner || selectedRoom.createdBy === userId) && selectedRoom.type === "private" && (
                    <button onClick={() => { deleteRoom(selectedRoom.id); setSelectedRoom(null); loadRooms(); toast.info("Room deleted."); }}
                      className="p-1.5 rounded border border-destructive/30 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4 space-y-0.5">
                {messages.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground text-sm">
                    <MessageCircle className="mx-auto mb-3 opacity-20" size={40} />
                    No messages yet. Say hi!
                  </div>
                )}
                {messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} canDelete={canDeleteMsg(msg)} onDelete={() => handleDeleteMsg(msg)} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-border bg-card/40 p-4">
                <form onSubmit={handleSend} className="flex gap-3">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`Message #${selectedRoom.name.toLowerCase()}…`}
                    maxLength={500}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-input text-foreground focus:border-primary focus:outline-none text-sm"
                  />
                  <button type="submit" disabled={!input.trim()}
                    className="px-4 py-2.5 rounded-lg font-bold text-primary-foreground disabled:opacity-40 transition"
                    style={{ background: "var(--gradient-blood)" }}>
                    <Send size={18} />
                  </button>
                </form>
                <div className="mt-1 text-[11px] text-muted-foreground/50 text-right">{input.length}/500</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Private Room Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl border border-amber-400/30 bg-card p-6 shadow-[0_0_60px_rgba(245,158,11,0.2)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black uppercase tracking-widest flex items-center gap-2"><Lock size={18} className="text-amber-400" />Create Private Room</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>

            <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-sm">
              <div className="font-bold text-amber-300 flex items-center gap-2 mb-1"><Coins size={14} />{PRIVATE_COST.toLocaleString()} credits to create</div>
              <p className="text-muted-foreground text-xs">Room lasts <strong className="text-foreground">24 hours</strong>. Others join using the 4-digit PIN you set. Your current balance: <strong className="text-foreground">{credits.toLocaleString()}</strong> credits.</p>
            </div>

            {credits < PRIVATE_COST ? (
              <div className="text-center py-4">
                <p className="text-destructive font-bold mb-1">Insufficient credits</p>
                <p className="text-xs text-muted-foreground">You need {(PRIVATE_COST - credits).toLocaleString()} more credits.</p>
              </div>
            ) : (
              <form onSubmit={handleCreatePrivate} className="space-y-4">
                <div>
                  <label className={labelCls}>Room Name</label>
                  <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="My Private Room" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>4-Digit PIN *</label>
                  <div className="relative">
                    <input
                      required
                      type={showCreatePin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={4}
                      pattern="\d{4}"
                      value={createPin}
                      onChange={e => setCreatePin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="0000"
                      className={inputCls + " pr-10 font-mono tracking-[0.5em] text-center text-lg"}
                    />
                    <button type="button" onClick={() => setShowCreatePin(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showCreatePin ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Share this PIN with people you want to invite.</p>
                </div>
                <button type="submit" className="w-full py-3 rounded-lg font-black uppercase tracking-widest text-white transition" style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}>
                  Create Room — {PRIVATE_COST.toLocaleString()} Credits
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Join Private Room Modal */}
      {showJoin && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black uppercase tracking-widest flex items-center gap-2"><LogIn size={18} className="text-primary" />Join Private Room</h2>
              <button onClick={() => setShowJoin(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <form onSubmit={handleJoinPrivate} className="space-y-4">
              <div>
                <label className={labelCls}>Enter 4-Digit PIN</label>
                <input
                  required
                  type={showJoinPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={4}
                  value={joinPin}
                  onChange={e => setJoinPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="0000"
                  className={inputCls + " font-mono tracking-[0.5em] text-center text-lg"}
                  autoFocus
                />
              </div>
              <button type="button" onClick={() => setShowJoinPin(v => !v)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                {showJoinPin ? <EyeOff size={12} /> : <Eye size={12} />}{showJoinPin ? "Hide PIN" : "Show PIN"}
              </button>
              <button type="submit" className="w-full py-3 rounded-lg font-black uppercase tracking-widest text-primary-foreground" style={{ background: "var(--gradient-blood)" }}>
                Join Room
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
