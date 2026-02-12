import { useState, useEffect, useCallback } from 'react';
import { Reflection } from '@/lib/types';
import { loadReflections, saveReflections, getDeletedIds, addDeletedId, removeDeletedId, getSyncedRemoteIds, saveSyncedRemoteIds } from '@/lib/storage';
import { getSupabaseClient } from '@/lib/supabase';

function formatError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

// Module-level sync lock to prevent concurrent sync operations
let isSyncLocked = false;

export function useReflections() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const syncWithSupabase = useCallback(async () => {
    // Skip if already syncing (prevents race conditions)
    if (isSyncLocked) {
      return;
    }

    isSyncLocked = true;
    const client = getSupabaseClient();

    if (!client) {
      isSyncLocked = false;
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
        return;
      }

      setIsOnline(true);

      const local = loadReflections();

      const allRemote: Reflection[] = (remoteData || [])
        .map((row: { data: Reflection }) => row.data)
        .filter((r: Reflection | null) => r != null);

      // Filter out locally-deleted IDs from remote data
      const deletedIds = new Set(getDeletedIds());
      const remoteReflections = allRemote.filter(r => !deletedIds.has(r.id));

      // Retry remote deletion for pending deleted IDs with verification
      const allRemoteIds = new Set(allRemote.map(r => r.id));
      if (deletedIds.size > 0) {
        for (const delId of deletedIds) {
          // If the item is already gone from remote, clean up tracking
          if (!allRemoteIds.has(delId)) {
            removeDeletedId(delId);
            continue;
          }
          try {
            const { data, error: delError } = await client
              .from('reflections')
              .delete()
              .eq('id', delId)
              .select();

            if (!delError && data && data.length > 0) {
              removeDeletedId(delId);
            }
          } catch (e) {
            console.error('Retry delete error for ID:', delId, formatError(e));
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

      let mergedList = Array.from(merged.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Detect cross-device deletions vs truly new local items
      const currentRemoteIds = new Set(remoteReflections.map((r) => r.id));
      const previouslySyncedIds = new Set(getSyncedRemoteIds());
      const localOnly = mergedList.filter((r) => !currentRemoteIds.has(r.id));

      // Items that were previously on remote but now missing = deleted by another device
      const deletedByOtherDevice = localOnly.filter((r) => previouslySyncedIds.has(r.id));
      // Items never seen on remote = truly new local items to push
      const newLocalItems = localOnly.filter((r) => !previouslySyncedIds.has(r.id));

      // Remove items deleted by other devices from merged list
      if (deletedByOtherDevice.length > 0) {
        const deletedByOtherIds = new Set(deletedByOtherDevice.map(r => r.id));
        mergedList = mergedList.filter(r => !deletedByOtherIds.has(r.id));
      }

      // SINGLE save: Save the final cleaned list to localStorage and state ONCE
      // This happens BEFORE pushing new items, so if interrupted, no deleted items are restored
      saveReflections(mergedList);
      setReflections(mergedList);

      // Push truly new local items to remote
      if (newLocalItems.length > 0) {
        try {
          const upsertData = newLocalItems.map((r) => ({ id: r.id, data: r }));
          const { error: upsertError } = await client.from('reflections').upsert(upsertData);

          if (upsertError) {
            console.error('Upsert error:', upsertError.message);
          }
        } catch (e) {
          console.error('Remote push error:', formatError(e));
        }
      }

      // Update previouslySyncedIds: only keep IDs that are in current local reflections
      // or currently on remote (prevents unbounded growth)
      const localIds = new Set(mergedList.map(r => r.id));
      const idsToTrack = new Set([...currentRemoteIds, ...localIds]);
      saveSyncedRemoteIds(Array.from(idsToTrack));
    } catch (e) {
      console.error('Sync error:', formatError(e));
      setIsOnline(false);
    } finally {
      isSyncLocked = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const local = loadReflections();
    setReflections(local);
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
        const { error } = await client.from('reflections').upsert({ id: reflection.id, data: reflection });

        if (!error) {
          // Update previouslySyncedIds to include the newly added item
          const syncedIds = getSyncedRemoteIds();
          if (!syncedIds.includes(reflection.id)) {
            saveSyncedRemoteIds([...syncedIds, reflection.id]);
          }
        } else {
          console.error('Add reflection upsert error:', error.message);
        }
      } catch (e) {
        console.error('Remote save error:', formatError(e));
      }
    }
  }, []);

  const deleteReflection = useCallback(async (id: number) => {
    // Track deletion BEFORE removing locally (survives refresh)
    addDeletedId(id);

    const current = loadReflections();
    const filtered = current.filter(r => r.id !== id);
    saveReflections(filtered);
    setReflections([...filtered]);

    // Delete from Supabase
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('reflections')
          .delete()
          .eq('id', id)
          .select();

        if (!error) {
          // Remove from tracking: either delete succeeded (data.length > 0)
          // or row was already gone (data.length === 0)
          removeDeletedId(id);
        } else {
          console.error('Remote delete error:', error.message);
        }
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
