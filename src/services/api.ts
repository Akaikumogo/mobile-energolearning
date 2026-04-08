import axios, { type AxiosError } from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://elektrolearn-api.uzbekistonmet.uz/api';

export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function getExamLiveSocketUrl(): string {
  return BACKEND_ORIGIN;
}

export type ExamQuestionSection = 'PT' | 'TB';

export type ExamSessionState = {
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

export type ExamHistoryRow = {
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

export type ExamNextResponse = {
  next: {
    assignmentId: string;
    suggestedAt: string;
    scheduledAt: string | null;
    daysLeft: number;
  } | null;
};

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

export type MobileTheory = {
  id: string;
  levelId: string;
  title: string;
  content: string;
  orderIndex: number;
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

class MobileApiService {
  private api: ReturnType<typeof axios.create>;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
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

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/login', {
      email,
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

  async submitAnswer(questionId: string, selectedOptionId: string) {
    const response = await this.api.post<{
      isCorrect: boolean;
      correctOptionId: string | null;
      xpEarned: number;
    }>('/progress/answer', { questionId, selectedOptionId });
    return response.data;
  }

  async validateExamQr(qrToken: string): Promise<{
    sessionId: string;
    assignmentId: string;
    status: string;
    includesPt: boolean;
    includesTb: boolean;
    examTitle: string | null;
  }> {
    const response = await this.api.post('/exams/live/validate-qr', { qrToken });
    const d = response.data as { error?: string };
    if (d && typeof d === 'object' && 'error' in d && d.error) {
      throw new Error(d.error);
    }
    return response.data as {
      sessionId: string;
      assignmentId: string;
      status: string;
      includesPt: boolean;
      includesTb: boolean;
      examTitle: string | null;
    };
  }

  async getExamSessionState(sessionId: string): Promise<ExamSessionState> {
    const response = await this.api.get<ExamSessionState>(`/exams/live/session/${sessionId}/state`);
    return response.data;
  }

  async verifyExamCode(sessionId: string, code: string): Promise<{ attemptId: string }> {
    const response = await this.api.post(`/exams/live/session/${sessionId}/verify-code`, { code });
    return response.data;
  }

  async startExamSection(
    sessionId: string,
    section: ExamQuestionSection,
  ): Promise<{
    section: ExamQuestionSection;
    questions: ExamLiveQuestion[];
    durationMinutes: number;
    pointsPerQuestion: number;
  }> {
    const response = await this.api.post(`/exams/live/session/${sessionId}/start-section`, {
      section,
    });
    return response.data;
  }

  async saveExamAnswer(
    sessionId: string,
    section: ExamQuestionSection,
    questionId: string,
    selectedOptionId: string,
  ): Promise<{ ok: boolean }> {
    const response = await this.api.post(`/exams/live/session/${sessionId}/answer`, {
      section,
      questionId,
      selectedOptionId,
    });
    return response.data;
  }

  async submitExamSection(
    sessionId: string,
    section: ExamQuestionSection,
  ): Promise<{
    awaitingOral: boolean;
    percent: number;
    passed: boolean;
    passThreshold: number;
  }> {
    const response = await this.api.post(`/exams/live/session/${sessionId}/submit-section`, {
      section,
    });
    return response.data;
  }

  async recordExamTabSwitch(sessionId: string): Promise<{ tabSwitchCount: number; cancelled: boolean }> {
    const response = await this.api.post(`/exams/live/session/${sessionId}/tab-switch`);
    return response.data;
  }

  async getExamHistory(): Promise<ExamHistoryRow[]> {
    const response = await this.api.get<ExamHistoryRow[]>('/exams/live/me/history');
    return response.data;
  }

  async getExamNext(): Promise<ExamNextResponse> {
    const response = await this.api.get<ExamNextResponse>('/exams/live/me/next');
    return response.data;
  }

  async getMyEmployeeCertificate(): Promise<EmployeeCertificate | null> {
    const response = await this.api.get<EmployeeCertificate | null>(
      '/auth/me/employee-certificate',
    );
    return response.data;
  }

  async listMyChecks(params?: { type?: EmployeeCheckType }): Promise<EmployeeCheck[]> {
    const response = await this.api.get<EmployeeCheck[]>('/auth/me/checks', { params });
    return response.data;
  }
}

export const mobileApi = new MobileApiService();
export default mobileApi;
