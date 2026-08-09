import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLoginModal } from "../../context/LoginModalContext";
import { LoadingScreen } from "../ui/LoadingScreen";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, accessDenied } = useAuth();
  const { openLoginModal } = useLoginModal();
  const location = useLocation();
  const promptedRef = useRef("");

  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  const needsAuth = !isLoading && (!isAuthenticated || accessDenied);

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
    return <LoadingScreen message="Checking authentication…" />;
  }

  if (accessDenied || !isAuthenticated) {
    return (
      <div className="page narrow-page">
        <section className="panel">
          <p className="eyebrow">Account</p>
          <h1>Sign in required</h1>
          <p>
            Continue with Google to access this page. Your destination will be
            restored after you sign in.
          </p>
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

  return children;
}
