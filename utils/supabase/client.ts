import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = 
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL)) ||
  'https://lujytbmxoswazoyfvrck.supabase.co';

const supabaseKey = 
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)) ||
  'sb_publishable_4h4YhuQZWlrwLWmaCZVJ4g_imbgKInS';

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
