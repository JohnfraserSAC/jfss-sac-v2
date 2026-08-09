import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Spinner } from "../ui/Spinner";
import {
  peekAuthReturnTo,
  rememberAuthReturnTo,
} from "../../utils/authRedirect";
import { getErrorMessage } from "../../utils/errors";

export function LoginModal({ open, onClose }) {
  const {
    accessDenied,
    authError,
    signInWithGoogle,
    isAuthenticated,
  } = useAuth();
  const location = useLocation();
  const titleId = useId();
  const dialogRef = useRef(null);
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) {
      setSigningIn(false);
      setLocalError("");
      return undefined;
    }

    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape" && !signingIn) {
        onClose?.();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [open, onClose, signingIn]);

  useEffect(() => {
    if (open && isAuthenticated) {
      onClose?.();
    }
  }, [open, isAuthenticated, onClose]);

  if (!open) return null;

  async function handleSignIn() {
    setSigningIn(true);
    setLocalError("");

    if (!peekAuthReturnTo()) {
      rememberAuthReturnTo(
        `${location.pathname}${location.search}${location.hash}`,
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
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !signingIn) {
          onClose?.();
        }
      }}
    >
      <div
        className="dialog login-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="login-dialog__header">
          <p className="eyebrow">Sign in</p>
          <button
            type="button"
            className="login-dialog__close"
            onClick={onClose}
            disabled={signingIn}
            aria-label="Close sign in"
          >
            ×
          </button>
        </div>

        <h2 id={titleId}>Continue with Google</h2>
        <div className="dialog__body">
          <p>
            Sign in with your Google account to access the John Fraser SAC
            portal.
          </p>

          {(accessDenied || authError || localError) && (
            <ErrorMessage title="Unable to sign in">
              {localError || authError}
            </ErrorMessage>
          )}
        </div>

        <div className="dialog__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={onClose}
            disabled={signingIn}
          >
            Cancel
          </button>
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
        </div>
      </div>
    </div>
  );
}
