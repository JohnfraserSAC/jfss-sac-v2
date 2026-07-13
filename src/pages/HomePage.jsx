import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage } from "../components/ErrorMessage";
import { RoleBadge } from "../components/RoleBadge";
import { Spinner } from "../components/Spinner";
import { displayName } from "../utils/format";
import { getErrorMessage } from "../utils/errors";

export function HomePage() {
  const {
    user,
    profile,
    systemRoles,
    isAuthenticated,
    isAdmin,
    accessDenied,
    authError,
    signInWithGoogle,
  } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState("");
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

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

  if (!isAuthenticated) {
    return (
      <div className="page home-page">
        <section className="hero-panel">
          <p className="eyebrow">John Fraser SS</p>
          <h1>John Fraser SAC</h1>
          <p className="lede">
            The student activity council portal for club discovery, club
            registration, and SAC administration.
          </p>

          {(accessDenied || authError || localError) && (
            <ErrorMessage title="Access denied">
              {localError || authError}
            </ErrorMessage>
          )}

          <div className="button-row">
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
            <Link to="/clubs" className="button button--secondary">
              Browse approved clubs
            </Link>
          </div>

          <p className="note">
            Sign in with a Google account to continue.
          </p>
        </section>
      </div>
    );
  }

  const name = displayName(profile, user);

  return (
    <div className="page home-page">
      <section className="hero-panel">
        <p className="eyebrow">Welcome back</p>
        <h1>{name}</h1>
        <p className="lede">
          Use the portal to register a club, track your requests, and manage
          your memberships.
        </p>

        {authError ? <ErrorMessage>{authError}</ErrorMessage> : null}

        <div className="stat-grid">
          <div className="stat-card">
            <h2>Profile</h2>
            <p>
              {profile
                ? "Your database profile was found."
                : "Your database profile was not found."}
            </p>
          </div>
          <div className="stat-card">
            <h2>System roles</h2>
            {systemRoles.length === 0 ? (
              <p>No system roles assigned.</p>
            ) : (
              <ul className="role-list">
                {systemRoles.map((role) => (
                  <li key={role.code}>
                    <div className="role-list__item">
                      <RoleBadge role={role.code} />
                      <div>
                        <strong>{role.name || role.code}</strong>
                        {role.description ? <p>{role.description}</p> : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="quick-links">
          <Link to="/register-club" className="quick-link">
            Register a club
          </Link>
          <Link to="/my-requests" className="quick-link">
            My requests
          </Link>
          <Link to="/my-clubs" className="quick-link">
            My clubs
          </Link>
          {isAdmin ? (
            <Link to="/admin/club-requests" className="quick-link">
              Admin queue
            </Link>
          ) : null}
        </div>
      </section>

      <details
        className="diagnostics"
        open={diagnosticsOpen}
        onToggle={(event) => setDiagnosticsOpen(event.currentTarget.open)}
      >
        <summary>Development Diagnostics</summary>
        <dl className="meta-list">
          <div>
            <dt>Auth user ID</dt>
            <dd>
              <code>{user.id}</code>
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Provider</dt>
            <dd>{user.app_metadata?.provider ?? "Unknown"}</dd>
          </div>
          <div>
            <dt>Profile present</dt>
            <dd>{profile ? "Yes" : "No"}</dd>
          </div>
        </dl>
        <pre className="diagnostics__pre">
          {JSON.stringify({ profile, systemRoles }, null, 2)}
        </pre>
      </details>
    </div>
  );
}
