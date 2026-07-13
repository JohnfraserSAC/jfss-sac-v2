import { supabase } from "../lib/supabase";
import { getErrorMessage, logServiceError } from "../utils/errors";

const CLUB_FIELDS = `
  id,
  name,
  slug,
  short_description,
  description,
  logo_url,
  banner_url,
  contact_email,
  meeting_location,
  meeting_schedule,
  status,
  created_by,
  approved_by,
  approved_at,
  created_at,
  updated_at
`;

function mapClubMutationError(error, fallback) {
  const message = error?.message?.toLowerCase?.() || "";

  if (
    message.includes("permission denied") ||
    message.includes("row-level security") ||
    message.includes("rls") ||
    message.includes("42501")
  ) {
    return "You do not have permission to delete this club.";
  }

  if (
    message.includes("foreign key") ||
    message.includes("violates foreign key") ||
    message.includes("still referenced")
  ) {
    return "This club cannot be deleted because other records still depend on it.";
  }

  return getErrorMessage(error, fallback);
}

export async function getApprovedClubs() {
  const { data, error } = await supabase
    .from("clubs")
    .select(CLUB_FIELDS)
    .eq("status", "APPROVED")
    .order("name", { ascending: true });

  if (error) {
    logServiceError("getApprovedClubs", error);
    throw new Error(getErrorMessage(error, "Could not load approved clubs."));
  }

  return data ?? [];
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

  return data;
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

  return data;
}

export async function archiveClub(clubId) {
  const { data, error } = await supabase
    .from("clubs")
    .update({ status: "ARCHIVED" })
    .eq("id", clubId)
    .select(CLUB_FIELDS)
    .maybeSingle();

  if (error) {
    logServiceError("archiveClub", error);
    throw new Error(
      mapClubMutationError(error, "Could not archive this club."),
    );
  }

  if (!data) {
    throw new Error("This club has already been removed.");
  }

  return data;
}

export async function restoreClub(clubId) {
  const { data, error } = await supabase
    .from("clubs")
    .update({ status: "APPROVED" })
    .eq("id", clubId)
    .select(CLUB_FIELDS)
    .maybeSingle();

  if (error) {
    logServiceError("restoreClub", error);
    throw new Error(
      mapClubMutationError(error, "Could not restore this club."),
    );
  }

  if (!data) {
    throw new Error("This club has already been removed.");
  }

  return data;
}

export async function permanentlyDeleteClub(clubId) {
  const { data, error } = await supabase
    .from("clubs")
    .delete()
    .eq("id", clubId)
    .select("id");

  if (error) {
    logServiceError("permanentlyDeleteClub", error);
    throw new Error(
      mapClubMutationError(error, "Could not permanently delete this club."),
    );
  }

  if (!data || data.length === 0) {
    throw new Error("This club has already been removed.");
  }
}
