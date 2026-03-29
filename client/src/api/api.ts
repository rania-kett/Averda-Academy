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
  badges: () => client.get("/api/user/badges"),
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
    body: { answers: Record<string, string>; timeSpent: number }
  ) => client.post(`/api/quiz/${courseId}/attempt`, body),
};

export const adminApi = {
  stats: () => client.get("/api/admin/stats"),
  employees: (params: Record<string, string>) =>
    client.get("/api/admin/employees", { params }),
  employee: (id: string) => client.get(`/api/admin/employees/${id}`),
  addEmployee: (body: Record<string, unknown>) =>
    client.post("/api/admin/employees", body),
  deactivate: (id: string) => client.post(`/api/admin/employees/${id}/deactivate`),
  resetProgress: (id: string) =>
    client.post(`/api/admin/employees/${id}/reset-progress`),
  certificate: (id: string) =>
    client.get(`/api/admin/employees/${id}/certificate`),
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
};
