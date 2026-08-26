import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingScreen } from "../ui/LoadingScreen";
import { ErrorMessage } from "../ui/ErrorMessage";
import { AuthGate } from "./AuthGate";

export function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  if (isLoading) {
    return <LoadingScreen message="Checking administrator access…" />;
  }

  if (!isAuthenticated) {
    return <AuthGate returnTo={returnTo} />;
  }

  if (!isAdmin) {
    return (
      <div className="page">
        <ErrorMessage title="Access denied">
          You need SAC Admin privileges to view this page.
        </ErrorMessage>
      </div>
    );
  }

  return children;
}
