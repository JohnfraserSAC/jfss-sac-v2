export const ALLOWED_EMAIL_DOMAIN = "pdsb.net";

/**
 * Temporarily allow any Google email for development/testing.
 * Set to true later to restore the @pdsb.net-only frontend check.
 */
export const ENFORCE_PDSB_EMAIL_DOMAIN = false;

export function getEmailDomain(email) {
  return email?.trim().toLowerCase().split("@").pop() ?? "";
}

export function isAllowedEmailDomain(email) {
  if (!ENFORCE_PDSB_EMAIL_DOMAIN) {
    return Boolean(email?.trim());
  }

  return getEmailDomain(email) === ALLOWED_EMAIL_DOMAIN;
}
