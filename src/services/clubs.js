import { supabase } from "../lib/supabase";
import { resolveClubLogoUrl } from "../utils/clubMedia";
import { getErrorMessage, logServiceError } from "../utils/errors";

function withResolvedLogo(club) {
  if (!club) return club;
  return {
    ...club,
    logo_url: resolveClubLogoUrl(club.logo_url),
  };
}

const CLUB_FIELDS = `
  id,
  name,
  slug,
  short_description,
  description,
  logo_url,
  banner_url,
  contact_email,
  leader_contact_information,
  instagram_handle,
  meeting_location,
  meeting_schedule,
  meeting_frequency,
  meeting_days,
  meeting_time_details,
  status,
  creation_origin,
  deleted_at,
  eligible_for_reapplication,
  is_imported_seed,
  created_by,
  approved_by,
  approved_at,
  created_at,
  updated_at
`;

function mapClubMutationError(error, fallback) {
  const message = error?.message?.toLowerCase?.() || "";

  if (
    message.includes("cannot be permanently deleted") ||
    message.includes("cannot be reactivated directly")
  ) {
    return error?.message || fallback;
  }

  if (
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("rls") ||
    message.includes("42501") ||
    message.includes("only an active club owner")
  ) {
    return (
      error?.message ||
      "You do not have permission to perform this club action."
    );
  }

  if (
    message.includes("already archived") ||
    message.includes("already inactive")
  ) {
    return error?.message || "This club is already archived.";
  }

  if (
    message.includes("foreign key") ||
    message.includes("violates foreign key") ||
    message.includes("still referenced")
  ) {
    return "This club still has related records and cannot be changed that way.";
  }

  return getErrorMessage(error, fallback);
}

/** Public Explore: current-year ACTIVE clubs only (enforced by view/RLS). */
export async function getApprovedClubs() {
  const { data, error } = await supabase
    .from("public_active_clubs")
    .select(
      `
      id,
      name,
      slug,
      short_description,
      description,
      logo_url,
      banner_url,
      contact_email,
      leader_contact_information,
      instagram_handle,
      meeting_location,
      meeting_schedule,
      meeting_frequency,
      meeting_days,
      meeting_time_details,
      club_record_status,
      school_year,
      annual_status,
      activated_at,
      created_at,
      updated_at
    `,
    )
    .order("name", { ascending: true });

  if (error) {
    logServiceError("getApprovedClubs", error);
    throw new Error(getErrorMessage(error, "Could not load approved clubs."));
  }

  return (data ?? []).map((row) =>
    withResolvedLogo({
      ...row,
      status: row.club_record_status || "APPROVED",
    }),
  );
}

export async function getClubAnnualState(clubId) {
  const schoolYear = await getCurrentClubSchoolYear();
  const { data, error } = await supabase
    .from("club_school_years")
    .select(
      "id, club_id, school_year, status, supervisor_due_at, activated_at, updated_at",
    )
    .eq("club_id", clubId)
    .eq("school_year", schoolYear)
    .maybeSingle();

  if (error) {
    logServiceError("getClubAnnualState", error);
    throw new Error(
      getErrorMessage(error, "Could not load this club’s annual status."),
    );
  }

  return data;
}

export async function listClubsByAnnualStatus(status) {
  const { data, error } = await supabase.rpc("list_clubs_by_annual_status", {
    p_status: status,
  });

  if (error) {
    logServiceError("listClubsByAnnualStatus", error);
    throw new Error(
      getErrorMessage(error, "Could not load clubs for this category."),
    );
  }

  return data ?? [];
}

export async function getCurrentClubSchoolYear() {
  const { data, error } = await supabase.rpc("get_current_club_school_year");
  if (error) {
    logServiceError("getCurrentClubSchoolYear", error);
    return "2026-2027";
  }
  return data || "2026-2027";
}

export async function getClubBySlug(slug) {
  const { data, error } = await supabase
    .from("clubs")
    .select(CLUB_FIELDS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    logServiceError("getClubBySlug", error);
    throw new Error(getErrorMessage(error, "Could not load this club."));
  }

  return withResolvedLogo(data);
}

export async function getClubById(clubId) {
  const { data, error } = await supabase
    .from("clubs")
    .select(CLUB_FIELDS)
    .eq("id", clubId)
    .maybeSingle();

  if (error) {
    logServiceError("getClubById", error);
    throw new Error(getErrorMessage(error, "Could not load this club."));
  }

  return withResolvedLogo(data);
}

/**
 * Owner (or SAC_ADMIN) profile update. Preserves club UUID and slug.
 */
export async function updateOwnedClubProfile(clubId, values) {
  const name = String(values?.name ?? "").trim();
  const description = String(values?.description ?? "").trim();
  const contactEmail = String(values?.contactEmail ?? "").trim() || null;
  const leaderContactInformation =
    String(values?.leaderContactInformation ?? "").trim() || null;
  const shortDescription =
    String(values?.shortDescription ?? "").trim() || null;

  if (name.length < 2 || name.length > 100) {
    throw new Error("Club name must be between 2 and 100 characters.");
  }

  if (description.length < 10 || description.length > 10000) {
    throw new Error("Description must be between 10 and 10,000 characters.");
  }

  const { data, error } = await supabase.rpc("update_owned_club_profile", {
    p_club_id: clubId,
    p_name: name,
    p_description: description,
    p_contact_email: contactEmail,
    p_leader_contact_information: leaderContactInformation,
    p_short_description: shortDescription,
  });

  if (error) {
    logServiceError("updateOwnedClubProfile", error);
    throw new Error(
      mapClubMutationError(error, "Could not save club details."),
    );
  }

  return withResolvedLogo(data);
}

/** Soft-archive via owner RPC. Clubs can never be permanently deleted. */
export async function archiveClub(clubId) {
  await archiveOwnedClub(clubId);
  return getClubById(clubId);
}

/**
 * Owner archive via secure RPC.
 * NEW_APPLICATION clubs become terminal (deleted_at); historical clubs soft-archive.
 */
export async function archiveOwnedClub(clubId) {
  const { data, error } = await supabase.rpc("archive_owned_club", {
    p_club_id: clubId,
  });

  if (error) {
    logServiceError("archiveOwnedClub", error);
    throw new Error(
      mapClubMutationError(error, "Could not archive this club."),
    );
  }

  return data;
}

export async function listArchivedClubs(search = "") {
  const { data, error } = await supabase.rpc("list_archived_clubs", {
    p_search: search.trim() || null,
  });

  if (error) {
    logServiceError("listArchivedClubs", error);
    throw new Error(
      getErrorMessage(error, "Could not load archived clubs."),
    );
  }

  return data ?? [];
}
