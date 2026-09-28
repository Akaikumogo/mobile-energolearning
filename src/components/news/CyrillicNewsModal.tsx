import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Languages } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useCyrillicNewsText } from '@/hooks/useCyrillicNewsText';
import {
  CYRILLIC_NEWS_ID,
  LOCAL_NEWS,
  isNewsPopupDue,
  markNewsRead,
} from '@/utils/news';

export function CyrillicNewsModal() {
  const { lang, setLang } = useTranslation();
  const text = useCyrillicNewsText();
  const [open, setOpen] = useState(() => {
    const item = LOCAL_NEWS.find((n) => n.id === CYRILLIC_NEWS_ID);
    return !!item && isNewsPopupDue(item) && lang !== 'uz-cyrl';
  });

  const close = (tryIt: boolean) => {
    markNewsRead(CYRILLIC_NEWS_ID);
    setOpen(false);
    if (tryIt) setLang('uz-cyrl');
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="cyrillic-news"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cyrillic-news-title"
        >
          <motion.div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-[var(--learn-gold)]">
                <Languages className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-[var(--learn-gold)]">
                  {text.newsLabel}
                </p>
                <h2
                  id="cyrillic-news-title"
                  className="text-lg font-extrabold leading-tight text-slate-900 dark:text-white"
                >
                  {text.title}
                </h2>
              </div>
            </div>
            <p className="mb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {text.body}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => close(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-slate-200"
              >
                {text.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 dark:bg-[var(--learn-blue)]"
              >
                {text.tryLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
