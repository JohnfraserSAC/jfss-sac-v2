export function validateClubSlug(slug) {
  const normalized = String(slug ?? "").trim().toLowerCase();

  if (normalized.length < 2 || normalized.length > 100) {
    return "Slug must be between 2 and 100 characters.";
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(normalized)) {
    return "Slug may only use lowercase letters, numbers, and single hyphens.";
  }

  return null;
}
