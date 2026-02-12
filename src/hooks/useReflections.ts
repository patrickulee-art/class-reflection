import { useState, useEffect, useCallback } from 'react';
import { Reflection } from '@/lib/types';
import { loadReflections, saveReflections, getDeletedIds, addDeletedId, removeDeletedId, getSyncedRemoteIds, saveSyncedRemoteIds } from '@/lib/storage';
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

      const allRemote: Reflection[] = (remoteData || [])
        .map((row: { data: Reflection }) => row.data)
        .filter((r: Reflection | null) => r != null);

      console.log('[SYNC] Remote reflections parsed:', allRemote.length, 'items');
      console.log('[SYNC] Remote reflection IDs:', allRemote.map(r => r.id).join(', '));

      // Filter out locally-deleted IDs from remote data
      const deletedIds = new Set(getDeletedIds());
      const remoteReflections = allRemote.filter(r => !deletedIds.has(r.id));
      console.log('[SYNC] Deleted IDs pending:', [...deletedIds].join(', ') || 'none');
      console.log('[SYNC] Remote after filtering deleted:', remoteReflections.length, 'items');

      // Retry remote deletion for pending deleted IDs
      if (deletedIds.size > 0) {
        for (const delId of deletedIds) {
          try {
            const { error: delError } = await client.from('reflections').delete().eq('id', delId);
            if (!delError) {
              console.log('[SYNC] Retry delete succeeded for ID:', delId);
              removeDeletedId(delId);
            } else {
              console.error('[SYNC] Retry delete failed for ID:', delId, delError.message);
            }
          } catch (e) {
            console.error('[SYNC] Retry delete error for ID:', delId, formatError(e));
          }
        }
      }

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

      // Detect cross-device deletions vs truly new local items
      const currentRemoteIds = new Set(remoteReflections.map((r) => r.id));
      const previouslySyncedIds = new Set(getSyncedRemoteIds());
      const localOnly = mergedList.filter((r) => !currentRemoteIds.has(r.id));

      // Items that were previously on remote but now missing = deleted by another device
      const deletedByOtherDevice = localOnly.filter((r) => previouslySyncedIds.has(r.id));
      // Items never seen on remote = truly new local items to push
      const newLocalItems = localOnly.filter((r) => !previouslySyncedIds.has(r.id));

      console.log('[SYNC] Local-only items:', localOnly.length);
      console.log('[SYNC] Deleted by other device:', deletedByOtherDevice.length, deletedByOtherDevice.map(r => r.id).join(', '));
      console.log('[SYNC] New local items to push:', newLocalItems.length, newLocalItems.map(r => r.id).join(', '));

      // Remove items deleted by other devices from local
      if (deletedByOtherDevice.length > 0) {
        const deletedByOtherIds = new Set(deletedByOtherDevice.map(r => r.id));
        const cleaned = mergedList.filter(r => !deletedByOtherIds.has(r.id));
        saveReflections(cleaned);
        setReflections(cleaned);
        console.log('[SYNC] Removed cross-device deleted items, remaining:', cleaned.length);
      }

      // Push truly new local items to remote
      if (newLocalItems.length > 0) {
        try {
          console.log('[SYNC] Upserting', newLocalItems.length, 'new local reflections to remote');
          const upsertData = newLocalItems.map((r) => ({ id: r.id, data: r }));
          await client.from('reflections').upsert(upsertData);
          console.log('[SYNC] Upsert successful');
        } catch (e) {
          console.error('[SYNC] Remote push error:', formatError(e));
        }
      } else {
        console.log('[SYNC] No new local reflections to push');
      }

      // Save current remote IDs + new local IDs for next sync comparison
      const allKnownRemoteIds = [...currentRemoteIds, ...newLocalItems.map(r => r.id)];
      saveSyncedRemoteIds(allKnownRemoteIds);
      console.log('[SYNC] Saved synced remote IDs:', allKnownRemoteIds.length);
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

    // Track deletion BEFORE removing locally (survives refresh)
    addDeletedId(id);
    console.log('[SYNC] ID added to deleted tracking:', id);

    const current = loadReflections();
    console.log('[SYNC] Current local reflections before delete:', current.length, 'items');
    const filtered = current.filter(r => r.id !== id);
    console.log('[SYNC] Reflection ID', id, 'removed, total now:', filtered.length);
    saveReflections(filtered);
    console.log('[SYNC] Updated list saved to localStorage');
    setReflections([...filtered]);

    // Delete from Supabase
    const client = getSupabaseClient();
    console.log('[SYNC] Supabase client available:', !!client);
    if (client) {
      try {
        console.log('[SYNC] Deleting reflection from Supabase, ID:', id);
        const { error } = await client.from('reflections').delete().eq('id', id);
        if (error) {
          console.error('[SYNC] Remote delete error:', error.message);
          console.log('[SYNC] ID kept in deleted tracking for retry on next sync');
        } else {
          console.log('[SYNC] Delete successful for reflection ID:', id);
          removeDeletedId(id);
          console.log('[SYNC] ID removed from deleted tracking:', id);
        }
      } catch (e) {
        console.error('[SYNC] Remote delete error:', formatError(e));
        console.log('[SYNC] ID kept in deleted tracking for retry on next sync');
      }
    } else {
      console.log('[SYNC] No Supabase client, reflection deleted locally only (tracked for retry)');
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
