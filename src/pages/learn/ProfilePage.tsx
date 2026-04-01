import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi from '@/services/api';
import { queryClient } from '@/queryClient';

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => mobileApi.me(),
  });

  const { data: progress } = useQuery({
    queryKey: ['progress-me'],
    queryFn: () => mobileApi.getMyProgress(),
  });

  const logout = async () => {
    await mobileApi.logout();
    queryClient.clear();
    navigate('/welcome', { replace: true });
  };

  return (
    <div className="px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <p className="text-xs font-semibold uppercase text-slate-500">
          {t({ uz: 'Foydalanuvchi', en: 'User', ru: 'Пользователь' })}
        </p>
        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
          {me ? `${me.firstName} ${me.lastName}` : '—'}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {me?.email}
        </p>
        {me?.organizations?.length ? (
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            {me.organizations.map((o) => o.name).join(', ')}
          </p>
        ) : null}
      </motion.div>

      <div className="mb-6 rounded-3xl border border-amber-200/60 bg-amber-50/80 p-5 dark:border-amber-900/40 dark:bg-amber-950/30">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          {progress?.badge.label ?? '—'}
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          {progress?.totalXp ?? 0} XP
        </p>
      </div>

      <button
        type="button"
        onClick={() => void logout()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-4 font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
      >
        <LogOut className="h-5 w-5" />
        {t({ uz: 'Chiqish', en: 'Log out', ru: 'Выход' })}
      </button>
    </div>
  );
}
