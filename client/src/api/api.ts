import client from "./client";

export const authApi = {
  login: (employeeId: string, pin: string) =>
    client.post("/api/auth/login", { employeeId, pin }),
  adminLogin: (email: string, password: string) =>
    client.post("/api/auth/admin-login", { email, password }),
  logout: () => client.post("/api/auth/logout"),
};

export const userApi = {
  me: () => client.get("/api/user/me"),
  completeAssessment: (answers: number[]) =>
    client.post("/api/user/assessment", { answers }),
  badges: () => client.get("/api/user/badges"),
  updateMe: (body: { language?: "AR" | "FR" | "EN" }) =>
    client.patch("/api/user/me", body),
  notifications: () => client.get("/api/user/notifications"),
  readNotification: (id: string) =>
    client.put(`/api/user/notifications/${id}/read`),
  readAllNotifications: () => client.put("/api/user/notifications/read-all"),
  certificate: () =>
    client.get("/api/user/certificate", { responseType: "blob", timeout: 120_000 }),
};

export const coursesApi = {
  list: () => client.get("/api/courses"),
  get: (id: string) => client.get(`/api/courses/${id}`),
  progress: (id: string, body: { pagesRead: number; timeSpentSecs?: number }) =>
    client.post(`/api/courses/${id}/progress`, body),
};

export const quizApi = {
  get: (courseId: string) => client.get(`/api/quiz/${courseId}`),
  attempt: (
    courseId: string,
    body: { answers: Record<string, unknown>; timeSpent: number }
  ) => client.post(`/api/quiz/${courseId}/attempt`, body),
};

export const lessonQuizApi = {
  getQuestions: (courseId: string) =>
    client.get(`/api/lesson-quiz/${courseId}/questions`),
  submit: (body: {
    courseId: string;
    answers: { questionId: number; selectedIndices: number[] }[];
  }) => client.post("/api/lesson-quiz/submit", body),
};

export const customCourseQuizApi = {
  submit: (body: { courseId: string; answers: Record<string, number[]> }) =>
    client.post("/api/custom-course-quiz/submit", body),
};

