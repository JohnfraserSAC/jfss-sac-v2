import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingScreen } from "../components/LoadingScreen";
import { Spinner } from "../components/Spinner";
import { getErrorMessage } from "../utils/errors";

export function LoginPage() {
  const {
    isAuthenticated,
    isLoading,
    accessDenied,
    authError,
    signInWithGoogle,
  } = useAuth();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState("");

  if (isLoading) {
    return <LoadingScreen message="Checking authentication…" />;
  }

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSignIn() {
    setSigningIn(true);
    setLocalError("");

    try {
      await signInWithGoogle();
    } catch (error) {
      setLocalError(getErrorMessage(error, "Google sign-in failed."));
      setSigningIn(false);
    }
  }

  return (
    <div className="page narrow-page">
      <section className="panel">
        <p className="eyebrow">Sign in</p>
        <h1>Continue with Google</h1>
        <p>
          Sign in with your Google account to access the John Fraser SAC portal.
        </p>

        {(accessDenied || authError || localError) && (
          <ErrorMessage title="Unable to sign in">
            {localError || authError}
          </ErrorMessage>
        )}

        <button
          type="button"
          className="button button--primary"
          onClick={handleSignIn}
          disabled={signingIn}
        >
          {signingIn ? (
            <>
              <Spinner size="sm" label="Redirecting" /> Redirecting to Google…
            </>
          ) : (
            "Continue with Google"
          )}
        </button>

        <p className="note">
          Prefer to browse first?{" "}
          <Link className="text-link" to="/clubs">
            View approved clubs
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
