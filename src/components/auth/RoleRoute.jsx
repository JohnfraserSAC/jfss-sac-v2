import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoginModal } from "../../context/LoginModalContext";
import { LoadingScreen } from "../ui/LoadingScreen";
import { ErrorMessage } from "../ui/ErrorMessage";

/**
 * Requires authentication and at least one of the allowed system-role codes.
 */
export function RoleRoute({ allowedRoles = [], children }) {
  const { isAuthenticated, isLoading, systemRoles } = useAuth();
  const { openLoginModal } = useLoginModal();
  const location = useLocation();
  const promptedRef = useRef("");

  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  const needsAuth = !isLoading && !isAuthenticated;

  useEffect(() => {
    if (!needsAuth) {
      promptedRef.current = "";
      return;
    }
    if (promptedRef.current === returnTo) return;
    promptedRef.current = returnTo;
    openLoginModal(returnTo);
  }, [needsAuth, openLoginModal, returnTo]);

  if (isLoading) {
    return <LoadingScreen message="Checking access…" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="page narrow-page">
        <section className="panel">
          <p className="eyebrow">Account</p>
          <h1>Sign in required</h1>
          <p>Continue with Google to access this page.</p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => openLoginModal(returnTo)}
          >
            Sign in
          </button>
        </section>
      </div>
    );
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
