import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import {
  ExecApplicationsIndexRedirect,
  ExecApplicationsLayout,
  ExecArchivedIndexRedirect,
  ExecArchivedLayout,
  ExecDashboardIndexRedirect,
  ExecDashboardLayout,
  ExecRequestsIndexRedirect,
  ExecRequestsLayout,
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
import { ClubFundingPlaceholderPage } from "./pages/ClubFundingPlaceholderPage";
import { MyRequestsPage } from "./pages/MyRequestsPage";
import { MyClubsPage } from "./pages/MyClubsPage";
import { AdminClubRequestsPage } from "./pages/AdminClubRequestsPage";
import { AdminClubReapplicationsPage } from "./pages/AdminClubReapplicationsPage";
import { AdminArchivedClubsPage } from "./pages/AdminArchivedClubsPage";
import { AdminArchivedAnnouncementsPage } from "./pages/AdminArchivedAnnouncementsPage";
import { AdminSupervisorRequestsPage } from "./pages/AdminSupervisorRequestsPage";
import { AdminFundingPlaceholderPage } from "./pages/AdminFundingPlaceholderPage";
import { AdminSchoolDayPage } from "./pages/AdminSchoolDayPage";
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

              <Route path="applications" element={<ExecApplicationsLayout />}>
                <Route index element={<ExecApplicationsIndexRedirect />} />
                <Route
                  path="new"
                  element={<AdminClubRequestsPage embedded />}
                />
                <Route
                  path="reapplications"
                  element={<AdminClubReapplicationsPage embedded />}
                />
              </Route>

              <Route path="requests" element={<ExecRequestsLayout />}>
                <Route index element={<ExecRequestsIndexRedirect />} />
                <Route
                  path="funding"
                  element={<AdminFundingPlaceholderPage embedded />}
                />
                <Route
                  path="announcements"
                  element={<AdminAnnouncementsPage embedded />}
                />
                <Route
                  path="supervisor"
                  element={<AdminSupervisorRequestsPage embedded />}
                />
              </Route>

              <Route
                path="school-day"
                element={<AdminSchoolDayPage embedded />}
              />

              <Route path="archived" element={<ExecArchivedLayout />}>
                <Route index element={<ExecArchivedIndexRedirect />} />
                <Route
                  path="clubs"
                  element={<AdminArchivedClubsPage embedded />}
                />
                <Route
                  path="announcements"
                  element={<AdminArchivedAnnouncementsPage embedded />}
                />
              </Route>

              {/* Legacy redirects — preserve old bookmarks */}
              <Route
                path="announcements"
                element={
                  <Navigate
                    to="/exec-dashboard/requests/announcements"
                    replace
                  />
                }
              />
              <Route
                path="clubs"
                element={
                  <Navigate to="/exec-dashboard/applications/new" replace />
                }
              />
              <Route
                path="reapplications"
                element={
                  <Navigate
                    to="/exec-dashboard/applications/reapplications"
                    replace
                  />
                }
              />
              <Route
                path="funding"
                element={
                  <Navigate to="/exec-dashboard/requests/funding" replace />
                }
              />
              <Route
                path="supervisor-requests"
                element={
                  <Navigate to="/exec-dashboard/requests/supervisor" replace />
                }
              />
              <Route
                path="pending-clubs"
                element={
                  <Navigate to="/exec-dashboard/requests/supervisor" replace />
                }
              />
              <Route
                path="overdue-supervisor"
                element={
                  <Navigate to="/exec-dashboard/requests/supervisor" replace />
                }
              />
              <Route
                path="archived-clubs"
                element={
                  <Navigate to="/exec-dashboard/archived/clubs" replace />
                }
              />
              <Route
                path="inactive-clubs"
                element={
                  <Navigate to="/exec-dashboard/archived/clubs" replace />
                }
              />
              <Route
                path="active-clubs"
                element={
                  <Navigate to="/exec-dashboard/applications/new" replace />
                }
              />
              <Route
                path="events"
                element={
                  <Navigate
                    to="/exec-dashboard/requests/announcements"
                    replace
                  />
                }
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
              element={
                <Navigate to="/exec-dashboard/applications/new" replace />
              }
            />
            <Route
              path="admin/announcements"
              element={
                <Navigate
                  to="/exec-dashboard/requests/announcements"
                  replace
                />
              }
            />

            <Route path="home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
