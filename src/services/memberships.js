import { supabase } from "../lib/supabase";
import { getErrorMessage, logServiceError } from "../utils/errors";
import { sortClubMemberships } from "../utils/clubPermissions";

const MEMBERSHIP_FIELDS = `
  club_id,
  user_id,
  role,
  status,
  added_by,
  joined_at,
  updated_at
`;

function membershipDuplicateMessage(error) {
  const message = error?.message?.toLowerCase?.() || "";
  if (
    message.includes("duplicate key") ||
    message.includes("unique constraint") ||
    message.includes("club_memberships_pkey")
  ) {
    return "This student is already a member of this club.";
  }
  return null;
}

function mapMembershipRows(rows) {
  return sortClubMemberships(
    (rows ?? []).map((row) => ({
      club_id: row.club_id,
      user_id: row.user_id,
      role: row.role,
      status: row.status,
      added_by: row.added_by,
      joined_at: row.joined_at,
      updated_at: row.updated_at,
      profile: row.member_profile ?? null,
      added_by_profile: row.added_by_profile ?? null,
    })),
  );
}

export async function getMyClubMemberships(userId) {
  const { data, error } = await supabase
    .from("club_memberships")
    .select(
      `
      club_id,
      user_id,
      role,
      status,
      joined_at,
      updated_at,
      clubs (
        id,
        name,
        slug,
        short_description,
        logo_url,
        status,
        meeting_location,
        meeting_schedule
      )
    `,
    )
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (error) {
    logServiceError("getMyClubMemberships", error);
    throw new Error(
      getErrorMessage(error, "Could not load your club memberships."),
    );
  }

  return data ?? [];
}

export async function getMyMembershipForClub(userId, clubId) {
  const { data, error } = await supabase
    .from("club_memberships")
    .select("club_id, user_id, role, status, joined_at")
    .eq("user_id", userId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (error) {
    logServiceError("getMyMembershipForClub", error);
    throw new Error(
      getErrorMessage(error, "Could not load your membership for this club."),
    );
  }

  return data;
}

export async function getCurrentUserClubMembership(clubId, userId) {
  return getMyMembershipForClub(userId, clubId);
}

export async function getClubMemberships(clubId) {
  const { data, error } = await supabase
    .from("club_memberships")
    .select(
      `
      ${MEMBERSHIP_FIELDS},
      member_profile:profiles!user_id (
        id,
        email,
        full_name,
        is_active
      ),
      added_by_profile:profiles!added_by (
        id,
        email,
        full_name
      )
    `,
    )
    .eq("club_id", clubId);

  if (error) {
    logServiceError("getClubMemberships.withProfiles", error);

    const { data: fallbackData, error: fallbackError } = await supabase
      .from("club_memberships")
      .select(MEMBERSHIP_FIELDS)
      .eq("club_id", clubId);

    if (fallbackError) {
      logServiceError("getClubMemberships.fallback", fallbackError);
      throw new Error(
        getErrorMessage(fallbackError, "Could not load club memberships."),
      );
    }

    return {
      memberships: mapMembershipRows(fallbackData),
      profilesReadable: false,
      profilesWarning:
        "Member profiles could not be loaded. Current profiles RLS likely allows users to read only their own profile. Membership rows are shown with user UUIDs.",
    };
  }

  const memberships = mapMembershipRows(data);
  const readableCount = memberships.filter((row) => row.profile).length;
  const profilesReadable =
    memberships.length === 0 || readableCount === memberships.length;

  return {
    memberships,
    profilesReadable,
    profilesWarning: profilesReadable
      ? null
      : "Some member profiles are hidden by RLS. Users can currently read only their own profile, so other members appear as UUIDs until a safer profile-read policy or RPC is added.",
  };
}

export async function addClubMembership({ clubId, userId, role, addedBy }) {
  if (role === "OWNER") {
    throw new Error(
      "Creating another owner is not allowed through this workflow.",
    );
  }

  const { data, error } = await supabase
    .from("club_memberships")
    .insert({
      club_id: clubId,
      user_id: userId,
      role,
      status: "ACTIVE",
      added_by: addedBy,
    })
    .select(MEMBERSHIP_FIELDS)
    .single();

  if (error) {
    logServiceError("addClubMembership", error);
    throw new Error(
      membershipDuplicateMessage(error) ||
        getErrorMessage(error, "Could not add this club member."),
    );
  }

  return data;
}

export async function updateClubMembershipRole({ clubId, userId, role }) {
  if (role === "OWNER") {
    throw new Error(
      "Ownership transfer is not available through this workflow.",
    );
  }

  const { data, error } = await supabase
    .from("club_memberships")
    .update({
      role,
      status: "ACTIVE",
    })
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .select(MEMBERSHIP_FIELDS)
    .maybeSingle();

  if (error) {
    logServiceError("updateClubMembershipRole", error);
    throw new Error(
      getErrorMessage(
        error,
        "You do not have permission to change this member’s role.",
      ),
    );
  }

  if (!data) {
    throw new Error(
      "You do not have permission to change this member’s role.",
    );
  }

  return data;
}

export async function removeClubMembership({ clubId, userId }) {
  const { data, error } = await supabase
    .from("club_memberships")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .select(MEMBERSHIP_FIELDS)
    .maybeSingle();

  if (error) {
    logServiceError("removeClubMembership", error);
    throw new Error(
      getErrorMessage(error, "Could not remove this club membership."),
    );
  }

  if (!data) {
    throw new Error(
      "You do not have permission to remove this club membership.",
    );
  }

  return data;
}

export async function leaveClub({ clubId, userId }) {
  return removeClubMembership({ clubId, userId });
}

/**
 * Attempts a profile search for adding members.
 * Current migrations only allow users to read their own profile, and there is
 * no student-search RPC. This function reports that limitation clearly.
 */
export async function searchEligibleStudents(searchTerm) {
  const term = String(searchTerm ?? "").trim();

  if (term.length < 2) {
    return {
      results: [],
      searchAvailable: false,
      warning:
        "Enter at least 2 characters to search. Student profile search is currently limited by profiles RLS.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, is_active")
    .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
    .limit(20);

  if (error) {
    logServiceError("searchEligibleStudents", error);
    return {
      results: [],
      searchAvailable: false,
      warning:
        "Student profile search is blocked by the current profiles RLS policy (users may only read their own profile). No safe student-search RPC exists yet.",
    };
  }

  const results = (data ?? []).filter((profile) => profile.is_active !== false);

  // Own-profile-only RLS usually returns 0–1 rows (the signed-in user).
  if (results.length <= 1) {
    return {
      results,
      searchAvailable: false,
      warning:
        "Student profile search is not available. Current profiles RLS only allows users to read their own profile, and no student-search RPC exists yet.",
    };
  }

  return {
    results,
    searchAvailable: true,
    warning: null,
  };
}

export async function probeProfileSearchAvailability() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .limit(5);

  if (error) {
    logServiceError("probeProfileSearchAvailability", error);
    return {
      searchAvailable: false,
      warning:
        "Student profile search is blocked by the current profiles RLS policy. No safe student-search RPC exists yet.",
    };
  }

  if ((data ?? []).length <= 1) {
    return {
      searchAvailable: false,
      warning:
        "Student profile search is not available yet. Profiles RLS currently allows users to read only their own profile, and there is no student-search RPC.",
    };
  }

  return {
    searchAvailable: true,
    warning: null,
  };
}
