import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Admin client using service role key — only used in API routes (server-side).
 * NEVER expose this on the client.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
