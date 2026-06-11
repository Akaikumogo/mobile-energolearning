import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { LastListened } from '@/pages/learn/audio/types';
import mobileApi, {
  resolveMediaUrl,
  type AudioBookDetail,
} from '@/services/api';

export type AudioQueueItem = {
  bookId: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  paragraphId: string;
  text: string;
  audioUrl: string;
};

type AudioPlayerState = {
  currentBookId: string | null;
  currentChapterId: string | null;
  currentParagraphId: string | null;
  queue: AudioQueueItem[];
  queueIndex: number;
  isPlaying: boolean;
  progressSeconds: number;
  durationSeconds: number;
};

type AudioPlayerActions = {
  playQueue: (
    items: AudioQueueItem[],
    startIndex?: number,
    startSeekSeconds?: number,
  ) => void;
  togglePlayPause: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  skipNext: () => void;
  skipPrev: () => void;
  getLastListened: () => LastListened | null;
  resumeLastListened: () => void;
};

type AudioPlayerContextValue = AudioPlayerState & AudioPlayerActions;

const AUDIO_LAST_LISTENED_KEY = 'electrolearn.audio.lastListened.v1';
const AUDIO_QUEUE_STATE_KEY = 'electrolearn.audio.queueState.v1';

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readLastListened(): LastListened | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUDIO_LAST_LISTENED_KEY);
  return safeJsonParse<LastListened>(raw);
}

function writeLastListened(value: LastListened) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUDIO_LAST_LISTENED_KEY, JSON.stringify(value));
}

