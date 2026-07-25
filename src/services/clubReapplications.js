import { supabase } from "../lib/supabase";
import { getErrorMessage, logServiceError } from "../utils/errors";
import { isValidPdsbEmail, normalizePdsbEmail } from "../utils/clubPermissions";

const REAPP_FIELDS = `
  id,
  club_id,
  school_year,
  requested_by,
  applicant_email,
  short_description,
  description,
  public_email,
  instagram_handle,
  meeting_frequency,
  meeting_days,
  meeting_time_details,
  meeting_location,
  proposed_logo_storage_path,
  is_seeking_teacher_supervisor,
  declaration_accepted,
  status,
  review_notes,
  reviewed_by,
  reviewed_at,
  submitted_at,
  created_at,
  updated_at,
  clubs ( id, name, slug, logo_url )
`;

export async function listEligibleClubsForReapplication(search = "") {
  const { data, error } = await supabase.rpc(
    "list_eligible_clubs_for_reapplication",
    { p_search: search || null },
  );

  if (error) {
    logServiceError("listEligibleClubsForReapplication", error);
    throw new Error(
      getErrorMessage(error, "Could not load eligible past clubs."),
    );
  }

  return data ?? [];
}

export async function submitClubReapplication(payload) {
  const { data, error } = await supabase.rpc("submit_club_reapplication", {
    p_request_id: payload.requestId,
    p_club_id: payload.clubId,
    p_short_description: payload.shortDescription,
    p_description: payload.description,
    p_public_email: payload.publicEmail,
    p_instagram_handle: payload.instagramHandle || null,
    p_meeting_frequency: payload.meetingFrequency,
    p_meeting_days: payload.meetingDays ?? [],
    p_meeting_time_details: payload.meetingTimeDetails || null,
    p_meeting_location: payload.meetingLocation || null,
    p_proposed_logo_storage_path: payload.proposedLogoStoragePath || null,
    p_is_seeking_teacher_supervisor: Boolean(
      payload.isSeekingTeacherSupervisor,
    ),
    p_declaration_accepted: Boolean(payload.declarationAccepted),
    p_supervisors: payload.supervisors ?? [],
    p_attachments: payload.attachments ?? [],
  });

  if (error) {
    logServiceError("submitClubReapplication", error);
    throw new Error(
      getErrorMessage(error, "Could not submit the club re-application."),
    );
  }

  return data;
}

export async function updateClubReapplication(payload) {
  const { data, error } = await supabase.rpc("update_club_reapplication", {
    p_request_id: payload.requestId,
    p_short_description: payload.shortDescription,
    p_description: payload.description,
    p_public_email: payload.publicEmail,
    p_instagram_handle: payload.instagramHandle || null,
    p_meeting_frequency: payload.meetingFrequency,
    p_meeting_days: payload.meetingDays ?? [],
    p_meeting_time_details: payload.meetingTimeDetails || null,
    p_meeting_location: payload.meetingLocation || null,
    p_proposed_logo_storage_path: payload.proposedLogoStoragePath || null,
    p_is_seeking_teacher_supervisor: Boolean(
      payload.isSeekingTeacherSupervisor,
    ),
    p_declaration_accepted: Boolean(payload.declarationAccepted),
    p_supervisors: payload.supervisors ?? [],
    p_attachments: payload.attachments ?? null,
  });

  if (error) {
    logServiceError("updateClubReapplication", error);
    throw new Error(
      getErrorMessage(error, "Could not update the club re-application."),
    );
  }

  return data;
}

export async function resubmitClubReapplication(requestId) {
  const { data, error } = await supabase.rpc("resubmit_club_reapplication", {
    p_request_id: requestId,
  });

  if (error) {
    logServiceError("resubmitClubReapplication", error);
    throw new Error(
      getErrorMessage(error, "Could not resubmit the club re-application."),
    );
  }

  return data;
}

export async function getMyClubReapplications(userId) {
  const { data, error } = await supabase
    .from("club_reapplication_requests")
    .select(
      `${REAPP_FIELDS}, club_reapplication_supervisors (*), club_reapplication_attachments (*)`,
    )
    .eq("requested_by", userId)
    .order("submitted_at", { ascending: false });

  if (error) {
    logServiceError("getMyClubReapplications", error);
    throw new Error(
      getErrorMessage(error, "Could not load your club re-applications."),
    );
  }

  return data ?? [];
}

