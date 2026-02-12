import { createClient, SupabaseClient } from '@supabase/supabase-js';

const CONFIG_KEY = 'supabaseConfig';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) {
    console.log('[SUPABASE] Returning cached client instance');
    return supabaseInstance;
  }

  // Priority 1: Environment variables
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[SUPABASE] Checking environment variables...');
  console.log('[SUPABASE] NEXT_PUBLIC_SUPABASE_URL present:', !!envUrl);
  console.log('[SUPABASE] NEXT_PUBLIC_SUPABASE_ANON_KEY present:', !!envKey);

  if (envUrl && envKey) {
    try {
      console.log('[SUPABASE] Initializing from environment variables');
      console.log('[SUPABASE] URL:', envUrl.substring(0, 30) + '...');
      console.log('[SUPABASE] Key (first 10 chars):', envKey.substring(0, 10));
      supabaseInstance = createClient(envUrl, envKey);
      console.log('[SUPABASE] Successfully initialized from env');
      return supabaseInstance;
    } catch (e) {
      console.error('[SUPABASE] Init error from env:', e instanceof Error ? e.message : String(e));
    }
  }

  // Priority 2: localStorage config
  console.log('[SUPABASE] Checking localStorage config...');
  if (typeof window !== 'undefined') {
    const config = localStorage.getItem(CONFIG_KEY);
    console.log('[SUPABASE] localStorage config present:', !!config);
    if (config) {
      try {
        const { url, key } = JSON.parse(config);
        console.log('[SUPABASE] Parsed localStorage config - URL present:', !!url, 'Key present:', !!key);
        if (url && key) {
          console.log('[SUPABASE] Initializing from localStorage');
          console.log('[SUPABASE] URL:', url.substring(0, 30) + '...');
          console.log('[SUPABASE] Key (first 10 chars):', key.substring(0, 10));
          supabaseInstance = createClient(url, key);
          console.log('[SUPABASE] Successfully initialized from localStorage');
          return supabaseInstance;
        }
      } catch (e) {
        console.error('[SUPABASE] Init error from config:', e instanceof Error ? e.message : String(e));
      }
    }
  } else {
    console.log('[SUPABASE] Not in browser environment, localStorage unavailable');
  }

  console.log('[SUPABASE] No valid Supabase config found, returning null');
  return null;
}

export function reinitializeSupabase(url: string, key: string): SupabaseClient | null {
  console.log('[SUPABASE] reinitializeSupabase called');
  console.log('[SUPABASE] URL provided:', !!url, 'Key provided:', !!key);

  if (!url || !key) {
    console.log('[SUPABASE] Missing URL or key, returning null');
    return null;
  }

  try {
    console.log('[SUPABASE] Creating client with URL:', url.substring(0, 30) + '...');
    console.log('[SUPABASE] Key (first 10 chars):', key.substring(0, 10));
    supabaseInstance = createClient(url, key);
    console.log('[SUPABASE] Client created successfully');

    if (typeof window !== 'undefined') {
      console.log('[SUPABASE] Saving config to localStorage');
      localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, key }));
      console.log('[SUPABASE] Config saved to localStorage');
    } else {
      console.log('[SUPABASE] Not in browser environment, skipping localStorage');
    }

    return supabaseInstance;
  } catch (e) {
    console.error('[SUPABASE] Reinit error:', e instanceof Error ? e.message : String(e));
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
