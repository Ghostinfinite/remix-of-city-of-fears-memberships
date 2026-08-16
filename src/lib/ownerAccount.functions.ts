import { createServerFn } from "@tanstack/react-start";
import { OWNER_USERNAME, OWNER_PASSWORD, OWNER_EMAIL } from "./ownerConstants";

/**
 * Verifies the owner username/password server-side, makes sure a real backend
 * account with the owner role exists, and hands back the credentials the
 * browser needs to open a genuine session (so database rules recognise staff).
 */
export const ownerSignIn = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) => data)
  .handler(async ({ data }) => {
    if (data.username !== OWNER_USERNAME || data.password !== OWNER_PASSWORD) {
      return { ok: false as const, error: "Wrong owner username or password" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let owner = list?.users.find((u) => u.email?.toLowerCase() === OWNER_EMAIL);

    if (!owner) {
      const created = await supabaseAdmin.auth.admin.createUser({
        email: OWNER_EMAIL,
        password: OWNER_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: OWNER_USERNAME },
      });
      if (created.error) return { ok: false as const, error: created.error.message };
      owner = created.data.user ?? undefined;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(owner.id, { password: OWNER_PASSWORD });
    }

    if (!owner) return { ok: false as const, error: "Could not prepare the owner account" };

    await supabaseAdmin.from("profiles").upsert(
      { user_id: owner.id, email: OWNER_EMAIL, display_name: OWNER_USERNAME },
      { onConflict: "user_id" },
    );
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: owner.id, role: "owner" as const },
      { onConflict: "user_id,role" },
    );
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: owner.id, role: "admin" as const },
      { onConflict: "user_id,role" },
    );

    return { ok: true as const, email: OWNER_EMAIL, password: OWNER_PASSWORD };
  });
