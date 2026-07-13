import { supabase } from "../lib/supabase";
import { getErrorMessage, logServiceError } from "../utils/errors";
import { validateAnnouncementForm } from "../utils/announcementPermissions";

const ANNOUNCEMENT_FIELDS = `
  id,
  club_id,
  title,
  summary,
  body,
  image_url,
  status,
  created_by,
  submitted_at,
  reviewed_by,
  reviewed_at,
  review_notes,
  published_at,
  expires_at,
  archived_at,
  created_at,
  updated_at
`;

const ANNOUNCEMENT_WITH_CLUB = `
  ${ANNOUNCEMENT_FIELDS},
  clubs (
    id,
    name,
    slug,
    logo_url,
    status
  )
`;

function mapAnnouncementError(error, fallback) {
  const message = error?.message || "";
  const lower = message.toLowerCase();

  if (
    lower.includes("could not find the function") ||
    lower.includes("function public.create_announcement") ||
    lower.includes("function public.edit_announcement") ||
    lower.includes("function public.review_announcement") ||
    lower.includes("function public.archive_announcement") ||
    error?.code === "PGRST202"
  ) {
    return "Announcement workflow is unavailable. A required database function is missing.";
  }

  if (lower.includes("only a club owner may create")) {
    return "You do not have permission to create an announcement for this club.";
  }

  if (lower.includes("only sac or site administrators may review")) {
    return "Only SAC administrators may approve club announcements.";
  }

  if (lower.includes("can no longer be edited") || lower.includes("may be edited")) {
    return "This announcement can no longer be edited.";
  }

  if (lower.includes("already been reviewed") || lower.includes("cannot be")) {
    return message;
  }

  if (lower.includes("announcement not found")) {
    return "The announcement could not be found or you do not have permission to view it.";
  }

  return getErrorMessage(error, fallback);
}

async function fetchAnnouncementById(id) {
  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_WITH_CLUB)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logServiceError("fetchAnnouncementById", error);
    throw new Error(
      mapAnnouncementError(
        error,
        "The announcement could not be found or you do not have permission to view it.",
      ),
    );
  }

  return data;
}

