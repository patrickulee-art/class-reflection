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
    const client = getSupabaseClient();
    if (!client) {
      setIsOnline(false);
      return;
    }

    setIsSyncing(true);
    try {
      const { data: remoteData, error } = await client
        .from('reflections')
        .select('data');

      if (error) {
        console.error('Remote fetch error:', formatError(error));
        setIsOnline(false);
        setIsSyncing(false);
        return;
      }

      setIsOnline(true);

      const local = loadReflections();
      const remoteReflections: Reflection[] = (remoteData || [])
        .map((row: { data: Reflection }) => row.data)
        .filter((r: Reflection | null) => r != null);

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

      // Save merged result to localStorage
      saveReflections(mergedList);
      setReflections(mergedList);

      // Push local-only items to remote
      const remoteIds = new Set(remoteReflections.map((r) => r.id));
      const localOnly = mergedList.filter((r) => !remoteIds.has(r.id));

      if (localOnly.length > 0) {
        try {
          const upsertData = localOnly.map((r) => ({ id: r.id, data: r }));
          await client.from('reflections').upsert(upsertData);
        } catch (e) {
          console.error('Remote push error:', formatError(e));
        }
      }
    } catch (e) {
      console.error('Sync error:', formatError(e));
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    setReflections(loadReflections());
    syncWithSupabase();
  }, [syncWithSupabase]);

  const addReflection = useCallback(async (reflection: Reflection) => {
    const current = loadReflections();
    current.unshift(reflection);
    saveReflections(current);
    setReflections([...current]);

    // Sync to Supabase (fire-and-forget)
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('reflections').upsert({ id: reflection.id, data: reflection });
      } catch (e) {
        console.error('Remote save error:', formatError(e));
      }
    }
  }, []);

  const deleteReflection = useCallback(async (id: number) => {
    const current = loadReflections();
    const filtered = current.filter(r => r.id !== id);
    saveReflections(filtered);
    setReflections([...filtered]);

    // Sync to Supabase (fire-and-forget)
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('reflections').delete().match({ id });
      } catch (e) {
        console.error('Remote delete error:', formatError(e));
      }
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
