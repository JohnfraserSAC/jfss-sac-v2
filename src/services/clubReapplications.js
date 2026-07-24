import { supabase } from "../lib/supabase";
import { CLUB_APPLICATION_SCHOOL_YEAR } from "../config/clubApplications";
import { getErrorMessage, logServiceError } from "../utils/errors";
import { isValidPdsbEmail, normalizePdsbEmail } from "../utils/clubPermissions";

const REAPP_FIELDS = `
  id,
  club_id,
  submitted_by,
  respondent_email,
  school_year,
  submitted_club_name,
  club_purpose,
  previous_year_leaders,
  current_year_leaders,
  new_leader_contact_information,
  club_contact_information,
  instagram_handle,
  teacher_supervisor_emails,
  is_seeking_teacher_supervisor,
  teacher_supervisor_form_storage_path,
  status,
  review_notes,
  reviewed_by,
  reviewed_at,
  submitted_at,
  created_at,
  updated_at
`;

export async function submitClubReapplication(payload) {
  const { data, error } = await supabase.rpc(
    "submit_club_reapplication_request",
    {
      p_request_id: payload.requestId,
      p_club_id: payload.clubId || null,
      p_submitted_club_name: payload.submittedClubName,
      p_club_purpose: payload.clubPurpose,
      p_previous_year_leaders: payload.previousYearLeaders,
      p_current_year_leaders: payload.currentYearLeaders,
      p_new_leader_contact_information: payload.newLeaderContactInformation,
      p_club_contact_information: payload.clubContactInformation,
      p_instagram_handle: payload.instagramHandle,
      p_teacher_supervisor_emails: payload.teacherSupervisorEmails ?? [],
      p_is_seeking_teacher_supervisor: Boolean(
        payload.isSeekingTeacherSupervisor,
      ),
      p_teacher_supervisor_form_storage_path:
        payload.teacherSupervisorFormStoragePath,
      p_school_year: payload.schoolYear || CLUB_APPLICATION_SCHOOL_YEAR,
    },
  );

  if (error) {
    logServiceError("submitClubReapplication", error);
    throw new Error(
      getErrorMessage(error, "Could not submit the club re-application."),
    );
  }

  return data;
}

export async function getMyClubReapplications(userId) {
  const { data, error } = await supabase
    .from("club_reapplication_requests")
    .select(REAPP_FIELDS)
    .eq("submitted_by", userId)
    .order("submitted_at", { ascending: false });

  if (error) {
    logServiceError("getMyClubReapplications", error);
    throw new Error(
      getErrorMessage(error, "Could not load your club re-applications."),
    );
  }

  return data ?? [];
}

export async function getAdminClubReapplicationQueue({
  status = "ALL",
  search = "",
} = {}) {
  let query = supabase
    .from("club_reapplication_requests")
    .select(REAPP_FIELDS)
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
    query = query.ilike("submitted_club_name", `%${trimmed}%`);
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
  confirmedClubId = null,
}) {
  const { data, error } = await supabase.rpc(
    "review_club_reapplication_request",
    {
      p_request_id: requestId,
      p_action: action,
      p_review_notes: reviewNotes,
      p_confirmed_club_id: confirmedClubId,
    },
  );

  if (error) {
    logServiceError("reviewClubReapplication", error);
    throw new Error(
      getErrorMessage(error, "Could not review this re-application."),
    );
  }

  return data;
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
