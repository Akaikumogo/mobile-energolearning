import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import mobileApi, { type UserProfile } from '@/services/api';

function cacheUser(user: UserProfile) {
  localStorage.setItem('user', JSON.stringify(user));
}

function resolveCallbackRedirectUri() {
  const stored = localStorage.getItem('oauth_redirect_uri')?.trim();
  if (stored) return stored;
  return `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, '');
}

function resolveCallbackClient(redirectUri: string): 'mobile' | 'web' {
  const stored = localStorage.getItem('oauth_client');
  if (stored === 'web' || stored === 'mobile') return stored;
  return /^https?:\/\//i.test(redirectUri) ? 'web' : 'mobile';
}

function formatExchangeError(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Kirish amalga oshmadi';
}

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const exchange = useMutation({
    mutationFn: async () => {
      const code = params.get('onetime') ?? params.get('code');
      if (!code) throw new Error('OAuth code topilmadi');
      const redirectUri = resolveCallbackRedirectUri();
      const client = resolveCallbackClient(redirectUri);
      const state = params.get('state') ?? undefined;
      const expectedState = localStorage.getItem('oauth_state');
      if (expectedState && state && expectedState !== state) {
        throw new Error('OAuth state mos kelmadi');
      }
      return mobileApi.exchangeEnergoIdCode(code, redirectUri, state, client);
    },
    onSuccess: (res) => {
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_redirect_uri');
      localStorage.removeItem('oauth_client');
      cacheUser(res.data.user);
      const u = res.data.user;
      if (u.role === 'USER' && (u.organizations?.length ?? 0) === 0) {
        navigate('/organization', { replace: true });
      } else {
        navigate('/learn', { replace: true });
      }
    },
    onError: (e: unknown) => {
      setError(formatExchangeError(e));
    },
  });

  useEffect(() => {
    if (!params.get('onetime') && !params.get('code')) {
      setError('OAuth code topilmadi');
      return;
    }
    exchange.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid min-h-dvh place-items-center bg-slate-100 px-6 dark:bg-slate-950">
      <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow dark:bg-slate-900">
        {error ? (
          <>
            <p className="mb-4 text-sm text-red-600 dark:text-red-300">{error}</p>
            <button
              type="button"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => navigate('/login', { replace: true })}
            >
              Qayta urinish
            </button>
          </>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Energo ID orqali kirilmoqda…
          </p>
        )}
      </div>
    </div>
  );
}
