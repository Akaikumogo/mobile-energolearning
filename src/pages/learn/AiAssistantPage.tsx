import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Bot, LoaderCircle, SendHorizonal, Sparkles, User } from 'lucide-react';
import clsx from 'clsx';
import { BACKEND_ORIGIN } from '@/services/api';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
};

const STARTER_PROMPTS = [
  'Men qaysi savollarda ko‘p xato qilyapman?',
  'Qaysi mavzular ustida ko‘proq ishlashim kerak?',
  'Hozir qaysi darajadaman?',
  'Reytingim qanday?',
  'Menga imtihon sanasi belgilanganmi?',
];

export default function AiAssistantPage() {
  const socketRef = useRef<Socket | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<'connecting' | 'ready' | 'error'>(
    'connecting',
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Assalomu alaykum. Men sizning progress, xatolar, daraja, reyting va imtihon holatingiz bo‘yicha yordam bera olaman.',
    },
  ]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setStatus('error');
      return;
    }

    const socket = io(`${BACKEND_ORIGIN}/ai-chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setStatus('ready'));
    socket.on('assistant_ready', () => setStatus('ready'));
    socket.on('connect_error', () => setStatus('error'));
    socket.on(
      'assistant_history',
      ({
        messages: history,
      }: {
        messages?: Array<{
          id: string;
          role: 'user' | 'assistant';
          content: string;
          createdAt: string;
        }>;
      }) => {
        if (!history?.length) return;
        setMessages(history);
      },
    );
    socket.on('disconnect', () => setStatus('error'));
    socket.on('assistant_started', () => {
      setIsStreaming(true);
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', content: '' },
      ]);
    });
    socket.on('assistant_chunk', ({ chunk }: { chunk?: string }) => {
      const text = chunk ?? '';
      if (!text) return;
      setMessages((prev) => {
        const next = [...prev];
        const last = next.at(-1);
        if (!last || last.role !== 'assistant') return next;
        next[next.length - 1] = {
          ...last,
          content: `${last.content}${text}`,
        };
        return next;
      });
    });
    socket.on('assistant_done', ({ message }: { message?: string }) => {
      setIsStreaming(false);
      if (!message?.trim()) {
        setMessages((prev) => {
          const next = [...prev];
          const last = next.at(-1);
          if (last?.role === 'assistant' && !last.content.trim()) {
            next[next.length - 1] = {
              ...last,
              content: 'Javob bo‘sh qaytdi. Qayta urinib ko‘ring.',
            };
          }
          return next;
        });
      }
    });
    socket.on('assistant_error', ({ message }: { message?: string }) => {
      setIsStreaming(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            message ??
            'AI yordamchi bilan bog‘lanishda xato bo‘ldi. Keyinroq urinib ko‘ring.',
        },
      ]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isStreaming]);

  const sendMessage = (text: string) => {
    const message = text.trim();
    if (!message || isStreaming || !socketRef.current) return;

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: message },
    ]);
    setDraft('');
    socketRef.current.emit('chat_message', { message });
  };

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-slate-100 via-white to-amber-50/40 dark:from-[var(--learn-bg)] dark:via-[var(--learn-surface)] dark:to-[#0f1726]">
      <div className="border-b border-slate-200/80 px-safe-4 py-4 dark:border-[var(--learn-border)]">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              AI yordamchi
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-[var(--learn-muted)]">
              Progress, xatolar, daraja, reyting va imtihon bo‘yicha savol bering.
            </p>
            <p
              className={clsx(
                'mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
                status === 'ready'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : status === 'error'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
              )}
            >
              {status === 'ready'
                ? 'Ulandi'
                : status === 'error'
                  ? 'Ulanmadi'
                  : 'Ulanmoqda'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              disabled={isStreaming || status !== 'ready'}
              className="shrink-0 rounded-full border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-amber-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-slate-200"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={viewportRef}
        className="flex-1 space-y-3 overflow-y-auto px-safe-4 py-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={clsx(
                'max-w-[85%] rounded-3xl px-4 py-3 shadow-sm',
                message.role === 'user'
                  ? 'rounded-br-md bg-slate-900 text-white dark:bg-[var(--learn-blue)]'
                  : 'rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-slate-100',
              )}
            >
              <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold opacity-80">
                {message.role === 'user' ? (
                  <>
                    <User className="h-3.5 w-3.5" />
                    Siz
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    AI mentor
                  </>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6">
                {message.content || (isStreaming ? '...' : '')}
              </p>
            </div>
          </div>
        ))}
        {isStreaming ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-slate-300">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Javob yozilmoqda...
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-200 bg-white/90 px-safe-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]/96">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={1}
            placeholder="Masalan: qaysi mavzuda ko‘proq adashyapman?"
            className="max-h-32 min-h-[48px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:bg-white dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-white"
          />
          <button
            type="button"
            onClick={() => sendMessage(draft)}
            disabled={!draft.trim() || isStreaming || status !== 'ready'}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
