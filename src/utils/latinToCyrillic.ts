import TransliteratorExport from 'lotin-kirill';

// Paket CommonJS: Node ESM `default`ni modul obyekti sifatida beradi, Vite esa klassning o'zini.
const Transliterator =
  (TransliteratorExport as unknown as { default?: typeof TransliteratorExport })
    .default ?? TransliteratorExport;

const transliterator = new Transliterator([
  ['sentabr', 'сентябрь'],
  ['oktabr', 'октябрь'],
  ['tsex', 'цех'],
  ['ElektroLearn', 'ElektroLearn'],
  ['XP', 'XP'],
  ['QR', 'QR'],
  ['AI', 'AI'],
  ['ID', 'ID'],
  ['PDF', 'PDF'],
]);

const CACHE_LIMIT = 2000;
const cache = new Map<string, string>();

const HAS_LATIN = /[A-Za-z]/;

export const latinTextToCyrillic = (text: string): string => {
  if (!text || !HAS_LATIN.test(text)) return text;
  const cached = cache.get(text);
  if (cached !== undefined) return cached;

  let out: string;
  try {
    out = transliterator.textToCyrillic(text);
  } catch {
    out = text;
  }

  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(text, out);
  return out;
};
