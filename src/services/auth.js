import { supabase } from "../lib/supabase";
import { getErrorMessage, logServiceError } from "../utils/errors";

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    logServiceError("signInWithGoogle", error);
    throw new Error(getErrorMessage(error, "Google sign-in failed."));
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    logServiceError("signOut", error);
    throw new Error(getErrorMessage(error, "Sign out failed."));
  }
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    const message = String(error.message || "").toLowerCase();
    // No session is the normal signed-out state — not an auth failure.
    if (
      message.includes("auth session missing") ||
      error.name === "AuthSessionMissingError"
    ) {
      return null;
    }

    logServiceError("getCurrentUser", error);
    throw new Error(getErrorMessage(error, "Could not load the current user."));
  }

  return user;
}
