import axios, { type AxiosError } from 'axios';
import type { EmployeeCertificate } from '@/components/certificate/types';

export type { EmployeeCertificate };

const API_BASE_STORAGE_KEY = 'elektrolearn_api_base_v2';

function isIpAddress(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '');
  if (host.includes(':')) return true;
  const parts = host.split('.');
  return (
    parts.length === 4 &&
    parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  );
}

function normalizeApiBase(url: string): string {
  let trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return '/api';

  if (/^https?:\/\//i.test(trimmed)) {
    const parsed = new URL(trimmed);
    const isLocalhost =
      parsed.hostname === 'localhost' || parsed.hostname.endsWith('.localhost');
    parsed.protocol = isIpAddress(parsed.hostname)
      ? 'http:'
      : isLocalhost
        ? parsed.protocol
        : 'https:';
    trimmed = parsed.toString().replace(/\/+$/, '');
  }

  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

const PRIMARY_API_BASE_URL = normalizeApiBase(
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
    '/api',
);

/** Asosiy domen ishlamasa ishlatiladigan rezerv backend. */
const FALLBACK_API_BASE_URL = normalizeApiBase(
  (import.meta.env.VITE_API_FALLBACK_URL as string | undefined)?.trim() ||
    PRIMARY_API_BASE_URL,
);

function readStoredApiBase(): string | null {
  try {
    const raw = sessionStorage.getItem(API_BASE_STORAGE_KEY)?.trim();
    return raw ? normalizeApiBase(raw) : null;
  } catch {
    return null;
  }
}

function persistApiBase(url: string) {
  try {
    sessionStorage.setItem(API_BASE_STORAGE_KEY, url);
  } catch {
    /* ignore */
  }
}

function defaultApiBaseForCurrentHost(): string {
  return typeof window !== 'undefined' && isIpAddress(window.location.hostname)
    ? FALLBACK_API_BASE_URL
    : PRIMARY_API_BASE_URL;
}

function isStoredApiBaseCompatible(url: string): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const parsed = new URL(url, window.location.origin);
    const pageUsesIp = isIpAddress(window.location.hostname);
    return pageUsesIp
      ? parsed.protocol === 'http:' && isIpAddress(parsed.hostname)
      : parsed.protocol === 'https:' && !isIpAddress(parsed.hostname);
  } catch {
    return false;
  }
}

const storedApiBaseUrl = readStoredApiBase();
let activeApiBaseUrl =
  storedApiBaseUrl && isStoredApiBaseCompatible(storedApiBaseUrl)
    ? storedApiBaseUrl
    : defaultApiBaseForCurrentHost();

/** Joriy backend origin (media, socket). Failoverda yangilanadi. */
export let BACKEND_ORIGIN = activeApiBaseUrl.replace(/\/api\/?$/, '');

function setActiveApiBaseUrl(url: string) {
  activeApiBaseUrl = normalizeApiBase(url);
  BACKEND_ORIGIN = activeApiBaseUrl.replace(/\/api\/?$/, '');
  persistApiBase(activeApiBaseUrl);
}

function otherApiBaseUrl(current: string): string | null {
  const cur = normalizeApiBase(current);
  if (cur === PRIMARY_API_BASE_URL && PRIMARY_API_BASE_URL !== FALLBACK_API_BASE_URL) {
    return FALLBACK_API_BASE_URL;
  }
  if (cur === FALLBACK_API_BASE_URL && PRIMARY_API_BASE_URL !== FALLBACK_API_BASE_URL) {
    return PRIMARY_API_BASE_URL;
  }
  if (cur !== FALLBACK_API_BASE_URL) return FALLBACK_API_BASE_URL;
  if (cur !== PRIMARY_API_BASE_URL) return PRIMARY_API_BASE_URL;
  return null;
}

function shouldFailoverToReserve(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  if (error.code === 'ERR_CANCELED') return false;
  if (error.config?.headers?.['X-Skip-Api-Failover'] === '1') return false;
  const status = error.response?.status;
  if (status === 502 || status === 503 || status === 504) return true;
  if (error.response) return false;
  const code = error.code;
  return (
    code === 'ERR_NETWORK' ||
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    !code
  );
}