export async function getClubReapplicationById(requestId) {
  const { data, error } = await supabase
    .from("club_reapplication_requests")
    .select(
      `${REAPP_FIELDS}, club_reapplication_supervisors (*), club_reapplication_attachments (*)`,
    )
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    logServiceError("getClubReapplicationById", error);
    throw new Error(
      getErrorMessage(error, "Could not load this re-application."),
    );
  }

  return data;
}

export async function getAdminClubReapplicationQueue({
  status = "ALL",
  search = "",
} = {}) {
  let query = supabase
    .from("club_reapplication_requests")
    .select(
      `${REAPP_FIELDS}, club_reapplication_supervisors (*), club_reapplication_attachments (*)`,
    )
    .order("submitted_at", { ascending: false });

  if (status === "ALL") {
    query = query.in("status", [
      "SUBMITTED",
      "UNDER_REVIEW",
      "CHANGES_REQUESTED",
    ]);
  } else {
    query = query.eq("status", status);
  }

  const trimmed = search.trim();
  if (trimmed) {
    query = query.or(
      `short_description.ilike.%${trimmed}%,public_email.ilike.%${trimmed}%,applicant_email.ilike.%${trimmed}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    logServiceError("getAdminClubReapplicationQueue", error);
    throw new Error(
      getErrorMessage(error, "Could not load the re-application queue."),
    );
  }

  return data ?? [];
}

export async function reviewClubReapplication({
  requestId,
  action,
  reviewNotes = null,
}) {
  const { data, error } = await supabase.rpc("review_club_reapplication", {
    p_request_id: requestId,
    p_action: action,
    p_review_notes: reviewNotes,
  });

  if (error) {
    logServiceError("reviewClubReapplication", error);
    throw new Error(
      getErrorMessage(error, "Could not review this re-application."),
    );
  }

  return data;
}

export async function approveClubReapplication({
  requestId,
  reviewNotes = null,
}) {
  const { data, error } = await supabase.rpc("approve_club_reapplication", {
    p_request_id: requestId,
    p_review_notes: reviewNotes,
  });

  if (error) {
    logServiceError("approveClubReapplication", error);
    throw new Error(
      getErrorMessage(error, "Could not approve this re-application."),
    );
  }

  return data;
}

export function validateSupervisorEntries(entries, { required = true } = {}) {
  const cleaned = (entries || [])
    .map((entry) => ({
      name: String(entry.name ?? "").trim(),
      email: normalizePdsbEmail(entry.email),
    }))
    .filter((entry) => entry.name || entry.email);

  if (!required && cleaned.length === 0) {
    return { supervisors: [], error: null };
  }

  if (required && cleaned.length < 1) {
    return {
      supervisors: [],
      error: "Add at least one teacher supervisor, or mark that you are still searching.",
    };
  }

  if (cleaned.length > 3) {
    return {
      supervisors: [],
      error: "You may list at most three teacher supervisors.",
    };
  }

  for (const entry of cleaned) {
    if (entry.name.length < 2) {
      return {
        supervisors: [],
        error: "Each supervisor needs a full name.",
      };
    }
    if (!isValidPdsbEmail(entry.email)) {
      return {
        supervisors: [],
        error: "Each supervisor email must be an exact @pdsb.net address.",
      };
    }
  }

  return { supervisors: cleaned, error: null };
}

export function parseSupervisorEmails(raw) {
  return String(raw ?? "")
    .split(/[\n,;]+/)
    .map((value) => normalizePdsbEmail(value))
    .filter(Boolean);
}

export function validateSupervisorEmails(raw, { required = true } = {}) {
  const emails = parseSupervisorEmails(raw);
  if (!required && emails.length === 0) {
    return { emails: [], error: null };
  }
  if (required && emails.length === 0) {
    return {
      emails: [],
      error: "Enter at least one teacher supervisor @pdsb.net email.",
    };
  }
  if (emails.some((email) => !isValidPdsbEmail(email))) {
    return {
      emails: [],
      error: "Every teacher supervisor email must be an exact @pdsb.net address.",
    };
  }
  return { emails, error: null };
}
