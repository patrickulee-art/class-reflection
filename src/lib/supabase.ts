import { createClient, SupabaseClient } from '@supabase/supabase-js';

const CONFIG_KEY = 'supabaseConfig';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  // Priority 1: Environment variables
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    try {
      supabaseInstance = createClient(envUrl, envKey);
      return supabaseInstance;
    } catch (e) {
      console.error('Supabase init error from env:', e);
    }
  }

  // Priority 2: localStorage config
  if (typeof window !== 'undefined') {
    const config = localStorage.getItem(CONFIG_KEY);
    if (config) {
      try {
        const { url, key } = JSON.parse(config);
        if (url && key) {
          supabaseInstance = createClient(url, key);
          return supabaseInstance;
        }
      } catch (e) {
        console.error('Supabase init error from config:', e);
      }
    }
  }

  return null;
}

export function reinitializeSupabase(url: string, key: string): SupabaseClient | null {
  if (!url || !key) return null;
  try {
    supabaseInstance = createClient(url, key);
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, key }));
    }
    return supabaseInstance;
  } catch (e) {
    console.error('Supabase reinit error:', e);
    return null;
  }
}

export function getSupabaseConfig(): { url: string; key: string } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey };
  }

  if (typeof window !== 'undefined') {
    const config = localStorage.getItem(CONFIG_KEY);
    if (config) {
      try {
        return JSON.parse(config);
      } catch {
        // ignore parse errors
      }
    }
  }

  return { url: '', key: '' };
}