/** WebSocket + Socket.IO base (global prefix `/api` is HTTP-only). */
export function getExamLiveSocketUrl(): string {
  return BACKEND_ORIGIN;
}

/**
 * Backend `/uploads/...` kabi nisbiy URL qaytarishi mumkin (audioUrl, coverUrl).
 * Mobile (Capacitor WebView) hostda http://localhost ishlatiladi shu sababli
 * media manbalarni har doim absolyut URL ga aylantiramiz.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) {
    const protocol = BACKEND_ORIGIN.startsWith('http://') ? 'http:' : 'https:';
    return `${protocol}${trimmed}`;
  }
  if (trimmed.startsWith('/')) return `${BACKEND_ORIGIN}${trimmed}`;
  return `${BACKEND_ORIGIN}/${trimmed}`;
}

export type Role = 'SUPERADMIN' | 'MODERATOR' | 'USER';

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl?: string | null;
  organizationIds: string[];
  organizations: { id: string; name: string }[];
  mustChangePassword?: boolean;
  energoId?: string | null;
  middleName?: string | null;
  personnelNumber?: string | null;
  post?: string | null;
  createdAt?: string | null;
};

export type PublicIdCard = {
  found: true;
  certificateNumber: string;
  fullName: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  positionTitle: string;
  branchName: string;
  organizationTitle: string;
  issuedAt: string | null;
  validUntil: string | null;
  status: 'VALID' | 'EXPIRED' | 'REVOKED';
  avatarUrl: string | null;
  personnelNumber: string | null;
  verifyUrl?: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: UserProfile;
  };
};

export type ProgressLevelItem = {
  id: string;
  title: string;
  orderIndex: number;
  isLocked: boolean;
  isCompleted: boolean;
  completionPercent: number;
  correctAnswersCount: number;
  attemptsCount: number;
  completedAt: string | null;
};

export type HeartsState = {
  heartsCount: number;
  maxHearts: number;
  nextRegenAt: string | null;
  lastHeartRegenAt: string | null;
};

export type MyProgressResponse = {
  totalXp: number;
  completedLevels: number;
  badge: { label: string; bolts: number };
  levels: ProgressLevelItem[];
  hearts: HeartsState | null;
};

export type LevelDetailTheory = {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  totalQuestions: number;
  answeredQuestions: number;
  quizTheoryId?: string;
};

export type LevelDetailResponse = {
  id: string;
  title: string;
  orderIndex: number;
  theories: LevelDetailTheory[];
};

export type QuestionType = 'SINGLE_CHOICE' | 'YES_NO' | 'MATCHING';

export type MobileQuestionOption = {
  id: string;
  optionText: string;
  orderIndex: number;
  matchText?: string | null;
};

export type MobileQuestion = {
  id: string;
  prompt: string;
  type: QuestionType;
  orderIndex: number;
  options: MobileQuestionOption[];
};

export type MobileTheoryQuizMode = 'continue' | 'retry';

export type MobileTheoryQuestionsResponse = {
  mode: MobileTheoryQuizMode;
  totalQuestions: number;
  answeredCount: number;
  remainingCount: number;
  isModuleComplete: boolean;
  questions: MobileQuestion[];
};

export type DailyPlanQuestion = MobileQuestion & {
  answered: boolean;
  isCorrect: boolean | null;
  attemptCount: number;
};

export type DailyPlanResponse = {
  planDate: string;
  organizationId: string | null;
  targetQuestions: number;
  /** Kunlik maqsad: shu kunda nechta TO'G'RI javob kerak (10). */
  dailyGoalCorrect: number;
  questionCount: number;
  answeredCount: number;
  /** Bugun to'g'ri javob berilgan (har xil) savollar soni (reja uchun max 10). */
  correctCount: number;
  /** Cheklanmagan to'g'ri javoblar soni. */
  rawCorrectCount: number;
  /** 10 tadan ortiq to'g'ri javoblar (plandan tashqari). */
  extraCorrectCount: number;
  /** Urinilgan, lekin (hali) to'g'ri topilmagan savollar soni. */
  wrongCount: number;
  completionPercent: number;
  completed: boolean;
  /** Yangi modelda bo'sh — savollar next-question orqali bittalab keladi. */
  questions: DailyPlanQuestion[];
};

