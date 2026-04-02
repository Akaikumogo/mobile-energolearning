import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

type CheerfulBackLinkProps = {
  to: string;
  children: React.ReactNode;
  className?: string;
  /** pill = compact top nav; cta = larger button (e.g. after quiz) */
  variant?: 'pill' | 'cta';
};

export function CheerfulBackLink({
  to,
  children,
  className,
  variant = 'pill',
}: CheerfulBackLinkProps) {
  if (variant === 'cta') {
    return (
      <motion.div
        className={clsx('inline-block', className)}
        whileTap={{ scale: 0.98 }}
      >
        <Link
          to={to}
          className="group inline-flex items-center justify-center gap-2.5 rounded-2xl border-2 border-blue-400/80 bg-blue-600 px-7 py-3.5 text-base font-extrabold text-white shadow-lg shadow-blue-600/30 transition hover:brightness-110 active:brightness-95 dark:border-[var(--learn-blue)] dark:bg-[var(--learn-blue)] dark:shadow-[0_8px_28px_rgba(61,142,255,0.35)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition group-hover:bg-white/30">
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </span>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={clsx('mb-4 inline-block', className)}
      whileTap={{ scale: 0.97 }}
    >
      <Link
        to={to}
        className="group inline-flex items-center gap-2.5 rounded-2xl border-2 border-blue-200/90 bg-white/95 py-2 pl-2 pr-4 text-sm font-extrabold text-blue-700 shadow-md transition hover:border-blue-400 hover:bg-sky-50 hover:shadow-lg dark:border-[var(--learn-blue)]/50 dark:bg-[var(--learn-card)] dark:text-[var(--learn-blue)] dark:hover:border-[var(--learn-blue)] dark:hover:bg-[#1a2d4d]/80 dark:hover:shadow-[0_0_22px_rgba(61,142,255,0.22)]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/60 bg-blue-600 text-white shadow-md ring-2 ring-white/25 transition group-hover:scale-[1.03] group-hover:ring-blue-200/50 dark:border-[var(--learn-blue)] dark:bg-[var(--learn-blue)] dark:ring-[var(--learn-border)]">
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span>{children}</span>
      </Link>
    </motion.div>
  );
}
