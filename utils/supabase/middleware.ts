import { createServerClient } from "@supabase/ssr";
import type { Request, Response, NextFunction } from "express";

const supabaseUrl = 
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  'https://lujytbmxoswazoyfvrck.supabase.co';

const supabaseKey = 
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)) ||
  'sb_publishable_4h4YhuQZWlrwLWmaCZVJ4g_imbgKInS';

export const createClient = (req?: Request, res?: Response) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          if (!req?.headers?.cookie) return [];
          return req.headers.cookie.split(';').map(c => {
            const [name, ...v] = c.trim().split('=');
            return { name, value: v.join('=') };
          });
        },
        setAll(cookiesToSet) {
          if (!res) return;
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              res.cookie?.(name, value, options);
            } catch (_) {}
          });
        },
      },
    }
  );
};

export const supabaseMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const supabase = createClient(req, res);
  try {
    await supabase.auth.getUser();
  } catch (_) {}
  next();
};
