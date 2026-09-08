import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        const token = await (await auth()).getToken();
        return token;
      },
      global: {
        fetch: (...args: Parameters<typeof fetch>) =>
          fetch(args[0], { ...args[1], cache: "no-store" }),
      },
    },
  );
}