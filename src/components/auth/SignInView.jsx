import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Spinner } from "../ui/Spinner";
import {
  peekAuthReturnTo,
  rememberAuthReturnTo,
} from "../../utils/authRedirect";
import { getErrorMessage } from "../../utils/errors";

function GoogleMark() {
  return (
    <svg
      className="sign-in-view__google-icon"
      width="20"
      height="20"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.658 29.227 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 14 24 14c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

/**
 * Fraser Pay–style sign-in card: logo, Welcome, Google CTA, help footer.
 * Performs Google OAuth directly (no popup shell).
 */
export function SignInView({ returnTo, className = "" }) {
  const { accessDenied, authError, signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState("");

  async function handleSignIn() {
    setSigningIn(true);
    setLocalError("");

    if (returnTo) {
      rememberAuthReturnTo(returnTo);
    } else if (!peekAuthReturnTo()) {
      rememberAuthReturnTo(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      );
    }

    try {
      await signInWithGoogle();
    } catch (error) {
      setLocalError(getErrorMessage(error, "Google sign-in failed."));
      setSigningIn(false);
    }
  }

  return (
    <div className={`sign-in-view${className ? ` ${className}` : ""}`}>
      <div className="sign-in-view__logo-frame">
        <img
          src="/images/SAC-LOGO.png"
          alt="John Fraser SAC"
          className="sign-in-view__logo"
          width={120}
          height={120}
        />
      </div>

      <div className="sign-in-view__card">
        <h1 className="sign-in-view__title">Welcome</h1>
        <p className="sign-in-view__subtitle">
          Sign in to access your SAC portal account.
        </p>

        {(accessDenied || authError || localError) && (
          <ErrorMessage title="Unable to sign in">
            {localError || authError}
          </ErrorMessage>
        )}

        <button
          type="button"
          className="sign-in-view__google"
          onClick={handleSignIn}
          disabled={signingIn}
        >
          {signingIn ? (
            <>
              <Spinner size="sm" label="Redirecting" />
              Redirecting…
            </>
          ) : (
            <>
              <GoogleMark />
              Sign in With Google
            </>
          )}
        </button>

        <div className="sign-in-view__footer">
          <span className="sign-in-view__info-icon" aria-hidden="true">
            i
          </span>
          <p className="sign-in-view__help">
            Contact SAC if you need help signing in.
          </p>
        </div>
      </div>
    </div>
  );
}
