import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoginModal } from "../../context/LoginModalContext";
import { LoadingScreen } from "../ui/LoadingScreen";
import { ErrorMessage } from "../ui/ErrorMessage";

export function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
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
    return <LoadingScreen message="Checking administrator access…" />;
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
