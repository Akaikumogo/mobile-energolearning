import { Moon, Sun } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import clsx from 'clsx';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useApp();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Light mode' : 'Dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={clsx(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-amber-200',
        className,
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
