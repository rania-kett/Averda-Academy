import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "@/context/AuthContext";

const EmployeeLayout = lazy(() =>
  import("@/components/employee/EmployeeLayout").then((m) => ({ default: m.EmployeeLayout }))
);
const AdminLayout = lazy(() =>
  import("@/components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout }))
);

const LoginPage = lazy(() => import("@/pages/employee/LoginPage").then((m) => ({ default: m.LoginPage })));
const HomePage = lazy(() => import("@/pages/employee/HomePage").then((m) => ({ default: m.HomePage })));
const CoursesPage = lazy(() => import("@/pages/employee/CoursesPage").then((m) => ({ default: m.CoursesPage })));
const CourseViewerPage = lazy(() =>
  import("@/pages/employee/CourseViewerPage").then((m) => ({ default: m.CourseViewerPage }))
);
const QuizPage = lazy(() => import("@/pages/employee/QuizPage").then((m) => ({ default: m.QuizPage })));
const ProfilePage = lazy(() => import("@/pages/employee/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const ChallengesPage = lazy(() =>
  import("@/pages/employee/ChallengesPage").then((m) => ({ default: m.ChallengesPage }))
);
const BadgesPage = lazy(() => import("@/pages/employee/BadgesPage").then((m) => ({ default: m.BadgesPage })));

const SplashPage = lazy(() => import("@/pages/SplashPage").then((m) => ({ default: m.SplashPage })));
const AdminLoginPage = lazy(() =>
  import("@/pages/admin/AdminLoginPage").then((m) => ({ default: m.AdminLoginPage }))
);
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const EmployeesPage = lazy(() => import("@/pages/admin/EmployeesPage").then((m) => ({ default: m.EmployeesPage })));
const EmployeeDetailPage = lazy(() =>
  import("@/pages/admin/EmployeeDetailPage").then((m) => ({ default: m.EmployeeDetailPage }))
);
const CoursesAdminPage = lazy(() =>
  import("@/pages/admin/CoursesAdminPage").then((m) => ({ default: m.CoursesAdminPage }))
);
const AnalyticsPage = lazy(() => import("@/pages/admin/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage })));
function RouteLoader() {
  return <div className="h-32 animate-pulse rounded-2xl bg-stone-200 dark:bg-white/5" />;
}

function RequireEmployee() {
  const { state } = useAuth();
  if (state.kind !== "employee") {
    return <Navigate to="/login" replace />;
  }
  return (
    <Suspense fallback={<RouteLoader />}>
      <EmployeeLayout />
    </Suspense>
  );
}

function RequireAdminAuth() {
  const { state } = useAuth();
  if (state.kind !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}

function RequireAdminLayout() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <AdminLayout />
    </Suspense>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route element={<RequireEmployee />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseViewerPage />} />
          <Route path="/quiz/:courseId" element={<QuizPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<RequireAdminAuth />}>
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/settings" element={<DashboardPage />} />
          <Route path="/admin/epi" element={<Navigate to="/admin" replace />} />
          <Route element={<RequireAdminLayout />}>
            <Route path="/admin/employees" element={<EmployeesPage />} />
            <Route path="/admin/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/admin/courses" element={<CoursesAdminPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>

        <Route path="/" element={<SplashPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
