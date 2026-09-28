import { latinTextToCyrillic } from '@/utils/latinToCyrillic';

/** Backend kontenti bir tilda (lotin) saqlanadi — `uz-cyrl` tanlanganda shu kalitlar kirillga o'giriladi. */
const TEXT_KEYS = new Set([
  'title',
  'content',
  'prompt',
  'optionText',
  'matchText',
  'head',
  'items',
  'text',
  'description',
  'examTitle',
  'chapterTitle',
  'body',
  'holidayName',
]);

/** Faqat o'quv kontenti qaytaradigan endpointlar (ism, email, URL'larga tegmaymiz). */
const CONTENT_URL_PATTERNS: RegExp[] = [
  /^\/?progress\/(me|level\/)/,
  /^\/?theories\//,
  /^\/?mobile\/daily-plan\//,
  /^\/?audio-books/,
  /^\/?library-documents/,
  /^\/?exams\/live\//,
  /^\/?notifications\/me/,
];

export function isCyrillicLangSelected(): boolean {
  try {
    return localStorage.getItem('lang') === 'uz-cyrl';
  } catch {
    return false;
  }
}

export function isContentUrl(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/api(?=\/)/i, '');
  return CONTENT_URL_PATTERNS.some((re) => re.test(path));
}

function convertValue(value: unknown): unknown {
  if (typeof value === 'string') return latinTextToCyrillic(value);
  if (Array.isArray(value)) return value.map(convertValue);
  return value;
}

export function transliterateContent<T>(data: T): T {
  if (Array.isArray(data)) return data.map(transliterateContent) as T;
  if (!data || typeof data !== 'object') return data;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (TEXT_KEYS.has(key) && (typeof value === 'string' || Array.isArray(value))) {
      out[key] =
        Array.isArray(value) && value.some((v) => v && typeof v === 'object')
          ? transliterateContent(value)
          : convertValue(value);
    } else if (value && typeof value === 'object') {
      out[key] = transliterateContent(value);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}
