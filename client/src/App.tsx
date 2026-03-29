import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LoginPage } from "@/pages/employee/LoginPage";
import { HomePage } from "@/pages/employee/HomePage";
import { CoursesPage } from "@/pages/employee/CoursesPage";
import { CourseViewerPage } from "@/pages/employee/CourseViewerPage";
import { QuizPage } from "@/pages/employee/QuizPage";
import { SplashPage } from "@/pages/SplashPage";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { DashboardPage } from "@/pages/admin/DashboardPage";
import { EmployeesPage } from "@/pages/admin/EmployeesPage";
import { EmployeeDetailPage } from "@/pages/admin/EmployeeDetailPage";
import { CoursesAdminPage } from "@/pages/admin/CoursesAdminPage";
import { AnalyticsPage } from "@/pages/admin/AnalyticsPage";
import { SettingsPage } from "@/pages/admin/SettingsPage";

function RequireEmployee() {
  const { state } = useAuth();
  if (state.kind !== "employee") {
    return <Navigate to="/login" replace />;
  }
  return <EmployeeLayout />;
}

function RequireAdmin() {
  const { state } = useAuth();
  if (state.kind !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }
  return <AdminLayout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<RequireEmployee />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseViewerPage />} />
        <Route path="/quiz/:courseId" element={<QuizPage />} />
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/employees" element={<EmployeesPage />} />
        <Route path="/admin/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/admin/courses" element={<CoursesAdminPage />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<SplashPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
