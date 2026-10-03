import { createClient } from "@supabase/supabase-js";

// Server-side client. It uses the anon key, like the rest of the API routes.
// Access control is enforced by proxy.ts (/admin and /api/admin require org:admin),
// not by passing the Clerk session token to Supabase: that requires Clerk to be
// configured as a third-party auth provider in the Supabase project, and fails
// with "No suitable key or wrong key type" when it isn't.
export async function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (...args: Parameters<typeof fetch>) =>
          fetch(args[0], { ...args[1], cache: "no-store" }),
      },
    },
  );
}