function flattenBook(book: AudioBookDetail): AudioQueueItem[] {
  const chapters = [...book.chapters].sort((a, b) => a.order - b.order);
  const items: AudioQueueItem[] = [];
  for (const ch of chapters) {
    const ps = [...ch.paragraphs].sort((a, b) => a.order - b.order);
    for (const p of ps) {
      items.push({
        bookId: book.id,
        bookTitle: book.title,
        chapterId: ch.id,
        chapterTitle: ch.title,
        paragraphId: p.id,
        text: p.text,
        audioUrl: p.audioUrl,
      });
    }
  }
  return items;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingSeekSecondsRef = useRef<number | null>(null);
  const lastPersistAtRef = useRef<number>(0);

  const [queue, setQueue] = useState<AudioQueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const current = queue[queueIndex] ?? null;
  const currentBookId = current?.bookId ?? null;
  const currentChapterId = current?.chapterId ?? null;
  const currentParagraphId = current?.paragraphId ?? null;

  // ─── HTMLAudioElement singleton ────────────────────────────────────────
  // `playsInline` + `preload="auto"` Android WebView va iOS Safari uchun zarur.
  // Background ishlashi uchun audio elementni DOM ga qo'shamiz (body) — bu shart
  // emas, lekin ba'zi browserlarda detached elementlar audio focusni ushlab tura
  // olmaydi. Document hayot davomida bitta singleton ishlatamiz.
  if (!audioRef.current && typeof window !== 'undefined') {
    const a = new Audio();
    a.preload = 'auto';
    a.crossOrigin = 'anonymous';
    // @ts-expect-error: playsInline DOM attribute available on HTMLMediaElement in modern browsers.
    a.playsInline = true;
    audioRef.current = a;
  }

  const loadQueueIndex = useCallback(
    async (index: number, opts?: { autoplay?: boolean }) => {
      const audio = audioRef.current;
      const item = queue[index];
      if (!audio || !item) return;

      setProgressSeconds(0);
      setDurationSeconds(0);

      audio.src = resolveMediaUrl(item.audioUrl);
      audio.load();

      if (opts?.autoplay !== false) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    },
    [queue],
  );

  const playQueue = useCallback(
    (items: AudioQueueItem[], startIndex = 0, startSeekSeconds?: number) => {
      setQueue(items);
      setQueueIndex(Math.max(0, Math.min(items.length - 1, startIndex)));
      if (typeof startSeekSeconds === 'number' && startSeekSeconds > 0) {
        pendingSeekSecondsRef.current = startSeekSeconds;
      } else {
        pendingSeekSecondsRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!queue.length) return;
    void loadQueueIndex(queueIndex, { autoplay: true });
  }, [queue, queueIndex, loadQueueIndex]);

  // ─── Persist minimal queue snapshot (last item + index) ────────────────
  useEffect(() => {
    if (!queue.length) return;
    try {
      localStorage.setItem(
        AUDIO_QUEUE_STATE_KEY,
        JSON.stringify({ queueIndex, bookId: queue[0].bookId }),
      );
    } catch {
      /* ignore */
    }
  }, [queue, queueIndex]);

  // ─── Audio element event wiring ────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const t = audio.currentTime || 0;
      setProgressSeconds(t);

      const now = Date.now();
      if (!current || now - lastPersistAtRef.current < 2000) return;
      lastPersistAtRef.current = now;
      writeLastListened({
        bookId: current.bookId,
        chapterId: current.chapterId,
        paragraphId: current.paragraphId,
        positionSeconds: t,
        updatedAtIso: new Date().toISOString(),
      });
    };

    const onLoadedMeta = () => {
      setDurationSeconds(audio.duration || 0);
      const pending = pendingSeekSecondsRef.current;
      if (typeof pending === 'number' && pending > 0) {
        pendingSeekSecondsRef.current = null;
        try {
          audio.currentTime = pending;
        } catch {
          /* ignore */
        }
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      if (!current) return;
      writeLastListened({
        bookId: current.bookId,
        chapterId: current.chapterId,
        paragraphId: current.paragraphId,
        positionSeconds: audio.currentTime || 0,
        updatedAtIso: new Date().toISOString(),
      });
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgressSeconds(0);
      setDurationSeconds(0);
      setQueueIndex((i) => {
        const next = i + 1;
        if (next >= queue.length) {
          setQueue([]);
          return 0;
        }
        return next;
      });
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [queue, current]);

  // ─── Media Session API (lockscreen / notification controls) ────────────
  // Android (Chrome/WebView) va iOS Safari MediaSession metadata orqali
  // tizim notification panelida boshqaruv tugmalarini ko'rsatadi va audio
  // ekran o'chgan paytda ham davom etadi.
  const togglePlayPauseRef = useRef<() => void>(() => {});
  const skipNextRef = useRef<() => void>(() => {});
  const skipPrevRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (!current) {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.text || 'Audiokitob',
        artist: current.chapterTitle || '',
        album: current.bookTitle || 'ElektroLearn',
        artwork: [
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {
      /* ignore — eski browserlarda MediaMetadata konstruktor mavjud emas */
    }

    const setHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        /* ignore — ba'zi actionlar qo'llab-quvvatlanmasligi mumkin */
      }
    };

    setHandler('play', () => togglePlayPauseRef.current());
    setHandler('pause', () => togglePlayPauseRef.current());
    setHandler('nexttrack', () => skipNextRef.current());
    setHandler('previoustrack', () => skipPrevRef.current());
    setHandler('seekbackward', () => {
      const a = audioRef.current;
      if (!a) return;
      try {
        a.currentTime = Math.max(0, (a.currentTime || 0) - 10);
      } catch {
        /* ignore */
      }
    });
    setHandler('seekforward', () => {
      const a = audioRef.current;
      if (!a) return;
      try {
        a.currentTime = Math.min(a.duration || 0, (a.currentTime || 0) + 10);
      } catch {
        /* ignore */
      }
    });
    setHandler('seekto', (details: MediaSessionActionDetails) => {
      const a = audioRef.current;
      if (!a) return;
      const seek = details.seekTime;
      if (typeof seek === 'number') {
        try {
          a.currentTime = seek;
        } catch {
          /* ignore */
        }
      }
    });
    setHandler('stop', () => {
      const a = audioRef.current;
      if (!a) return;
      a.pause();
      setIsPlaying(false);
    });

    return () => {
      const actions: MediaSessionAction[] = [
        'play',
        'pause',
        'nexttrack',
        'previoustrack',
        'seekbackward',
        'seekforward',
        'seekto',
        'stop',
      ];
      for (const a of actions) setHandler(a, null);
    };
  }, [current, isPlaying]);

  // ─── Position state for system seek bar ────────────────────────────────
  useEffect(() => {
    if (
      typeof navigator === 'undefined' ||
      !('mediaSession' in navigator) ||
      !current
    ) {
      return;
    }
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return;
    try {
      navigator.mediaSession.setPositionState?.({
        duration: durationSeconds,
        playbackRate: audioRef.current?.playbackRate ?? 1,
        position: Math.min(progressSeconds, durationSeconds),
      });
    } catch {
      /* ignore */
    }
  }, [progressSeconds, durationSeconds, current]);

  // ─── Page visibility: WebView/PWA o'rtani bossa, audio davom etishi kerak ─
  // visibilitychange da AVTOMATIK pause QILMAYMIZ — bu eng asosiy nuqta. Audio
  // tag o'zi tizim audio focusiga ega, biz hech narsa qilmasligimiz kerak.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handler = () => {
      // hech nima qilmaymiz — audio tabga emas, document hayot doirasiga bog'liq
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    void audio.play().catch(() => setIsPlaying(false));
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = Math.max(0, seconds);
    } catch {
      /* ignore */
    }
  }, []);

  const skipNext = useCallback(() => {
    setQueueIndex((i) => {
      if (!queue.length) return 0;
      return Math.min(queue.length - 1, i + 1);
    });
  }, [queue.length]);

  const skipPrev = useCallback(() => {
    setQueueIndex((i) => Math.max(0, i - 1));
  }, []);

  // MediaSession handlerlari hozirgi callbacklarni doim ushlab tursin
  useEffect(() => {
    togglePlayPauseRef.current = togglePlayPause;
    skipNextRef.current = skipNext;
    skipPrevRef.current = skipPrev;
  }, [togglePlayPause, skipNext, skipPrev]);

  const getLastListened = useCallback(() => readLastListened(), []);

  const resumeLastListened = useCallback(() => {
    const last = readLastListened();
    if (!last) return;
    void (async () => {
      const book = await mobileApi.getAudioBook(last.bookId).catch(() => null);
      if (!book) return;
      const items = flattenBook(book);
      const startIndex = Math.max(
        0,
        items.findIndex((x) => x.paragraphId === last.paragraphId),
      );
      playQueue(items, startIndex, Math.max(0, last.positionSeconds || 0));
    })();
  }, [playQueue]);

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      currentBookId,
      currentChapterId,
      currentParagraphId,
      queue,
      queueIndex,
      isPlaying,
      progressSeconds,
      durationSeconds,
      playQueue,
      togglePlayPause,
      pause,
      resume,
      seek,
      skipNext,
      skipPrev,
      getLastListened,
      resumeLastListened,
    }),
    [
      currentBookId,
      currentChapterId,
      currentParagraphId,
      queue,
      queueIndex,
      isPlaying,
      progressSeconds,
      durationSeconds,
      playQueue,
      togglePlayPause,
      pause,
      resume,
      seek,
      skipNext,
      skipPrev,
      getLastListened,
      resumeLastListened,
    ],
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error('useAudioPlayer must be used inside <AudioPlayerProvider>');
  }
  return ctx;
}
