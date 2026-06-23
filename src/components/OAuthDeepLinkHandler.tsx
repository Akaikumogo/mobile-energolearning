import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

function parseOAuthCallbackUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl.replace('uz.elektroxavfsizlik.app://', 'https://local/'));
    if (!url.pathname.includes('oauth/callback')) return null;
    const code = url.searchParams.get('code');
    if (!code) return null;
    return {
      code,
      state: url.searchParams.get('state'),
    };
  } catch {
    return null;
  }
}

export function OAuthDeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeListener: (() => void) | undefined;

    void (async () => {
      const { App } = await import('@capacitor/app');
      const launch = await App.getLaunchUrl();
      if (launch?.url) {
        const parsed = parseOAuthCallbackUrl(launch.url);
        if (parsed) {
          const qs = new URLSearchParams({ code: parsed.code });
          if (parsed.state) qs.set('state', parsed.state);
          navigate(`/oauth/callback?${qs.toString()}`, { replace: true });
        }
      }

      const handle = await App.addListener('appUrlOpen', (event: { url: string }) => {
        const parsed = parseOAuthCallbackUrl(event.url);
        if (!parsed) return;
        const qs = new URLSearchParams({ code: parsed.code });
        if (parsed.state) qs.set('state', parsed.state);
        navigate(`/oauth/callback?${qs.toString()}`, { replace: true });
      });
      removeListener = () => {
        void handle.remove();
      };
    })();

    return () => {
      removeListener?.();
    };
  }, [navigate]);

  return null;
}
