import { isClubOwner } from "./clubPermissions";

/**
 * Subtabs for My Requests — only kinds the user can submit with their roles.
 * Club applications / re-applications are available to every signed-in user.
 */
export function buildMyRequestTabs({
  canCreateAnnouncements = false,
  memberships = [],
} = {}) {
  const activeMemberships = (memberships || []).filter(
    (membership) => membership.status === "ACTIVE" && membership.clubs,
  );
  const canSubmitSupervisor = activeMemberships.some((membership) =>
    isClubOwner(membership.role),
  );
  const canSubmitFunding = activeMemberships.some((membership) =>
    isClubOwner(membership.role),
  );
  const canSubmitEvents = activeMemberships.some((membership) =>
    isClubOwner(membership.role),
  );

  return [
    {
      id: "applications",
      to: "/my-requests/applications",
      label: "New Club Applications",
    },
    {
      id: "reapplications",
      to: "/my-requests/reapplications",
      label: "Club Re-Applications",
    },
    ...(canCreateAnnouncements
      ? [
          {
            id: "announcements",
            to: "/my-requests/announcements",
            label: "Announcements",
          },
        ]
      : []),
    ...(canSubmitSupervisor
      ? [
          {
            id: "supervisor",
            to: "/my-requests/supervisor",
            label: "Supervisor Requests",
          },
        ]
      : []),
    ...(canSubmitFunding
      ? [
          {
            id: "funding",
            to: "/my-requests/funding",
            label: "Club Funding",
          },
        ]
      : []),
    ...(canSubmitEvents
      ? [
          {
            id: "events",
            to: "/my-requests/events",
            label: "Event Proposals",
          },
        ]
      : []),
  ];
}
