import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "./LoadingScreen";
import { ErrorMessage } from "./ErrorMessage";

export function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking administrator access…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="page">
        <ErrorMessage title="Access denied">
          You need SAC Admin or Site Admin privileges to view this page.
        </ErrorMessage>
      </div>
    );
  }

  return children;
}