export type DailyPlanProgress = {
  planDate: string;
  answeredCount: number;
  correctCount: number;
  rawCorrectCount: number;
  extraCorrectCount: number;
  wrongCount: number;
  dailyGoalCorrect: number;
  completionPercent: number;
  completed: boolean;
};

export type DailyPlanNextResponse = {
  /** @deprecated Plan bajarilgandan keyin ham savollar beriladi — done ishlatilmaydi. */
  done: boolean;
  /** Pool tugadi: 24 soat ichida ishlanmagan mos savol qolmadi. */
  exhausted: boolean;
  question: MobileQuestion | null;
  progress: DailyPlanProgress;
};

export type MatchingPair = {
  leftOptionId: string;
  rightOptionId: string;
};

export type ExamQuestionSection = 'PT' | 'TB';

export type ExamLiveValidateQrResponse = {
  sessionId: string;
  assignmentId: string;
  status: string;
  includesPt: boolean;
  includesTb: boolean;
  examTitle: string | null;
};

export type ExamLiveEmployeeState = {
  status: string;
  includesPt: boolean;
  includesTb: boolean;
  ptCompleted: boolean;
  tbCompleted: boolean;
  activeSection: ExamQuestionSection | null;
  rejectionReason: string | null;
  attemptId: string | null;
  ptScorePercent: number | null;
  tbScorePercent: number | null;
  oralPending: boolean;
};

export type ExamLiveQuestion = {
  orderIndex: number;
  id: string;
  prompt: string;
  type: string;
  options: Array<{ id: string; optionText: string; orderIndex: number }>;
};

export type ExamLiveStartSectionResponse = {
  section: ExamQuestionSection;
  questions: ExamLiveQuestion[];
  durationMinutes: number;
  pointsPerQuestion: number;
};

export type ExamLiveSubmitSectionResponse = {
  section: ExamQuestionSection;
  correctCount: number;
  totalQuestions: number;
  score: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  passThreshold: number;
  awaitingOral: boolean;
};

export type ExamLiveHistoryRow = {
  id: string;
  createdAt: string;
  examTitle: string | null;
  examType: string | null;
  extraReason: string | null;
  includesPt: boolean;
  includesTb: boolean;
  ptScorePercent: number | null;
  tbScorePercent: number | null;
  scorePercent: number | null;
  oralResult: string | null;
  oralFeedback: string | null;
  finalizedAt: string | null;
};

export type ExamLiveNextResponse = {
  next: null | {
    assignmentId: string;
    suggestedAt: string;
    scheduledAt: string | null;
    daysLeft: number;
  };
};

export type TheorySlide = {
  head: string;
  items: string[];
  warn?: boolean;
};

export type MobileNazariyaSection = {
  id: string;
  title: string;
  slides?: TheorySlide[] | null;
  content: string;
};

export type MobileTheory = {
  id: string;
  levelId: string;
  title: string;
  content: string;
  orderIndex: number;
  quizTheoryId: string;
  slides?: TheorySlide[] | null;
  nazariyaSections?: MobileNazariyaSection[];
};

export type LeaderboardRow = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  xp: number;
  rank: number;
};

export type LeaderboardResponse = {
  scope: 'global' | 'organization';
  orgId: string | null;
  me: LeaderboardRow | null;
  top: LeaderboardRow[];
};

// ─── Audio Library (Mobile) ────────────────────────────────────────────────
export type AudioBookSummary = {
  id: string;
  title: string;
  coverUrl?: string | null;
  description?: string | null;
  chaptersCount: number;
};

export type LibraryDocumentKind = 'PDF' | 'DOCX' | 'DOC';

export type LibraryDocument = {
  id: string;
  title: string;
  description: string | null;
  fileKind: LibraryDocumentKind;
  fileUrl: string;
  originalName: string | null;
  mimeType: string | null;
  fileSize: string | null;
  orderIndex: number;
  createdAt: string;
};