export const aiApi = {
  speak: (body: { courseId: string; lang: "ar" | "fr" | "en" }) =>
    client.post("/api/ai/speak", body, { responseType: "blob" }),
  analyzeCourse: (form: FormData) =>
    client.post("/api/ai/analyze-course", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  generateQuiz: (body: { courseId: string; quizTopics?: string[] }) =>
    client.post("/api/ai/generate-quiz", body),
};

export type EpiProfile = {
  id: string;
  userId: string;
  shirtSize: string | null;
  shoeSize: string | null;
  gloveSize: string | null;
  vestSize: string | null;
  pantsSize: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EpiPassportItem = {
  id: string;
  itemCode: string;
  item?: EpiCatalogItem | null;
  size: string | null;
  status: string;
  issuedAt: string;
  nextReplacementAt: string | null;
  lastReceptionAt: string | null;
  /** Optional URL path to a saved reception photo proof (served from `/uploads/*`). */
  photoProofPath?: string | null;
};

export type EpiCatalogItem = {
  code: string;
  labelAr: string;
  labelFr: string;
  labelEn: string;
  emoji: string | null;
  defaultLifetimeDays: number | null;
  sortOrder: number;
  active: boolean;
};

export const epiApi = {
  summary: () => client.get("/api/epi/summary"),
  getProfile: () => client.get("/api/epi/profile"),
  updateProfile: (body: {
    shirtSize?: string | null;
    shoeSize?: string | null;
    gloveSize?: string | null;
    vestSize?: string | null;
    pantsSize?: string | null;
    notes?: string | null;
  }) => client.put("/api/epi/profile", body),
  passport: () => client.get("/api/epi/passport"),
  confirmReception: (body: { issuanceId: string; signatureName?: string; notes?: string }) =>
    client.post("/api/epi/reception/confirm", body),
  requestReplacement: (body: {
    issuanceId?: string;
    itemCode: string;
    requestedSize?: string;
    reason: string;
    note?: string;
  }) => client.post("/api/epi/replacement-request", body),
  requestRenewal: (body: {
    itemType: string;
    itemLabel?: string;
    reason: string;
    note?: string;
    /** @deprecated use itemType */
    itemId?: string;
    issuanceId?: string;
  }) => client.post("/api/epi/request-renewal", body),
  confirmReceipt: (body: { itemType: string; issuanceId?: string; signatureName?: string; notes?: string; employeeId?: string; itemId?: string; photo?: string }) =>
    client.post("/api/epi/confirm-receipt", body),
  submitComplianceProof: (body: { type: string; fileUrl: string }) =>
    client.post("/api/epi/compliance-proof", body),
  submitFeedback: (body: { rating?: number; message?: string }) =>
    client.post("/api/epi/feedback", body),
};

export type LessonQuizQuestionClient = {
  id: number;
  type: "single" | "multi" | "tf";
  emoji?: string;
  text: string;
  options: string[];
  /** Indices into `options` */
  correct: number[];
  /** Explanation shown after confirm */
  explanation: string;
};

export type LessonQuizKey = "road" | "sweeping";

export const adminApi = {
  stats: () => client.get("/api/admin/stats"),
  activity: (params?: { limit?: number }) => client.get("/api/admin/activity", { params }),
  categories: () => client.get("/api/admin/categories"),
  employees: (params: Record<string, string>) =>
    client.get("/api/admin/employees", { params }),
  employee: (id: string) => client.get(`/api/admin/employees/${id}`),
  nextEmployeeId: (categoryId: string) =>
    client.get("/api/admin/employees/next-id", { params: { categoryId } }),
  addEmployee: (body: Record<string, unknown>) =>
    client.post("/api/admin/employees", body),
  deactivate: (id: string) => client.post(`/api/admin/employees/${id}/deactivate`),
  resetProgress: (id: string) =>
    client.post(`/api/admin/employees/${id}/reset-progress`),
  certificate: (id: string) =>
    client.get(`/api/admin/employees/${id}/certificate`, {
      responseType: "blob",
      timeout: 120_000,
    }),
  epiOverview: (params?: Record<string, string>) =>
    client.get("/api/admin/epi/overview", { params }),
  epiDemoSeed: () => client.post("/api/admin/epi/demo-seed"),
  epiCatalog: () => client.get("/api/admin/epi/catalog"),
  epiCategoryDefaults: (categoryId: string) =>
    client.get(`/api/admin/epi/category-defaults/${categoryId}`),
  updateEpiCategoryDefaults: (categoryId: string, body: unknown) =>
    client.put(`/api/admin/epi/category-defaults/${categoryId}`, body),
  issueEpi: (body: unknown) => client.post("/api/admin/epi/issue", body),
  epiEmployees: (params?: Record<string, string>) =>
    client.get("/api/admin/epi/employees", { params }),
  /** Admin dashboard معدات tab — same summaries as employee GET /api/epi/summary */
  epiDashboard: () => client.get<{ employees: unknown[] }>("/api/admin/epi"),
  epiRenewalRequests: () => client.get("/api/admin/epi/requests"),
  approveEpiRenewalRequest: (id: string) => client.patch(`/api/admin/epi/requests/${encodeURIComponent(id)}/approve`),
  rejectEpiRenewalRequest: (id: string) => client.patch(`/api/admin/epi/requests/${encodeURIComponent(id)}/reject`),
  analyticsQuestions: () => client.get("/api/admin/analytics/questions"),
  analyticsAtRisk: () => client.get("/api/admin/analytics/atrisk"),
  analyticsWeekly: () => client.get("/api/admin/analytics/weekly"),
  analyticsCourseScores: () => client.get("/api/admin/analytics/course-scores"),
  analyticsHeatmap: () => client.get("/api/admin/analytics/heatmap"),
  courses: () => client.get("/api/admin/courses"),
  createCourse: (form: FormData) =>
    client.post("/api/admin/courses", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateCourse: (id: string, body: unknown) =>
    client.put(`/api/admin/courses/${id}`, body),
  deleteCourse: (id: string) => client.delete(`/api/admin/courses/${id}`),
  generateQuiz: (id: string, regenerate?: boolean) =>
    client.post(`/api/admin/courses/${id}/generate-quiz`, { regenerate }),
  aiAnalyzeCourse: (form: FormData) =>
    client.post("/api/ai/analyze-course", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  aiGenerateQuiz: (body: { courseId: string; quizTopics?: string[] }) =>
    client.post("/api/ai/generate-quiz", body),
  sendNotification: (body: {
    userId: string;
    title: { ar: string; fr: string; en: string };
    message: { ar: string; fr: string; en: string };
  }) => client.post("/api/admin/notifications/send", body),
  /** Creates an in-app notification visible in the employee bell menu. */
  notifyEmployee: (
    employeeId: string,
    body?: { type?: "assessment" | "epi" | "custom"; title?: { ar: string; fr: string; en: string }; message?: { ar: string; fr: string; en: string } }
  ) => client.post(`/api/admin/notify/${encodeURIComponent(employeeId)}`, body ?? { type: "assessment" }),
  epiRemindEmployee: (employeeId: string) =>
    client.post(`/api/admin/epi/${encodeURIComponent(employeeId)}/remind`),
  quizResultsAssessment: (params?: Record<string, string>) =>
    client.get("/api/admin/quiz-results/assessment", { params }),
  quizResultsLessons: (params?: Record<string, string>) =>
    client.get("/api/admin/quiz-results/lessons", { params }),
  quizResultsSummary: () => client.get("/api/admin/quiz-results/summary"),
  getSettings: () => client.get("/api/admin/settings"),
  saveSetting: (key: string, value: string) =>
    client.post("/api/admin/settings", { key, value }),
  testSetting: (keyName: string) =>
    client.get(`/api/admin/settings/test/${encodeURIComponent(keyName)}`),
};
