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
import mobileApi, { type AudioBookDetail } from '@/services/api';

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
  playQueue: (items: AudioQueueItem[], startIndex?: number, startSeekSeconds?: number) => void;
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

  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.preload = 'metadata';
  }

  const loadQueueIndex = useCallback(
    async (index: number, opts?: { autoplay?: boolean }) => {
      const audio = audioRef.current;
      const item = queue[index];
      if (!audio || !item) return;

      // Reset basic playback info early to reduce UI lag.
      setProgressSeconds(0);
      setDurationSeconds(0);

      audio.src = item.audioUrl;
      audio.load();

      if (opts?.autoplay !== false) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          // Autoplay can be blocked in some browsers.
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

  // Whenever queue changes (or start index changes), load that item into the audio element.
  useEffect(() => {
    if (!queue.length) return;
    void loadQueueIndex(queueIndex, { autoplay: true });
  }, [queue, queueIndex, loadQueueIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const t = audio.currentTime || 0;
      setProgressSeconds(t);

      // Persist "last listened" throttled (once per ~2s).
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
          // Queue finished: stop and hide mini-player until user starts again.
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
  }, []);

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

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error('useAudioPlayer must be used inside <AudioPlayerProvider>');
  }
  return ctx;
}