export type AudioParagraph = {
  id: string;
  text: string;
  order: number;
  chapterId: string;
  audioUrl: string;
};

export type AudioChapter = {
  id: string;
  title: string;
  order: number;
  bookId: string;
  paragraphs: AudioParagraph[];
};

export type AudioBookDetail = {
  id: string;
  title: string;
  coverUrl?: string | null;
  audioUrl?: string | null;
  description?: string | null;
  chapters: AudioChapter[];
};

class MobileApiService {
  private api: ReturnType<typeof axios.create>;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: activeApiBaseUrl,
      timeout: 900000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.api.interceptors.request.use((config) => {
      config.baseURL = activeApiBaseUrl;
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as typeof error.config & {
          _retry?: boolean;
          _apiFailover?: boolean;
        };
        const status = error.response?.status;

        // Asosiy domen ishlamasa — rezerv IP ga o‘tish
        if (
          originalRequest &&
          !originalRequest._apiFailover &&
          shouldFailoverToReserve(error)
        ) {
          const nextBase = otherApiBaseUrl(
            originalRequest.baseURL || activeApiBaseUrl,
          );
          if (nextBase) {
            originalRequest._apiFailover = true;
            setActiveApiBaseUrl(nextBase);
            this.api.defaults.baseURL = nextBase;
            originalRequest.baseURL = nextBase;
            return this.api(originalRequest);
          }
        }

        if (status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const accessToken = await this.refreshAccessToken();
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.api(originalRequest);
          } catch {
            this.clearSession();
            window.location.href = '/welcome';
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  clearSession() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    if (this.isRefreshing && this.refreshPromise) return this.refreshPromise;

    this.isRefreshing = true;
    this.refreshPromise = this.api
      .post<{ accessToken: string }>('/auth/refresh', { refreshToken })
      .then((res) => {
        const newAccessToken = res.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        return newAccessToken;
      })
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  async getEnergoIdAuthorizeUrl(client: 'mobile' | 'web' = 'mobile') {
    const callbackOrigin =
      typeof window !== 'undefined' ? window.location.origin : undefined;
    const response = await this.api.get<{
      authorizeUrl: string;
      redirectUri: string;
      state: string;
      codeVerifier?: string;
      client: 'mobile' | 'web';
      platform?: { code: string; name: string };
    }>('/auth/energo-id/authorize-url', {
      params: {
        client,
        ...(callbackOrigin ? { callback_origin: callbackOrigin } : {}),
      },
    });
    return response.data;
  }

  async exchangeEnergoIdCode(
    code: string,
    redirectUri?: string,
    state?: string,
    client?: 'mobile' | 'web',
    codeVerifier?: string,
  ): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/energo-id/exchange', {
      onetime: code,
      code,
      redirect_uri: redirectUri,
      state,
      client,
      code_verifier: codeVerifier,
    });
    const payload = response.data;
    localStorage.setItem('accessToken', payload.data.accessToken);
    localStorage.setItem('refreshToken', payload.data.refreshToken);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(payload.data.user));
    return payload;
  }

  /** @deprecated OAuth orqali kirish ishlating */
  async login(loginOrEmail: string, password: string): Promise<LoginResponse> {
    // Backend `login` ham `email` ham qabul qiladi (NES 1C dan sync qilingan
    // foydalanuvchilarning logini email ustunida saqlanadi).
    const response = await this.api.post<LoginResponse>('/auth/login', {
      login: loginOrEmail,
      email: loginOrEmail,
      password
    });
    const payload = response.data;
    localStorage.setItem('accessToken', payload.data.accessToken);
    localStorage.setItem('refreshToken', payload.data.refreshToken);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(payload.data.user));
    return payload;
  }

  async register(body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationId?: string;
  }): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/register', body);
    const payload = response.data;
    localStorage.setItem('accessToken', payload.data.accessToken);
    localStorage.setItem('refreshToken', payload.data.refreshToken);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(payload.data.user));
    return payload;
  }

  async sendHeartbeat(): Promise<void> {
    await this.api.post('/user-activity/heartbeat');
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      this.clearSession();
      return;
    }
    try {
      await this.api.post('/auth/logout', { refreshToken });
    } finally {
      this.clearSession();
    }
  }

  async me(): Promise<UserProfile> {
    const response = await this.api.get<UserProfile>('/auth/me');
    return response.data;
  }

  async uploadMyAvatar(
    file: File | Blob,
    options?: { hasFace?: boolean; faceConfidence?: number }
  ): Promise<{ success: boolean; avatarUrl: string; hasFace: boolean }> {
    const form = new FormData();
    const fileName =
      file instanceof File ? file.name : `avatar-${Date.now()}.jpg`;
    form.append('file', file, fileName);
    form.append('hasFace', String(options?.hasFace ?? true));
    if (options?.faceConfidence !== undefined) {
      form.append('faceConfidence', String(options.faceConfidence));
    }
    const response = await this.api.post<{
      success: boolean;
      avatarUrl: string;
      hasFace: boolean;
    }>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async changePassword(body: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await this.api.post<{
      success: boolean;
      message: string;
    }>('/auth/change-password', body);
    return response.data;
  }

  async joinOrganization(organizationId: string): Promise<UserProfile> {
    const response = await this.api.post<UserProfile>('/auth/me/organization', {
      organizationId
    });
    return response.data;
  }

  async getPublicOrganizations(): Promise<{ id: string; name: string }[]> {
    const response = await this.api.get<{ id: string; name: string }[]>(
      '/public/organizations'
    );
    return response.data;
  }

  async getMyProgress(): Promise<MyProgressResponse> {
    const response = await this.api.get<MyProgressResponse>('/progress/me');
    return response.data;
  }

  /** Xodimning o'z ENERGO ID guvohnomasi (avtomatik). */
  async getMyCertificates(): Promise<EmployeeCertificate[]> {
    const response =
      await this.api.get<EmployeeCertificate[]>('/certificates/me');
    return response.data;
  }

  /** QR skanerdan — ochiq guvohnoma tekshiruvi. */
  async getPublicIdCard(id: string): Promise<PublicIdCard> {
    const response = await this.api.get<PublicIdCard>(
      `/public/id-card/${encodeURIComponent(id)}`,
    );
    return response.data;
  }

  async getDailyPlanToday(): Promise<DailyPlanResponse> {
    const response = await this.api.get<DailyPlanResponse>(
      '/mobile/daily-plan/today',
    );
    return response.data;
  }

  /** Kunlik plan: keyingi random savol (lavozimga mos, 24 soatda takrorlanmaydi). */
  async getDailyPlanNextQuestion(): Promise<DailyPlanNextResponse> {
    const response = await this.api.get<DailyPlanNextResponse>(
      '/mobile/daily-plan/next-question',
    );
    return response.data;
  }

  async getAiChatStatus(): Promise<{
    provider: string;
    ready: boolean;
    openRouterConfigured: boolean;
    ollamaConfigured: boolean;
  }> {
    const response = await this.api.get('/ai-chat/status');
    return response.data;
  }

  async getGlobalLeaderboard(limit = 50): Promise<LeaderboardResponse> {
    const response = await this.api.get<LeaderboardResponse>(
      '/leaderboard/global',
      {
        params: { limit }
      }
    );
    return response.data;
  }

  async getOrganizationLeaderboard(limit = 50): Promise<LeaderboardResponse> {
    const response = await this.api.get<LeaderboardResponse>(
      '/leaderboard/organization',
      {
        params: { limit }
      }
    );
    return response.data;
  }

  async getLevelDetail(levelId: string): Promise<LevelDetailResponse> {
    const response = await this.api.get<LevelDetailResponse>(
      `/progress/level/${levelId}`
    );
    return response.data;
  }

  async getTheoryById(id: string): Promise<MobileTheory> {
    const response = await this.api.get<MobileTheory>(`/theories/${id}`);
    return response.data;
  }

  async getQuestionsByTheory(
    theoryId: string,
    opts?: { mode?: MobileTheoryQuizMode },
  ): Promise<MobileTheoryQuestionsResponse> {
    const mode = opts?.mode === 'retry' ? 'retry' : 'continue';
    const response = await this.api.get<MobileTheoryQuestionsResponse>(
      `/theories/${theoryId}/questions`,
      { params: { mode } },
    );
    return response.data;
  }

  async listAudioBooks(): Promise<AudioBookSummary[]> {
    const response = await this.api.get<AudioBookSummary[]>('/audio-books');
    return response.data;
  }

  async listLibraryDocuments(): Promise<LibraryDocument[]> {
    const response = await this.api.get<LibraryDocument[]>('/library-documents');
    return response.data;
  }

  async getAudioBook(bookId: string): Promise<AudioBookDetail> {
    const response = await this.api.get<AudioBookDetail>(
      `/audio-books/${bookId}`
    );
    return response.data;
  }

  async submitAnswer(
    questionId: string,
    selectedOptionId: string,
    source: 'DAILY_PLAN' | 'LESSON' = 'LESSON',
  ) {
    const response = await this.api.post<{
      isCorrect: boolean;
      correctOptionId: string | null;
      xpEarned: number;
      countsForXp?: boolean;
      xpDeniedReason?: string | null;
      xpMessage?: string | null;
      hearts?: HeartsState;
    }>('/progress/answer', { questionId, selectedOptionId, source });
    return response.data;
  }

  async submitMatching(
    questionId: string,
    pairs: MatchingPair[],
    source: 'DAILY_PLAN' | 'LESSON' = 'LESSON',
  ) {
    const response = await this.api.post<{
      isCorrect: boolean;
      xpEarned: number;
      countsForXp?: boolean;
      xpDeniedReason?: string | null;
      xpMessage?: string | null;
      hearts?: HeartsState;
    }>('/progress/matching', { questionId, pairs, source });
    return response.data;
  }

  // ─── Exam Live (USER) ─────────────────────────────────────────────────────
  async examLiveValidateQr(
    qrToken: string
  ): Promise<ExamLiveValidateQrResponse> {
    const response = await this.api.post<ExamLiveValidateQrResponse>(
      '/exams/live/validate-qr',
      { qrToken }
    );
    return response.data;
  }

  async examLiveGetSessionState(
    sessionId: string
  ): Promise<ExamLiveEmployeeState> {
    const response = await this.api.get<ExamLiveEmployeeState>(
      `/exams/live/session/${sessionId}/state`
    );
    return response.data;
  }

  async examLiveVerifyCode(sessionId: string, code: string) {
    const response = await this.api.post<{ ok: boolean }>(
      `/exams/live/session/${sessionId}/verify-code`,
      { code }
    );
    return response.data;
  }

  async examLiveStartSection(sessionId: string, section: ExamQuestionSection) {
    const response = await this.api.post<ExamLiveStartSectionResponse>(
      `/exams/live/session/${sessionId}/start-section`,
      { section }
    );
    return response.data;
  }

  async examLiveAnswer(
    sessionId: string,
    body: {
      section: ExamQuestionSection;
      questionId: string;
      selectedOptionId: string;
    }
  ) {
    const response = await this.api.post<{ ok: boolean; isCorrect: boolean }>(
      `/exams/live/session/${sessionId}/answer`,
      body
    );
    return response.data;
  }

  async examLiveSubmitSection(sessionId: string, section: ExamQuestionSection) {
    const response = await this.api.post<ExamLiveSubmitSectionResponse>(
      `/exams/live/session/${sessionId}/submit-section`,
      { section }
    );
    return response.data;
  }

  async examLiveTabSwitch(sessionId: string) {
    const response = await this.api.post<{
      tabSwitchCount: number;
      cancelled?: boolean;
    }>(`/exams/live/session/${sessionId}/tab-switch`, {});
    return response.data;
  }

  async examLiveMyNext(): Promise<ExamLiveNextResponse> {
    const response = await this.api.get<ExamLiveNextResponse>(
      '/exams/live/me/next'
    );
    return response.data;
  }

  async examLiveMyHistory(): Promise<ExamLiveHistoryRow[]> {
    const response = await this.api.get<ExamLiveHistoryRow[]>(
      '/exams/live/me/history'
    );
    return response.data;
  }
}

export const mobileApi = new MobileApiService();
export default mobileApi;
