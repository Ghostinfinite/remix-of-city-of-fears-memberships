// Server-only helpers: admin email alerts + Discord notifications/role sync.

const DISCORD_API = "https://discord.com/api/v10";

export type NotifyResult = {
  email: "sent" | "skipped" | "failed";
  discord: "sent" | "skipped" | "failed";
  detail?: string;
};

export async function sendAdminEmail(subject: string, html: string): Promise<NotifyResult["email"]> {
  const apiKey = process.env["RESEND_API_KEY"];
  const to = (process.env["ADMIN_ALERT_EMAILS"] ?? "")
    .split(/[,\s;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!apiKey || to.length === 0) return "skipped";

  const from = process.env["ADMIN_ALERT_FROM"] ?? "City of Fears <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      console.error("Resend error", res.status, await res.text());
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("Resend request failed", err);
    return "failed";
  }
}

export async function sendDiscordAdminAlert(content: string, fields: Record<string, string>): Promise<NotifyResult["discord"]> {
  const url = process.env["DISCORD_ADMIN_WEBHOOK_URL"];
  if (!url) return "skipped";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        embeds: [
          {
            title: "Phone Purchase Request",
            color: 0xdc2626,
            fields: Object.entries(fields).map(([name, value]) => ({
              name,
              value: value || "—",
              inline: name !== "Note",
            })),
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("Discord webhook error", res.status, await res.text());
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("Discord webhook failed", err);
    return "failed";
  }
}

export async function resolveDiscordUserId(identifier: string): Promise<string | null> {
  const raw = identifier.trim().replace(/^<@!?(\d+)>$/, "$1");
  if (/^\d{15,25}$/.test(raw)) return raw;

  // Fall back to a username search inside the guild.
  const token = process.env["DISCORD_BOT_TOKEN"];
  const guildId = process.env["DISCORD_GUILD_ID"];
  if (!token || !guildId) return null;
  const query = raw.replace(/^@/, "").split("#")[0] ?? raw;
  try {
    const res = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/search?query=${encodeURIComponent(query)}&limit=1`,
      { headers: { Authorization: `Bot ${token}` } },
    );
    if (!res.ok) return null;
    const members = (await res.json()) as Array<{ user?: { id?: string } }>;
    return members[0]?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function grantPhoneRole(identifier: string): Promise<{ ok: boolean; message: string; discordUserId?: string }> {
  const token = process.env["DISCORD_BOT_TOKEN"];
  const guildId = process.env["DISCORD_GUILD_ID"];
  const roleId = process.env["DISCORD_PHONE_ROLE_ID"];
  if (!token || !guildId || !roleId) {
    return { ok: false, message: "Discord role sync is not configured yet." };
  }

  const userId = await resolveDiscordUserId(identifier);
  if (!userId) {
    return { ok: false, message: `Could not find "${identifier}" in the Discord server.` };
  }

  try {
    const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: "PUT",
      headers: { Authorization: `Bot ${token}`, "Content-Length": "0" },
    });
    if (res.status === 204 || res.ok) {
      return { ok: true, message: "Discord phone role granted.", discordUserId: userId };
    }
    const body = await res.text();
    console.error("Discord role grant failed", res.status, body);
    if (res.status === 403) {
      return { ok: false, message: "Bot lacks Manage Roles permission or its role is below the phone role." };
    }
    if (res.status === 404) {
      return { ok: false, message: "User is not a member of the Discord server (or role ID is wrong)." };
    }
    return { ok: false, message: `Discord returned ${res.status}.` };
  } catch (err) {
    console.error("Discord role grant error", err);
    return { ok: false, message: "Discord request failed." };
  }
}

export async function revokePhoneRole(identifier: string): Promise<{ ok: boolean; message: string }> {
  const token = process.env["DISCORD_BOT_TOKEN"];
  const guildId = process.env["DISCORD_GUILD_ID"];
  const roleId = process.env["DISCORD_PHONE_ROLE_ID"];
  if (!token || !guildId || !roleId) {
    return { ok: false, message: "Discord role sync is not configured yet." };
  }
  const userId = await resolveDiscordUserId(identifier);
  if (!userId) return { ok: false, message: `Could not find "${identifier}" in the Discord server.` };
  try {
    const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bot ${token}` },
    });
    if (res.status === 204 || res.ok) return { ok: true, message: "Discord phone role removed." };
    return { ok: false, message: `Discord returned ${res.status}.` };
  } catch {
    return { ok: false, message: "Discord request failed." };
  }
}

export function phoneRequestEmailHtml(input: {
  username: string;
  email?: string;
  discord?: string;
  note?: string;
  price: number;
}): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px;color:#9ca3af;font:12px sans-serif;text-transform:uppercase;letter-spacing:.1em">${label}</td><td style="padding:6px 12px;color:#f3f4f6;font:14px sans-serif">${value || "—"}</td></tr>`;
  return `<div style="background:#0b0b0f;padding:24px;font-family:sans-serif">
    <h1 style="color:#dc2626;font-size:20px;margin:0 0 4px">New Phone Purchase Request</h1>
    <p style="color:#9ca3af;font-size:13px;margin:0 0 16px">A member requested the FiveM Cyber Phone ($${input.price.toFixed(2)}) and is waiting for approval.</p>
    <table style="border-collapse:collapse;background:#15151c;border-radius:8px;width:100%">
      ${row("Member", escapeHtml(input.username))}
      ${row("Email", escapeHtml(input.email ?? ""))}
      ${row("Discord", escapeHtml(input.discord ?? ""))}
      ${row("Note", escapeHtml(input.note ?? ""))}
    </table>
    <p style="color:#6b7280;font-size:12px;margin-top:16px">Approve it in the admin panel under "Phone Requests".</p>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}