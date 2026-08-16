import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const requestSchema = z.object({
  username: z.string().min(1).max(80),
  email: z.string().max(160).optional(),
  discord: z.string().max(80).optional(),
  note: z.string().max(500).optional(),
  price: z.number().min(0).max(10000),
});

const roleSchema = z.object({
  discord: z.string().min(2).max(80),
  action: z.enum(["grant", "revoke"]),
});

export const notifyAdminsOfPhoneRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => requestSchema.parse(input))
  .handler(async ({ data }) => {
    const {
      sendAdminEmail,
      sendDiscordAdminAlert,
      phoneRequestEmailHtml,
    } = await import("./phoneNotify.server");

    const [email, discord] = await Promise.all([
      sendAdminEmail(
        `New phone request from ${data.username}`,
        phoneRequestEmailHtml(data),
      ),
      sendDiscordAdminAlert("🔔 New phone purchase request awaiting approval", {
        Member: data.username,
        Email: data.email ?? "",
        Discord: data.discord ?? "",
        Price: `$${data.price.toFixed(2)}`,
        Note: data.note ?? "",
      }),
    ]);

    return { email, discord };
  });

export const syncPhoneDiscordRole = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => roleSchema.parse(input))
  .handler(async ({ data }) => {
    const { grantPhoneRole, revokePhoneRole } = await import("./phoneNotify.server");
    return data.action === "grant"
      ? await grantPhoneRole(data.discord)
      : await revokePhoneRole(data.discord);
  });