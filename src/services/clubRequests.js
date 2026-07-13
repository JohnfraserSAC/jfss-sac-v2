import { supabase } from "../lib/supabase";
import { getErrorMessage, logServiceError } from "../utils/errors";
import { validateClubRequestForm, validateClubSlug } from "../utils/validation";

const REQUEST_FIELDS = `
  id,
  requested_by,
  proposed_name,
  short_description,
  description,
  purpose,
  faculty_advisor_name,
  faculty_advisor_email,
  expected_member_count,
  meeting_plan,
  constitution_url,
  status,
  review_notes,
  reviewed_by,
  reviewed_at,
  created_club_id,
  submitted_at,
  created_at,
  updated_at
`;

const ADMIN_QUEUE_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED"];

export async function getMyClubRequests(userId) {
  const { data, error } = await supabase
    .from("club_registration_requests")
    .select(REQUEST_FIELDS)
    .eq("requested_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    logServiceError("getMyClubRequests", error);
    throw new Error(getErrorMessage(error, "Could not load your club requests."));
  }

  return data ?? [];
}

export async function submitClubRequest(userId, formValues) {
  const { data: normalized, errors, isValid } =
    validateClubRequestForm(formValues);

  if (!isValid) {
    const firstError = Object.values(errors)[0];
    const error = new Error(firstError);
    error.fieldErrors = errors;
    throw error;
  }

  const payload = {
    ...normalized,
    requested_by: userId,
    status: "SUBMITTED",
  };

  const { data, error } = await supabase
    .from("club_registration_requests")
    .insert(payload)
    .select(REQUEST_FIELDS)
    .single();

  if (error) {
    logServiceError("submitClubRequest", error);
    throw new Error(getErrorMessage(error, "Could not submit your club request."));
  }

  return data;
}

export async function updateMyClubRequest(requestId, formValues) {
  const { data: normalized, errors, isValid } =
    validateClubRequestForm(formValues);

  if (!isValid) {
    const firstError = Object.values(errors)[0];
    const error = new Error(firstError);
    error.fieldErrors = errors;
    throw error;
  }

  const { data, error } = await supabase
    .from("club_registration_requests")
    .update(normalized)
    .eq("id", requestId)
    .select(REQUEST_FIELDS)
    .single();

  if (error) {
    logServiceError("updateMyClubRequest", error);
    throw new Error(getErrorMessage(error, "Could not update your club request."));
  }

  return data;
}

export async function resubmitClubRequest(requestId) {
  const { data, error } = await supabase
    .from("club_registration_requests")
    .update({ status: "SUBMITTED" })
    .eq("id", requestId)
    .select(REQUEST_FIELDS)
    .single();

  if (error) {
    logServiceError("resubmitClubRequest", error);
    throw new Error(getErrorMessage(error, "Could not resubmit your club request."));
  }

  return data;
}

export async function withdrawClubRequest(requestId) {
  const { data, error } = await supabase
    .from("club_registration_requests")
    .update({ status: "WITHDRAWN" })
    .eq("id", requestId)
    .select(REQUEST_FIELDS)
    .single();

  if (error) {
    logServiceError("withdrawClubRequest", error);
    throw new Error(getErrorMessage(error, "Could not withdraw your club request."));
  }

  return data;
}

export async function deleteDraftClubRequest(requestId) {
  const { error } = await supabase
    .from("club_registration_requests")
    .delete()
    .eq("id", requestId);

  if (error) {
    logServiceError("deleteDraftClubRequest", error);
    throw new Error(getErrorMessage(error, "Could not delete this draft."));
  }
}

export async function getAdminClubRequestQueue({
  status = "ALL",
  search = "",
} = {}) {
  let query = supabase
    .from("club_registration_requests")
    .select(REQUEST_FIELDS)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (status === "ALL") {
    query = query.in("status", ADMIN_QUEUE_STATUSES);
  } else {
    query = query.eq("status", status);
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    query = query.ilike("proposed_name", `%${trimmedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    logServiceError("getAdminClubRequestQueue", error);
    throw new Error(
      getErrorMessage(error, "Could not load the club request queue."),
    );
  }

  return data ?? [];
}

export async function updateClubRequestReview({
  requestId,
  status,
  reviewNotes = null,
  reviewedBy,
}) {
  const payload = {
    status,
    reviewed_by: reviewedBy,
  };

  if (reviewNotes !== undefined) {
    payload.review_notes = reviewNotes;
  }

  const { data, error } = await supabase
    .from("club_registration_requests")
    .update(payload)
    .eq("id", requestId)
    .select(REQUEST_FIELDS)
    .single();

  if (error) {
    logServiceError("updateClubRequestReview", error);
    throw new Error(
      getErrorMessage(error, "Could not update the club request review."),
    );
  }

  return data;
}

export async function approveClubRequest({
  requestId,
  slug,
  reviewNotes = null,
}) {
  const slugError = validateClubSlug(slug);
  if (slugError) {
    throw new Error(slugError);
  }

  const { data, error } = await supabase.rpc(
    "approve_club_registration_request",
    {
      p_request_id: requestId,
      p_slug: slug.trim().toLowerCase(),
      p_review_notes: reviewNotes || null,
    },
  );

  if (error) {
    logServiceError("approveClubRequest", error);

    const message = error.message || "";
    const lower = message.toLowerCase();

    if (
      lower.includes("could not find the function") ||
      lower.includes("function public.approve_club_registration_request") ||
      error.code === "PGRST202"
    ) {
      throw new Error(
        "Club approval is unavailable. The approve_club_registration_request function is missing on the server.",
      );
    }

    throw new Error(getErrorMessage(error, "Could not approve this club request."));
  }

  return data;
}

export async function getDashboardSummary(userId) {
  const summary = {
    requestCount: 0,
    activeMembershipCount: 0,
    recentRequests: [],
    errors: {},
  };

  try {
    const { data, error, count } = await supabase
      .from("club_registration_requests")
      .select(REQUEST_FIELDS, { count: "exact" })
      .eq("requested_by", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;

    summary.requestCount = count ?? data?.length ?? 0;
    summary.recentRequests = data ?? [];
  } catch (error) {
    logServiceError("getDashboardSummary.requests", error);
    summary.errors.requests = getErrorMessage(
      error,
      "Could not load your club requests.",
    );
  }

  try {
    const { count, error } = await supabase
      .from("club_memberships")
      .select("club_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "ACTIVE");

    if (error) throw error;

    summary.activeMembershipCount = count ?? 0;
  } catch (error) {
    logServiceError("getDashboardSummary.memberships", error);
    summary.errors.memberships = getErrorMessage(
      error,
      "Could not load your club memberships.",
    );
  }

  return summary;
}
