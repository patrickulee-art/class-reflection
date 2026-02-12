import { useState, useEffect, useCallback } from 'react';
import { Reflection } from '@/lib/types';
import { getReflections, saveReflections } from '@/lib/storage';
import { getSupabaseClient } from '@/lib/supabase';

export function useReflections() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setReflections(getReflections());
  }, []);

  const refreshReflections = useCallback(() => {
    setReflections(getReflections());
  }, []);

  const addReflection = useCallback(async (reflection: Reflection) => {
    const current = getReflections();
    current.unshift(reflection);
    saveReflections(current);
    setReflections([...current]);

    // Sync to Supabase if available
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('reflections').upsert({
          id: reflection.id,
          data: reflection,
        });
      } catch (e) {
        console.error('Remote save error:', e);
      }
    }
  }, []);

  const deleteReflection = useCallback(async (id: number) => {
    const current = getReflections();
    const filtered = current.filter(r => r.id !== id);
    saveReflections(filtered);
    setReflections([...filtered]);

    // Delete from Supabase if available
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('reflections').delete().match({ id });
      } catch (e) {
        console.error('Remote delete error:', e);
      }
    }
  }, []);

  const syncWithSupabase = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      setIsOnline(false);
      return;
    }

    setIsSyncing(true);
    setIsOnline(true);

    try {
      // Fetch all remote reflections (no auth filter - anonymous mode)
      const { data: remoteData, error } = await client
        .from('reflections')
        .select('data');

      if (error) throw error;

      const remoteReflections: Reflection[] = (remoteData || []).map(
        (d: { data: Reflection }) => d.data
      );
      const localReflections = getReflections();

      // Merge: latest wins by id (which is timestamp)
      const mergedMap = new Map<number, Reflection>();
      [...localReflections, ...remoteReflections].forEach(r => {
        const existing = mergedMap.get(r.id);
        if (!existing || new Date(r.createdAt) > new Date(existing.createdAt)) {
          mergedMap.set(r.id, r);
        }
      });

      const merged = Array.from(mergedMap.values()).sort((a, b) => b.id - a.id);

      // Save merged to local
      saveReflections(merged);
      setReflections([...merged]);

      // Push missing to remote
      for (const reflection of merged) {
        const existsRemotely = remoteReflections.some(r => r.id === reflection.id);
        if (!existsRemotely) {
          await client.from('reflections').upsert({
            id: reflection.id,
            data: reflection,
          });
        }
      }
    } catch (e) {
      console.error('Sync error:', e);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    reflections,
    addReflection,
    deleteReflection,
    syncWithSupabase,
    refreshReflections,
    isSyncing,
    isOnline,
  };
}
