import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingScreen } from "../ui/LoadingScreen";
import { ErrorMessage } from "../ui/ErrorMessage";

/**
 * Requires authentication and at least one of the allowed system-role codes.
 */
export function RoleRoute({ allowedRoles = [], children }) {
  const { isAuthenticated, isLoading, systemRoles } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking access…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roleCodes = (systemRoles || []).map((role) => role.code);
  const allowed = allowedRoles.some((code) => roleCodes.includes(code));

  if (!allowed) {
    return (
      <div className="page">
        <ErrorMessage title="Access denied">
          You do not have permission to view this page.
        </ErrorMessage>
      </div>
    );
  }

  return children;
}
