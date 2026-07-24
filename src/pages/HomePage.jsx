import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage } from "../components/ErrorMessage";
import { HomepageAnnouncements } from "../components/HomepageAnnouncements";
import { Spinner } from "../components/Spinner";
import { displayName } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export function HomePage() {
  const {
    user,
    profile,
    isAuthenticated,
    canAccessExecDashboard,
    canCreateAnnouncements,
    accessDenied,
    authError,
    signInWithGoogle,
  } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState("");

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

  const name = displayName(profile, user);

  return (
    <div className="page home-page">
      <section className="hero-panel hero-panel--compact">
        <p className="eyebrow">John Fraser SS</p>
        <h1>John Fraser SAC</h1>
        <p className="lede">
          {isAuthenticated
            ? `Welcome back, ${name}. Stay up to date with published announcements.`
            : "Official announcements from the John Fraser Student Activity Council."}
        </p>

        {(accessDenied || authError || localError) && (
          <ErrorMessage title="Access denied">
            {localError || authError}
          </ErrorMessage>
        )}

        <div className="button-row">
          {!isAuthenticated ? (
            <button
              type="button"
              className="button button--primary"
              onClick={handleSignIn}
              disabled={signingIn}
            >
              {signingIn ? (
                <>
                  <Spinner size="sm" label="Redirecting" /> Redirecting…
                </>
              ) : (
                "Continue with Google"
              )}
            </button>
          ) : (
            <Link to="/dashboard" className="button button--primary">
              Open profile
            </Link>
          )}
          <Link to="/clubs" className="button button--secondary">
            Explore clubs
          </Link>
          {isAuthenticated && canCreateAnnouncements ? (
            <Link to="/announcements/new" className="button button--secondary">
              Create announcement
            </Link>
          ) : null}
          {isAuthenticated && canAccessExecDashboard ? (
            <Link to="/exec-dashboard" className="button button--secondary">
              Exec Dashboard
            </Link>
          ) : null}
        </div>
      </section>

      <HomepageAnnouncements limit={8} />
    </div>
  );
}
