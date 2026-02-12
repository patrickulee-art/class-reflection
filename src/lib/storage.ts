import { Reflection } from './types';

const STORAGE_KEY = 'reflections_v13';

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
