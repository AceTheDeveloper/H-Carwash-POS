import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        const token = await (await auth()).getToken();
        console.log("Clerk token (first 50 chars):", token?.slice(0, 50));
        return token;
      },
    },
  );
}
