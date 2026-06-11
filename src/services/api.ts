import axios, { type AxiosError } from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://elektrolearn-api.uzbekistonmet.uz/api';

export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

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
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
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
  completedAt: string | null;
};

export type MyProgressResponse = {
  totalXp: number;
  completedLevels: number;
  badge: { label: string; bolts: number };
  levels: ProgressLevelItem[];
  hearts: {
    heartsCount: number;
    maxHearts: number;
    nextRegenAt: string | null;
    lastHeartRegenAt: string | null;
  } | null;
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

export type EmployeeCertificate = {
  id: string;
  userId: string;
  organizationId: string;
  positionTitle: string;
  certificateNumber: string;
  presentedByFullName: string;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeCheckType =
  | 'GENERAL_KNOWLEDGE'
  | 'SAFETY_TECHNIQUE'
  | 'SPECIAL_WORK_PERMIT'
  | 'RESUSCITATION_TRAINING'
  | 'MEDICAL_EXAM';

export type EmployeeCheck = {
  id: string;
  userId: string;
  type: EmployeeCheckType;
  checkDate: string;
  reason: string | null;
  grade: string | null;
  nextCheckDate: string | null;
  commissionLeaderSignature: string | null;
  qualificationGroup: string | null;
  ruleName: string | null;
  conclusion: string | null;
  doctorConclusion: string | null;
  responsibleSignature: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Audio Library (Mobile) ────────────────────────────────────────────────
export type AudioBookSummary = {
  id: string;
  title: string;
  coverUrl?: string | null;
  description?: string | null;
  chaptersCount: number;
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
  description?: string | null;
  chapters: AudioChapter[];
};

class MobileApiService {
  private api: ReturnType<typeof axios.create>;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 900000,
      headers: { 'Content-Type': 'application/json' }
    });

    this.api.interceptors.request.use((config) => {
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
        };
        const status = error.response?.status;

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
    file: File
  ): Promise<{ success: boolean; avatarUrl: string }> {
    const form = new FormData();
    form.append('file', file);
    const response = await this.api.post<{
      success: boolean;
      avatarUrl: string;
    }>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
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

  async getQuestionsByTheory(theoryId: string): Promise<MobileQuestion[]> {
    const response = await this.api.get<MobileQuestion[]>(
      `/theories/${theoryId}/questions`
    );
    return response.data;
  }

  async listAudioBooks(): Promise<AudioBookSummary[]> {
    const response = await this.api.get<AudioBookSummary[]>('/audio-books');
    return response.data;
  }

  async getAudioBook(bookId: string): Promise<AudioBookDetail> {
    const response = await this.api.get<AudioBookDetail>(
      `/audio-books/${bookId}`
    );
    return response.data;
  }

  async submitAnswer(questionId: string, selectedOptionId: string) {
    const response = await this.api.post<{
      isCorrect: boolean;
      correctOptionId: string | null;
      xpEarned: number;
    }>('/progress/answer', { questionId, selectedOptionId });
    return response.data;
  }

  async submitMatching(questionId: string, pairs: MatchingPair[]) {
    const response = await this.api.post<{
      isCorrect: boolean;
      xpEarned: number;
    }>('/progress/matching', { questionId, pairs });
    return response.data;
  }

  async getMyEmployeeCertificate(): Promise<EmployeeCertificate | null> {
    const response = await this.api.get<EmployeeCertificate | null>(
      '/auth/me/employee-certificate'
    );
    return response.data;
  }

  async listMyChecks(params?: {
    type?: EmployeeCheckType;
  }): Promise<EmployeeCheck[]> {
    const response = await this.api.get<EmployeeCheck[]>('/auth/me/checks', {
      params
    });
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
