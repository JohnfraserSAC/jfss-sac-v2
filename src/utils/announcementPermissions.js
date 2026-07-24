export const ANNOUNCEMENT_STATUS_LABELS = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

export function canPublishDirectly({
  isSacAdmin = false,
  isFacultyAdvisor = false,
}) {
  return isSacAdmin || isFacultyAdvisor;
}

export function canReviewAnnouncements({
  isSacAdmin = false,
  isFacultyAdvisor = false,
  isSacExec = false,
}) {
  return isSacAdmin || isFacultyAdvisor || isSacExec;
}

export function canMutateAnnouncementReviews({
  isSacAdmin = false,
  isFacultyAdvisor = false,
}) {
  return isSacAdmin || isFacultyAdvisor;
}

export function canCreateAnnouncement({
  isSacAdmin = false,
  isFacultyAdvisor = false,
  ownedClubs = [],
}) {
  return (
    canPublishDirectly({ isSacAdmin, isFacultyAdvisor }) ||
    (ownedClubs?.length ?? 0) > 0
  );
}

export function isClubOwnerFor(ownedClubs, clubId) {
  return (ownedClubs || []).some((club) => club.id === clubId);
}

export function canEditAnnouncement({
  announcement,
  userId,
  isSacAdmin = false,
  isFacultyAdvisor = false,
  ownedClubs = [],
}) {
  if (!announcement || !userId) return false;

  if (isSacAdmin) {
    return announcement.status !== "ARCHIVED";
  }

  if (
    isFacultyAdvisor &&
    announcement.created_by === userId &&
    ["DRAFT", "PUBLISHED"].includes(announcement.status)
  ) {
    return true;
  }

  if (
    announcement.created_by === userId &&
    announcement.club_id &&
    isClubOwnerFor(ownedClubs, announcement.club_id) &&
    ["DRAFT", "CHANGES_REQUESTED"].includes(announcement.status)
  ) {
    return true;
  }

  return false;
}

export function canArchiveAnnouncement({
  announcement,
  userId,
  isSacAdmin = false,
  isFacultyAdvisor = false,
}) {
  if (!announcement || announcement.status !== "PUBLISHED") return false;
  if (isSacAdmin) return true;
  return isFacultyAdvisor && announcement.created_by === userId;
}

export function getAllowedCreateActions({
  isSacAdmin = false,
  isFacultyAdvisor = false,
}) {
  if (canPublishDirectly({ isSacAdmin, isFacultyAdvisor })) {
    return ["DRAFT", "PUBLISH"];
  }
  return ["DRAFT", "SUBMIT"];
}

export function getAllowedEditActions({
  announcement,
  userId,
  isSacAdmin = false,
  isFacultyAdvisor = false,
  ownedClubs = [],
}) {
  if (
    !canEditAnnouncement({
      announcement,
      userId,
      isSacAdmin,
      isFacultyAdvisor,
      ownedClubs,
    })
  ) {
    return [];
  }

  if (isSacAdmin) {
    if (announcement.status === "PUBLISHED") return ["SAVE"];
    return ["SAVE", "PUBLISH"];
  }

  if (isFacultyAdvisor && announcement.created_by === userId) {
    if (announcement.status === "DRAFT") return ["SAVE", "PUBLISH"];
    if (announcement.status === "PUBLISHED") return ["SAVE"];
    return [];
  }

  if (
    announcement.created_by === userId &&
    ["DRAFT", "CHANGES_REQUESTED"].includes(announcement.status)
  ) {
    return ["SAVE", "SUBMIT"];
  }

  return [];
}

export function validateAnnouncementForm(values, { requireClub = false } = {}) {
  const errors = {};
  const title = String(values.title ?? "").trim();
  const summaryRaw = String(values.summary ?? "").trim();
  const body = String(values.body ?? "").trim();
  const imageUrlRaw = String(values.imageUrl ?? "").trim();
  const clubId = values.clubId || null;
  const expiresAtRaw = String(values.expiresAt ?? "").trim();

  if (title.length < 3 || title.length > 160) {
    errors.title = "Title must be between 3 and 160 characters.";
  }

  if (summaryRaw && summaryRaw.length > 500) {
    errors.summary = "Summary must be at most 500 characters.";
  }

  if (body.length < 10 || body.length > 30000) {
    errors.body = "Body must be between 10 and 30,000 characters.";
  }

  if (imageUrlRaw) {
    try {
      const url = new URL(imageUrlRaw);
      if (!["http:", "https:"].includes(url.protocol)) {
        errors.imageUrl = "Enter a valid image URL.";
      }
    } catch {
      errors.imageUrl = "Enter a valid image URL.";
    }
  }

  if (requireClub && !clubId) {
    errors.clubId = "Select a club for this announcement.";
  }

  let expiresAt = null;
  if (expiresAtRaw) {
    const parsed = new Date(expiresAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      errors.expiresAt = "Enter a valid expiry date and time.";
    } else if (parsed.getTime() <= Date.now()) {
      errors.expiresAt = "Expiry must be in the future.";
    } else {
      expiresAt = parsed.toISOString();
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      title,
      summary: summaryRaw || null,
      body,
      imageUrl: imageUrlRaw || null,
      clubId,
      expiresAt,
    },
  };
}

export function announcementExcerpt(announcement, maxLength = 160) {
  const source =
    announcement?.summary?.trim() ||
    announcement?.body?.trim() ||
    "";
  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength - 1).trimEnd()}…`;
}

export function toDateTimeLocalValue(isoValue) {
  if (!isoValue) return "";
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
