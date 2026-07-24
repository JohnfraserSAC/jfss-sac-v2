import { supabase } from "../lib/supabase";
import { CLUB_APPLICATION_SCHOOL_YEAR } from "../config/clubApplications";
import { getErrorMessage, logServiceError } from "../utils/errors";

const EVENT_FIELDS = `
  id,
  club_id,
  submitted_by,
  respondent_email,
  school_year,
  club_email,
  event_name,
  event_details,
  requested_materials,
  status,
  review_notes,
  reviewed_by,
  reviewed_at,
  submitted_at,
  created_at,
  updated_at,
  clubs (
    id,
    name,
    slug
  )
`;

export async function submitClubEventRequest({
  clubId,
  clubEmail,
  eventName,
  eventDetails,
  requestedMaterials,
  schoolYear = CLUB_APPLICATION_SCHOOL_YEAR,
}) {
  const { data, error } = await supabase.rpc("submit_club_event_request", {
    p_club_id: clubId,
    p_club_email: String(clubEmail || "").trim().toLowerCase(),
    p_event_name: eventName,
    p_event_details: eventDetails,
    p_requested_materials: requestedMaterials,
    p_school_year: schoolYear,
  });

  if (error) {
    logServiceError("submitClubEventRequest", error);
    throw new Error(
      getErrorMessage(error, "Could not submit the event request."),
    );
  }

  return data;
}

export async function getMyClubEventRequests(userId) {
  const { data, error } = await supabase
    .from("club_event_requests")
    .select(EVENT_FIELDS)
    .eq("submitted_by", userId)
    .order("submitted_at", { ascending: false });

  if (error) {
    logServiceError("getMyClubEventRequests", error);
    throw new Error(
      getErrorMessage(error, "Could not load your event requests."),
    );
  }

  return data ?? [];
}

export async function getAdminClubEventQueue({
  status = "ALL",
  search = "",
} = {}) {
  let query = supabase
    .from("club_event_requests")
    .select(EVENT_FIELDS)
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
    query = query.ilike("event_name", `%${trimmed}%`);
  }

  const { data, error } = await query;

  if (error) {
    logServiceError("getAdminClubEventQueue", error);
    throw new Error(
      getErrorMessage(error, "Could not load the event approval queue."),
    );
  }

  return data ?? [];
}

export async function reviewClubEventRequest({
  requestId,
  action,
  reviewNotes = null,
}) {
  const { data, error } = await supabase.rpc("review_club_event_request", {
    p_request_id: requestId,
    p_action: action,
    p_review_notes: reviewNotes,
  });

  if (error) {
    logServiceError("reviewClubEventRequest", error);
    throw new Error(
      getErrorMessage(error, "Could not review this event request."),
    );
  }

  return data;
}
