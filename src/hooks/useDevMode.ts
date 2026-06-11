import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const KEY = 'energolearn_dev_mode';

/**
 * ?mode=dev bo'lsa — dev rejimi yonadi va sessionStorage'ga saqlanadi.
 * Sahifalar orasida navigatsiya qilganda ham saqlanib qoladi.
 * Brauzer tab yopilganda avtomatik o'chadi.
 */
export function useDevMode(): boolean {
  const [searchParams] = useSearchParams();
  const fromUrl = searchParams.get('mode') === 'dev';

  useEffect(() => {
    if (fromUrl) {
      sessionStorage.setItem(KEY, '1');
    }
  }, [fromUrl]);

  return fromUrl || sessionStorage.getItem(KEY) === '1';
}

/** Hook'siz tekshirish uchun (RequireAuth va boshqalar) */
export function isDevModeActive(): boolean {
  return (
    new URLSearchParams(window.location.search).get('mode') === 'dev' ||
    sessionStorage.getItem(KEY) === '1'
  );
}
