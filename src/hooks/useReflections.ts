import { useState, useEffect, useCallback } from 'react';
import { Reflection } from '@/lib/types';
import { loadReflections, saveReflections } from '@/lib/storage';
import { getSupabaseClient } from '@/lib/supabase';

function formatError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export function useReflections() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const syncWithSupabase = useCallback(async () => {
    console.log('[SYNC] syncWithSupabase called');
    const client = getSupabaseClient();
    console.log('[SYNC] getSupabaseClient returned:', client ? 'client instance' : 'null');

    if (!client) {
      console.log('[SYNC] No Supabase client available, setting offline');
      setIsOnline(false);
      return;
    }

    console.log('[SYNC] Starting sync process');
    setIsSyncing(true);
    try {
      console.log('[SYNC] Attempting to fetch remote reflections from Supabase');
      const { data: remoteData, error } = await client
        .from('reflections')
        .select('data');

      console.log('[SYNC] Remote query completed');
      console.log('[SYNC] Response - data:', remoteData ? `${remoteData.length} rows` : 'null', 'error:', error ? error.message : 'none');

      if (error) {
        console.error('[SYNC] Remote fetch error:', formatError(error));
        console.error('[SYNC] Error details:', error);
        setIsOnline(false);
        setIsSyncing(false);
        return;
      }

      console.log('[SYNC] Remote fetch successful, setting online');
      setIsOnline(true);

      const local = loadReflections();
      console.log('[SYNC] Local reflections loaded:', local.length, 'items');

      const remoteReflections: Reflection[] = (remoteData || [])
        .map((row: { data: Reflection }) => row.data)
        .filter((r: Reflection | null) => r != null);

      console.log('[SYNC] Remote reflections parsed:', remoteReflections.length, 'items');
      console.log('[SYNC] Remote reflection IDs:', remoteReflections.map(r => r.id).join(', '));

      // Merge: build map by id, latest createdAt wins
      const merged = new Map<number, Reflection>();

      for (const r of local) {
        merged.set(r.id, r);
      }

      for (const r of remoteReflections) {
        const existing = merged.get(r.id);
        if (!existing || r.createdAt > existing.createdAt) {
          merged.set(r.id, r);
        }
      }

      const mergedList = Array.from(merged.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log('[SYNC] Merge complete:', mergedList.length, 'items after merge');
      console.log('[SYNC] Merged reflection IDs:', mergedList.map(r => r.id).join(', '));

      // Save merged result to localStorage
      saveReflections(mergedList);
      setReflections(mergedList);
      console.log('[SYNC] Merged list saved to localStorage and state');

      // Push local-only items to remote
      const remoteIds = new Set(remoteReflections.map((r) => r.id));
      const localOnly = mergedList.filter((r) => !remoteIds.has(r.id));

      console.log('[SYNC] Local-only reflections to push:', localOnly.length, 'items');
      console.log('[SYNC] Local-only reflection IDs:', localOnly.map(r => r.id).join(', '));

      if (localOnly.length > 0) {
        try {
          console.log('[SYNC] Upserting', localOnly.length, 'local-only reflections to remote');
          const upsertData = localOnly.map((r) => ({ id: r.id, data: r }));
          console.log('[SYNC] Upsert payload prepared:', upsertData.length, 'records');
          await client.from('reflections').upsert(upsertData);
          console.log('[SYNC] Upsert successful');
        } catch (e) {
          console.error('[SYNC] Remote push error:', formatError(e));
          console.error('[SYNC] Push error details:', e);
        }
      } else {
        console.log('[SYNC] No local-only reflections to push, sync complete');
      }
    } catch (e) {
      console.error('[SYNC] Sync error:', formatError(e));
      console.error('[SYNC] Sync error details:', e);
      setIsOnline(false);
    } finally {
      console.log('[SYNC] Sync process finished, setting isSyncing to false');
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    console.log('[SYNC] useReflections mounted');
    const local = loadReflections();
    console.log('[SYNC] Initial local reflections loaded:', local.length, 'items');
    setReflections(local);
    console.log('[SYNC] Triggering initial sync');
    syncWithSupabase();
  }, [syncWithSupabase]);

  const addReflection = useCallback(async (reflection: Reflection) => {
    console.log('[SYNC] addReflection called for reflection ID:', reflection.id);
    const current = loadReflections();
    console.log('[SYNC] Current local reflections before add:', current.length, 'items');
    current.unshift(reflection);
    console.log('[SYNC] New reflection added to local list, total now:', current.length);
    saveReflections(current);
    console.log('[SYNC] Reflections saved to localStorage');
    setReflections([...current]);

    // Sync to Supabase (fire-and-forget)
    const client = getSupabaseClient();
    console.log('[SYNC] Supabase client available:', !!client);
    if (client) {
      try {
        console.log('[SYNC] Upserting new reflection to Supabase, ID:', reflection.id);
        await client.from('reflections').upsert({ id: reflection.id, data: reflection });
        console.log('[SYNC] Upsert successful for reflection ID:', reflection.id);
      } catch (e) {
        console.error('[SYNC] Remote save error:', formatError(e));
        console.error('[SYNC] Save error details:', e);
      }
    } else {
      console.log('[SYNC] No Supabase client, reflection saved locally only');
    }
  }, []);

  const deleteReflection = useCallback(async (id: number) => {
    console.log('[SYNC] deleteReflection called for ID:', id);
    const current = loadReflections();
    console.log('[SYNC] Current local reflections before delete:', current.length, 'items');
    const filtered = current.filter(r => r.id !== id);
    console.log('[SYNC] Reflection ID', id, 'removed, total now:', filtered.length);
    saveReflections(filtered);
    console.log('[SYNC] Updated list saved to localStorage');
    setReflections([...filtered]);

    // Sync to Supabase (fire-and-forget)
    const client = getSupabaseClient();
    console.log('[SYNC] Supabase client available:', !!client);
    if (client) {
      try {
        console.log('[SYNC] Deleting reflection from Supabase, ID:', id);
        await client.from('reflections').delete().match({ id });
        console.log('[SYNC] Delete successful for reflection ID:', id);
      } catch (e) {
        console.error('[SYNC] Remote delete error:', formatError(e));
        console.error('[SYNC] Delete error details:', e);
      }
    } else {
      console.log('[SYNC] No Supabase client, reflection deleted locally only');
    }
  }, []);

  const refreshReflections = useCallback(() => {
    setReflections(loadReflections());
  }, []);

  return {
    reflections,
    addReflection,
    deleteReflection,
    refreshReflections,
    syncWithSupabase,
    isSyncing,
    isOnline,
  };
}
