import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ClubsPage } from "./pages/ClubsPage";
import { ClubDetailPage } from "./pages/ClubDetailPage";
import { ClubManagePage } from "./pages/ClubManagePage";
import { RegisterClubPage } from "./pages/RegisterClubPage";
import { MyRequestsPage } from "./pages/MyRequestsPage";
import { MyClubsPage } from "./pages/MyClubsPage";
import { AdminClubRequestsPage } from "./pages/AdminClubRequestsPage";
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
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="register-club"
              element={
                <ProtectedRoute>
                  <RegisterClubPage />
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
              path="my-clubs"
              element={
                <ProtectedRoute>
                  <MyClubsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/club-requests"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminClubRequestsPage />
                  </AdminRoute>
                </ProtectedRoute>
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
