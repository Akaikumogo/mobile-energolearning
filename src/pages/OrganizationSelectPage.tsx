import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi, { type UserProfile } from '@/services/api';
import { queryClient } from '@/queryClient';
import { readCachedUser } from '@/utils/auth';
import clsx from 'clsx';

function cacheUser(user: UserProfile) {
  localStorage.setItem('user', JSON.stringify(user));
}

export default function OrganizationSelectPage() {
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const cached = readCachedUser();
  const fetchOrgs = Boolean(cached && cached.role === 'USER');

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['public-organizations'],
    queryFn: () => mobileApi.getPublicOrganizations(),
    enabled: fetchOrgs,
  });

  const joinMut = useMutation({
    mutationFn: (organizationId: string) =>
      mobileApi.joinOrganization(organizationId),
    onSuccess: (profile) => {
      cacheUser(profile);
      queryClient.setQueryData(['me'], profile);
      navigate('/learn', { replace: true });
    },
  });

  if (!cached) {
    return <Navigate to="/login" replace />;
  }

  if (cached.role !== 'USER') {
    return (
      <div className="min-h-dvh bg-slate-50 p-6 dark:bg-slate-950">
        <p className="mt-20 text-center text-slate-600 dark:text-slate-400">
          {t({
            uz: 'Bu qadam faqat o‘quvchilar uchun.',
            en: 'This step is for learners only.',
            ru: 'Этот шаг только для учащихся.',
          })}
        </p>
        <button
          type="button"
          onClick={() => navigate('/learn', { replace: true })}
          className="mx-auto mt-6 block rounded-xl bg-blue-600 px-6 py-3 text-white"
        >
          OK
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as typeof lang)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="uz">O&apos;zbekcha</option>
          <option value="uz-cyrl">Ўзбекча</option>
        </select>
        <ThemeToggle />
      </div>

      <motion.div
        className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-safe pt-16"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t({
                uz: 'Tashkilotni tanlang',
                en: 'Choose organization',
                ru: 'Выберите организацию',
              })}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t({
                uz: 'O‘qish davom etishi uchun biriktiring.',
                en: 'Link to continue your training.',
                ru: 'Привязка для продолжения обучения.',
              })}
            </p>
          </div>
        </div>

        {joinMut.isError && (
          <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {t({
              uz: 'Tanlashda xatolik',
              en: 'Could not join',
              ru: 'Не удалось выбрать',
            })}
          </p>
        )}

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {isLoading && (
            <p className="text-center text-slate-500">
              {t({ uz: 'Yuklanmoqda…', en: 'Loading…', ru: 'Загрузка…' })}
            </p>
          )}
          {!isLoading &&
            orgs.map((o) => (
              <motion.button
                key={o.id}
                type="button"
                disabled={joinMut.isPending}
                whileTap={{ scale: 0.99 }}
                onClick={() => joinMut.mutate(o.id)}
                className={clsx(
                  'flex w-full items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left font-medium text-slate-900 shadow-sm transition hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white',
                  joinMut.isPending && 'opacity-60',
                )}
              >
                {o.name}
              </motion.button>
            ))}
        </div>
      </motion.div>
    </div>
  );
}