export async function getPublishedAnnouncements({
  search = "",
  type = "ALL",
  clubId = null,
  limit = 50,
  offset = 0,
} = {}) {
  let query = supabase
    .from("announcements")
    .select(ANNOUNCEMENT_WITH_CLUB)
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type === "GENERAL") {
    query = query.is("club_id", null);
  } else if (type === "CLUB") {
    query = query.not("club_id", "is", null);
  }

  if (clubId) {
    query = query.eq("club_id", clubId);
  }

  const trimmed = search.trim();
  if (trimmed) {
    query = query.or(
      `title.ilike.%${trimmed}%,summary.ilike.%${trimmed}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    logServiceError("getPublishedAnnouncements", error);
    throw new Error(
      mapAnnouncementError(error, "Could not load announcements."),
    );
  }

  return data ?? [];
}

export async function getHomepageAnnouncements(limit = 5) {
  return getPublishedAnnouncements({ limit, offset: 0 });
}

export async function getAnnouncementById(id) {
  return fetchAnnouncementById(id);
}

export async function getMyAnnouncements(userId, { status = "ALL" } = {}) {
  let query = supabase
    .from("announcements")
    .select(ANNOUNCEMENT_WITH_CLUB)
    .eq("created_by", userId)
    .order("updated_at", { ascending: false });

  if (status !== "ALL") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    logServiceError("getMyAnnouncements", error);
    throw new Error(
      mapAnnouncementError(error, "Could not load your announcements."),
    );
  }

  return data ?? [];
}

export async function getAnnouncementReviewQueue({
  status = "ACTIVE",
  search = "",
  clubId = null,
} = {}) {
  let query = supabase
    .from("announcements")
    .select(ANNOUNCEMENT_WITH_CLUB)
    .order("submitted_at", { ascending: true, nullsFirst: false });

  if (status === "ACTIVE") {
    query = query.in("status", ["SUBMITTED", "UNDER_REVIEW"]);
  } else if (status === "CHANGES_REQUESTED") {
    query = query.eq("status", "CHANGES_REQUESTED");
  } else if (status !== "ALL") {
    query = query.eq("status", status);
  } else {
    query = query.in("status", [
      "SUBMITTED",
      "UNDER_REVIEW",
      "CHANGES_REQUESTED",
    ]);
  }

  if (clubId) {
    query = query.eq("club_id", clubId);
  }

  const trimmed = search.trim();
  if (trimmed) {
    query = query.ilike("title", `%${trimmed}%`);
  }

  const { data, error } = await query;

  if (error) {
    logServiceError("getAnnouncementReviewQueue", error);
    throw new Error(
      mapAnnouncementError(error, "Could not load the announcement queue."),
    );
  }

  return data ?? [];
}

export async function getOwnedClubsForAnnouncements(userId) {
  const { data, error } = await supabase
    .from("club_memberships")
    .select(
      `
      club_id,
      role,
      status,
      clubs (
        id,
        name,
        slug,
        logo_url,
        status
      )
    `,
    )
    .eq("user_id", userId)
    .eq("role", "OWNER")
    .eq("status", "ACTIVE");

  if (error) {
    logServiceError("getOwnedClubsForAnnouncements", error);
    throw new Error(
      getErrorMessage(error, "Could not load clubs you own."),
    );
  }

  return (data ?? [])
    .map((row) => row.clubs)
    .filter((club) => club && club.status === "APPROVED");
}

export async function getApprovedClubsForStaffAnnouncements() {
  const { data, error } = await supabase
    .from("clubs")
    .select("id, name, slug, logo_url, status")
    .eq("status", "APPROVED")
    .order("name", { ascending: true });

  if (error) {
    logServiceError("getApprovedClubsForStaffAnnouncements", error);
    throw new Error(
      getErrorMessage(error, "Could not load approved clubs."),
    );
  }

  return data ?? [];
}

export async function createAnnouncement(values, action) {
  const requireClub = action === "SUBMIT" || action === "DRAFT"
    ? Boolean(values.requireClub)
    : false;

  const { isValid, errors, data } = validateAnnouncementForm(values, {
    requireClub: values.requireClub || requireClub,
  });

  if (!isValid) {
    const error = new Error(Object.values(errors)[0]);
    error.fieldErrors = errors;
    throw error;
  }

  const { data: announcementId, error } = await supabase.rpc(
    "create_announcement",
    {
      p_title: data.title,
      p_body: data.body,
      p_summary: data.summary,
      p_image_url: data.imageUrl,
      p_club_id: data.clubId,
      p_action: action,
      p_expires_at: data.expiresAt,
    },
  );

  if (error) {
    logServiceError("createAnnouncement", error);
    throw new Error(
      mapAnnouncementError(error, "Could not create the announcement."),
    );
  }

  return announcementId;
}

export async function editAnnouncement(id, values, action) {
  const { isValid, errors, data } = validateAnnouncementForm(values);

  if (!isValid) {
    const error = new Error(Object.values(errors)[0]);
    error.fieldErrors = errors;
    throw error;
  }

  const { data: announcementId, error } = await supabase.rpc(
    "edit_announcement",
    {
      p_announcement_id: id,
      p_title: data.title,
      p_body: data.body,
      p_summary: data.summary,
      p_image_url: data.imageUrl,
      p_action: action,
      p_expires_at: data.expiresAt,
    },
  );

  if (error) {
    logServiceError("editAnnouncement", error);
    throw new Error(
      mapAnnouncementError(error, "Could not update the announcement."),
    );
  }

  return announcementId;
}

export async function reviewAnnouncement(id, action, reviewNotes = null) {
  const { data: announcementId, error } = await supabase.rpc(
    "review_announcement",
    {
      p_announcement_id: id,
      p_action: action,
      p_review_notes: reviewNotes || null,
    },
  );

  if (error) {
    logServiceError("reviewAnnouncement", error);
    throw new Error(
      mapAnnouncementError(error, "Could not review the announcement."),
    );
  }

  return announcementId;
}

export async function archiveAnnouncement(id) {
  const { data: announcementId, error } = await supabase.rpc(
    "archive_announcement",
    {
      p_announcement_id: id,
    },
  );

  if (error) {
    logServiceError("archiveAnnouncement", error);
    throw new Error(
      mapAnnouncementError(error, "Could not archive the announcement."),
    );
  }

  return announcementId;
}
