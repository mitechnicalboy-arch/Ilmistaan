import { createServerClient } from "@supabase/ssr";

const supabaseUrl = 
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  'https://lujytbmxoswazoyfvrck.supabase.co';

const supabaseKey = 
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)) ||
  'sb_publishable_4h4YhuQZWlrwLWmaCZVJ4g_imbgKInS';

export interface CookieHandler {
  getAll: () => { name: string; value: string }[];
  setAll?: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
}

export const createClient = (cookieHandler?: CookieHandler) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieHandler?.getAll() || [];
        },
        setAll(cookiesToSet) {
          try {
            cookieHandler?.setAll?.(cookiesToSet);
          } catch (_) {}
        },
      },
    }
  );
};
