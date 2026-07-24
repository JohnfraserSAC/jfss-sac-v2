import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import {
  ExecDashboardIndexRedirect,
  ExecDashboardLayout,
} from "./components/ExecDashboardLayout";
import { EXEC_DASHBOARD_ROLES } from "./utils/execPermissions";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ClubsPage } from "./pages/ClubsPage";
import { ClubDetailPage } from "./pages/ClubDetailPage";
import { ClubManagePage } from "./pages/ClubManagePage";
import { ClubApplyPage } from "./pages/ClubApplyPage";
import { ClubReapplyPage } from "./pages/ClubReapplyPage";
import { ClubEventRequestPage } from "./pages/ClubEventRequestPage";
import { ClubFundingPlaceholderPage } from "./pages/ClubFundingPlaceholderPage";
import { MyRequestsPage } from "./pages/MyRequestsPage";
import { MyClubsPage } from "./pages/MyClubsPage";
import { AdminClubRequestsPage } from "./pages/AdminClubRequestsPage";
import { AdminClubReapplicationsPage } from "./pages/AdminClubReapplicationsPage";
import { AdminClubEventsPage } from "./pages/AdminClubEventsPage";
import { AdminFundingPlaceholderPage } from "./pages/AdminFundingPlaceholderPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { AnnouncementDetailPage } from "./pages/AnnouncementDetailPage";
import { CreateAnnouncementPage } from "./pages/CreateAnnouncementPage";
import { EditAnnouncementPage } from "./pages/EditAnnouncementPage";
import { MyAnnouncementsPage } from "./pages/MyAnnouncementsPage";
import { AdminAnnouncementsPage } from "./pages/AdminAnnouncementsPage";
import { SchedulePage } from "./pages/SchedulePage";
import { EventsPage } from "./pages/EventsPage";
import { StudentResourcesPage } from "./pages/StudentResourcesPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />

            <Route path="clubs" element={<ClubsPage />} />
            <Route
              path="clubs/my-clubs"
              element={
                <ProtectedRoute>
                  <MyClubsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="clubs/apply"
              element={
                <ProtectedRoute>
                  <ClubApplyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="clubs/reapply"
              element={
                <ProtectedRoute>
                  <ClubReapplyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="clubs/register"
              element={<Navigate to="/clubs/apply" replace />}
            />
            <Route path="clubs/:slug" element={<ClubDetailPage />} />
            <Route
              path="clubs/:slug/manage"
              element={
                <ProtectedRoute>
                  <ClubManagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="clubs/:slug/manage/event-requests/new"
              element={
                <ProtectedRoute>
                  <ClubEventRequestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="clubs/:slug/manage/funding"
              element={
                <ProtectedRoute>
                  <ClubFundingPlaceholderPage />
                </ProtectedRoute>
              }
            />

            <Route path="schedule" element={<SchedulePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="student-resources" element={<StudentResourcesPage />} />

            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route
              path="announcements/new"
              element={
                <ProtectedRoute>
                  <CreateAnnouncementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="announcements/:id/edit"
              element={
                <ProtectedRoute>
                  <EditAnnouncementPage />
                </ProtectedRoute>
              }
            />
            <Route path="announcements/:id" element={<AnnouncementDetailPage />} />

            <Route
              path="my-announcements"
              element={
                <ProtectedRoute>
                  <MyAnnouncementsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="my-requests"
              element={
                <ProtectedRoute>
                  <MyRequestsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="exec-dashboard"
              element={
                <ProtectedRoute>
                  <RoleRoute allowedRoles={EXEC_DASHBOARD_ROLES}>
                    <ExecDashboardLayout />
                  </RoleRoute>
                </ProtectedRoute>
              }
            >
              <Route index element={<ExecDashboardIndexRedirect />} />
              <Route
                path="announcements"
                element={<AdminAnnouncementsPage embedded />}
              />
              <Route
                path="clubs"
                element={<AdminClubRequestsPage embedded />}
              />
              <Route
                path="reapplications"
                element={<AdminClubReapplicationsPage embedded />}
              />
              <Route
                path="events"
                element={<AdminClubEventsPage embedded />}
              />
              <Route
                path="funding"
                element={<AdminFundingPlaceholderPage embedded />}
              />
            </Route>

            <Route
              path="register-club"
              element={<Navigate to="/clubs/apply" replace />}
            />
            <Route
              path="my-clubs"
              element={<Navigate to="/clubs/my-clubs" replace />}
            />
            <Route
              path="admin/club-requests"
              element={<Navigate to="/exec-dashboard/clubs" replace />}
            />
            <Route
              path="admin/announcements"
              element={<Navigate to="/exec-dashboard/announcements" replace />}
            />

            <Route path="home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
