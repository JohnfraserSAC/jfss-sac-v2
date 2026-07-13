export function getErrorMessage(error, fallback = "Something went wrong.") {
  if (!error) return fallback;

  const message =
    typeof error === "string"
      ? error
      : error.message || error.error_description || fallback;

  const lower = message.toLowerCase();

  if (lower.includes("duplicate key") || lower.includes("unique constraint")) {
    if (
      lower.includes("club_memberships") ||
      lower.includes("club_memberships_pkey")
    ) {
      return "This student is already a member of this club.";
    }
    if (lower.includes("slug") || lower.includes("clubs_slug")) {
      return "That club slug is already taken. Choose a different slug.";
    }
    if (lower.includes("name")) {
      return "A club with that name already exists.";
    }
    return "That value is already in use. Please choose another.";
  }

  if (
    lower.includes("approve_club_registration_request") &&
    (lower.includes("could not find") ||
      lower.includes("does not exist") ||
      lower.includes("function") ||
      lower.includes("404"))
  ) {
    return "Club approval is unavailable. The approval function is missing on the server.";
  }

  if (
    lower.includes("only sac or site administrators") ||
    lower.includes("permission denied") ||
    lower.includes("42501") ||
    lower.includes("row-level security") ||
    lower.includes("rls")
  ) {
    return "You do not have permission to perform this action.";
  }

  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Network error. Check your connection and try again.";
  }

  return message || fallback;
}

export function logServiceError(context, error) {
  console.error(`[${context}]`, error);
}
