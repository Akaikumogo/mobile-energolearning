import { useEffect, useState } from 'react';
import { queryClient } from '@/queryClient';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Keyingi energiya (+1) keladigan vaqtgacha jonli countdown (mm:ss yoki
 * h:mm:ss). Taymer tugaganda `progress-me` avtomatik yangilanadi — server
 * yangi energiya sonini va keyingi `nextRegenAt` ni qaytaradi.
 */
export function useEnergyCountdown(
  nextRegenAt: string | null | undefined,
): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!nextRegenAt) {
      setLabel(null);
      return;
    }
    const target = new Date(nextRegenAt).getTime();
    if (Number.isNaN(target)) {
      setLabel(null);
      return;
    }

    let fired = false;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setLabel('00:00');
        if (!fired) {
          fired = true;
          queryClient.invalidateQueries({ queryKey: ['progress-me'] });
        }
        return;
      }
      const totalSec = Math.ceil(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setLabel(h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextRegenAt]);

  return label;
}
