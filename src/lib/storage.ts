import { Reflection } from './types';

const STORAGE_KEY = 'reflections_v13';
const DELETED_KEY = 'reflections_deleted_v13';
const SYNCED_REMOTE_IDS_KEY = 'reflections_synced_remote_ids_v13';

export function loadReflections(): Reflection[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveReflections(reflections: Reflection[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reflections));
}

export function getDeletedIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addDeletedId(id: number): void {
  if (typeof window === 'undefined') return;
  const deleted = getDeletedIds();
  if (!deleted.includes(id)) {
    deleted.push(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
  }
}

export function removeDeletedId(id: number): void {
  if (typeof window === 'undefined') return;
  const deleted = getDeletedIds().filter(d => d !== id);
  localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
}

export function getSyncedRemoteIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(SYNCED_REMOTE_IDS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveSyncedRemoteIds(ids: number[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SYNCED_REMOTE_IDS_KEY, JSON.stringify(ids));
}
