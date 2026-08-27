import { supabase } from "../lib/supabase";
import {
  CLUB_LOGOS_BUCKET,
  REAPP_LOGO_ALLOWED_TYPES,
  REAPP_LOGO_MAX_BYTES,
} from "../config/clubApplications";
import { getErrorMessage, logServiceError } from "../utils/errors";

function extensionForMime(mime) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function validateClubLogoFile(file) {
  if (!file) {
    return "Choose a club logo image.";
  }

  if (!REAPP_LOGO_ALLOWED_TYPES.includes(file.type)) {
    return "Logo must be JPEG, PNG, or WebP.";
  }

  if (file.size > REAPP_LOGO_MAX_BYTES) {
    return "Logo must be 5 MB or smaller.";
  }

  return null;
}

export function buildClubProfileLogoPath({ userId, clubId, file }) {
  const ext = extensionForMime(file.type);
  return `club-profile-logos/${userId}/${clubId}/${crypto.randomUUID()}.${ext}`;
}

/**
 * Upload a club logo for an owned club. Returns the storage object path
 * (stored in clubs.logo_url; resolve with resolveClubLogoUrl for display).
 * Path: club-profile-logos/{userId}/{clubId}/{uuid}.{ext}
 */
export async function uploadClubLogo({ userId, clubId, file }) {
  const validationError = validateClubLogoFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  if (!userId || !clubId) {
    throw new Error("Missing upload destination for club logo.");
  }

  const path = buildClubProfileLogoPath({ userId, clubId, file });

  const { error } = await supabase.storage
    .from(CLUB_LOGOS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    logServiceError("uploadClubLogo", error);
    throw new Error(
      getErrorMessage(
        error,
        "Could not upload the club logo. If this keeps failing, apply the latest Supabase migrations.",
      ),
    );
  }

  return path;
}
