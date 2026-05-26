import { createClient, type Session } from "@supabase/supabase-js";

// Temporarily disable Supabase to use local-only mode
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// const hasPlaceholder =
//   !supabaseUrl ||
//   !supabaseAnonKey ||
//   supabaseUrl.includes("your-project") ||
//   supabaseAnonKey.includes("your-public-anon-key");

// export const isSupabaseConfigured = !hasPlaceholder;
export const isSupabaseConfigured = false;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        flowType: "pkce",
      },
    })
  : null;

export type { Session };
