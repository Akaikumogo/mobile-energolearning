import { useSyncExternalStore } from 'react';
import { readCachedUser } from '@/utils/auth';

export type LocalNewsItem = {
  id: string;
  publishedAt: Date;
  /** Shu oraliqda (qurilma vaqti bo'yicha) o'qilmagan bo'lsa popup majburiy ko'rsatiladi. */
  popupFrom: Date;
  popupUntil: Date;
};

export const CYRILLIC_NEWS_ID = 'cyrillic-content-2026-09';

export const LOCAL_NEWS: LocalNewsItem[] = [
  {
    id: CYRILLIC_NEWS_ID,
    publishedAt: new Date(2026, 8, 28),
    popupFrom: new Date(2026, 8, 28, 0, 0, 0),
    popupUntil: new Date(2026, 9, 5, 0, 0, 0),
  },
];

const STORAGE_PREFIX = 'news_read_v1:';
const CHANGE_EVENT = 'elektrolearn:news-read';

function storageKey(): string | null {
  const userId = readCachedUser()?.id;
  return userId ? `${STORAGE_PREFIX}${userId}` : null;
}

function readIds(): string[] {
  const key = storageKey();
  if (!key) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function isNewsRead(id: string): boolean {
  return readIds().includes(id);
}

export function markNewsRead(id: string): void {
  const key = storageKey();
  if (!key) return;
  const ids = readIds();
  if (ids.includes(id)) return;
  localStorage.setItem(key, JSON.stringify([...ids, id]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function visibleLocalNews(now = new Date()): LocalNewsItem[] {
  return LOCAL_NEWS.filter((n) => n.publishedAt <= now);
}

export function isNewsPopupDue(item: LocalNewsItem, now = new Date()): boolean {
  return now >= item.popupFrom && now < item.popupUntil && !isNewsRead(item.id);
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

/** O'qilgan yangiliklar ro'yxati (localStorage, har bir user uchun alohida). */
export function useReadNewsIds(): string[] {
  const snapshot = useSyncExternalStore(subscribe, () => {
    const key = storageKey();
    return key ? (localStorage.getItem(key) ?? '[]') : '[]';
  });
  try {
    const parsed = JSON.parse(snapshot);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
