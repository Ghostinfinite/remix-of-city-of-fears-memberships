export type RoomType = "staff" | "membership" | "private";
export type MembershipTier = "Silver" | "Gold" | "Platinum" | "Diamond" | "Premium" | "Infinite";

export const TIER_ORDER: MembershipTier[] = ["Silver", "Gold", "Platinum", "Diamond", "Premium", "Infinite"];
export const PRIVATE_COST = 5000;
export const PRIVATE_DURATION_MS = 24 * 60 * 60 * 1000;

export type ChatRoom = {
  id: string;
  name: string;
  type: RoomType;
  requiredTier?: MembershipTier;
  pin?: string;
  expiresAt?: number;
  createdBy?: string;
  createdAt: number;
  description?: string;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  userEmail: string;
  displayName: string;
  body: string;
  createdAt: number;
  isOwner?: boolean;
  isAdmin?: boolean;
};

export const BUILT_IN_ROOMS: ChatRoom[] = [
  { id: "staff", name: "Staff Room", type: "staff", createdAt: 0, description: "Private channel for staff, admins, and the owner only." },
  { id: "mb-silver", name: "Silver Lounge", type: "membership", requiredTier: "Silver", createdAt: 0, description: "Open to Silver members and above." },
  { id: "mb-gold", name: "Gold Lounge", type: "membership", requiredTier: "Gold", createdAt: 0, description: "Open to Gold members and above." },
  { id: "mb-platinum", name: "Platinum Lounge", type: "membership", requiredTier: "Platinum", createdAt: 0, description: "Open to Platinum members and above." },
  { id: "mb-diamond", name: "Diamond Lounge", type: "membership", requiredTier: "Diamond", createdAt: 0, description: "Open to Diamond members and above." },
  { id: "mb-premium", name: "Premium Lounge", type: "membership", requiredTier: "Premium", createdAt: 0, description: "Open to Premium members and above." },
  { id: "mb-infinite", name: "Infinite Sanctum", type: "membership", requiredTier: "Infinite", createdAt: 0, description: "Exclusive to Infinite members." },
];

const ROOMS_KEY = "cof_chat_rooms";
const MSGS_PREFIX = "cof_chat_msgs_";
const JOINED_PRIVATE_KEY = "cof_joined_private_rooms";

export function getCustomRooms(): ChatRoom[] {
  try {
    const rooms = JSON.parse(localStorage.getItem(ROOMS_KEY) || "[]") as ChatRoom[];
    const now = Date.now();
    const live = rooms.filter(r => !r.expiresAt || r.expiresAt > now);
    if (live.length !== rooms.length) saveCustomRooms(live);
    return live;
  } catch { return []; }
}

export function saveCustomRooms(rooms: ChatRoom[]) {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export function createPrivateRoom(name: string, pin: string, createdBy: string): ChatRoom {
  const rooms = getCustomRooms();
  const room: ChatRoom = {
    id: `private_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || "Private Room",
    type: "private",
    pin: pin.trim(),
    expiresAt: Date.now() + PRIVATE_DURATION_MS,
    createdBy,
    createdAt: Date.now(),
    description: "Private room — expires in 24 hours.",
  };
  rooms.push(room);
  saveCustomRooms(rooms);
  return room;
}

export function deleteRoom(id: string) {
  saveCustomRooms(getCustomRooms().filter(r => r.id !== id));
  localStorage.removeItem(MSGS_PREFIX + id);
}

export function getMessages(roomId: string): ChatMessage[] {
  try { return JSON.parse(localStorage.getItem(MSGS_PREFIX + roomId) || "[]"); }
  catch { return []; }
}

export function sendMessage(roomId: string, msg: Omit<ChatMessage, "id" | "createdAt">): ChatMessage {
  const msgs = getMessages(roomId);
  const newMsg: ChatMessage = { ...msg, id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now() };
  msgs.push(newMsg);
  if (msgs.length > 300) msgs.splice(0, msgs.length - 300);
  localStorage.setItem(MSGS_PREFIX + roomId, JSON.stringify(msgs));
  return newMsg;
}

export function deleteMessage(roomId: string, msgId: string) {
  const msgs = getMessages(roomId).filter(m => m.id !== msgId);
  localStorage.setItem(MSGS_PREFIX + roomId, JSON.stringify(msgs));
}

export function canAccessRoom(room: ChatRoom, isAdmin: boolean, isOwner: boolean, userTier: MembershipTier | null): boolean {
  if (room.type === "staff") return isAdmin || isOwner;
  if (room.type === "membership") {
    if (isAdmin || isOwner) return true;
    if (!room.requiredTier || !userTier) return false;
    return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(room.requiredTier);
  }
  if (room.type === "private") return true;
  return false;
}

export function getJoinedPrivateRooms(): string[] {
  try { return JSON.parse(localStorage.getItem(JOINED_PRIVATE_KEY) || "[]"); }
  catch { return []; }
}

export function joinPrivateRoom(roomId: string) {
  const joined = getJoinedPrivateRooms();
  if (!joined.includes(roomId)) {
    joined.push(roomId);
    localStorage.setItem(JOINED_PRIVATE_KEY, JSON.stringify(joined));
  }
}

export function tierColor(tier: MembershipTier | undefined): string {
  switch (tier) {
    case "Silver": return "#94a3b8";
    case "Gold": return "#f59e0b";
    case "Platinum": return "#e2e8f0";
    case "Diamond": return "#38bdf8";
    case "Premium": return "#8b5cf6";
    case "Infinite": return "#ef4444";
    default: return "#6b7280";
  }
}

export function tierEmoji(tier: MembershipTier | undefined): string {
  switch (tier) {
    case "Silver": return "🥈";
    case "Gold": return "🥇";
    case "Platinum": return "💎";
    case "Diamond": return "💠";
    case "Premium": return "⭐";
    case "Infinite": return "♾️";
    default: return "👤";
  }
}

export function formatTimeLeft(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}
