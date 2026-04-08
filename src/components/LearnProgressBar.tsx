import clsx from 'clsx';

export default function LearnProgressBar({
  value,
  className,
  colorClassName,
  trackClassName,
}: {
  value: number;
  className?: string;
  colorClassName?: string;
  trackClassName?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className={clsx(
        'h-2 w-full overflow-hidden rounded-full',
        trackClassName ?? 'bg-slate-200 dark:bg-[var(--learn-border)]',
        className,
      )}
    >
      <div
        className={clsx(
          'h-full rounded-full transition-[width] duration-300 ease-out',
          colorClassName ??
            'bg-amber-500 dark:bg-[var(--learn-gold)]',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
