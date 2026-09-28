'use client';

const STORAGE_KEY = 'dsu_bookmarked_notices';

export function getBookmarkedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isNoticeBookmarked(id: string): boolean {
  const ids = getBookmarkedIds();
  return ids.includes(id);
}

export function toggleNoticeBookmark(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const ids = getBookmarkedIds();
  let updated: string[];
  let nowBookmarked = false;

  if (ids.includes(id)) {
    updated = ids.filter(item => item !== id);
    nowBookmarked = false;
  } else {
    updated = [...ids, id];
    nowBookmarked = true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('dsu_bookmarks_updated'));
  } catch (e) {
    console.error('Failed to update bookmark in localStorage', e);
  }

  return nowBookmarked;
}
