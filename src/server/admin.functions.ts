import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side admin guard. Verifies via authenticated Supabase client (RLS-scoped)
 * that the caller has the 'admin' role in user_roles. Returns { isAdmin: boolean }.
 * Throws 401 (via requireSupabaseAuth) when no valid token is present.
 */
export const verifyAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) {
      return { isAdmin: false, userId };
    }
    return { isAdmin: !!data, userId };
  });
