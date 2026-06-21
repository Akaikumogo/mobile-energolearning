import { useEffect, type ReactNode } from 'react';
import mobileApi from '@/services/api';

const HEARTBEAT_MS = 60_000;

/** Mobile ilova ochiq paytda session va online vaqtni yangilaydi. */
export function ActivityHeartbeatProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    let stopped = false;

    const tick = () => {
      if (stopped) return;
      void mobileApi.sendHeartbeat().catch(() => undefined);
    };

    tick();
    const id = window.setInterval(tick, HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return children;
}
