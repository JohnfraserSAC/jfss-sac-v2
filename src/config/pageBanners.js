/**
 * Section banners for every non-home route.
 * Matched in order — first matching prefix wins.
 */
const PAGE_BANNERS = [
  {
    match: (path) => path === "/dashboard" || path.startsWith("/dashboard/"),
    ariaLabel: "Dashboard",
    eyebrow: "\u2014 Account",
    title: "Your Dashboard.",
    description:
      "Review your profile, roles, club memberships, and recent requests.",
  },
  {
    match: (path) => path.startsWith("/exec-dashboard"),
    ariaLabel: "Exec Dashboard",
    eyebrow: "\u2014 Executive",
    title: "Exec Dashboard.",
    description:
      "Review club applications, request queues, school day, and archives.",
  },
  {
    match: (path) => path.startsWith("/clubs"),
    ariaLabel: "Clubs",
    eyebrow: "\u2014 Club Dashboard",
    title: "Your Clubs Hub.",
    description:
      "Explore, manage, post announcements, and apply for clubs all in one space.",
  },
  {
    match: (path) =>
      path === "/announcements" || path.startsWith("/announcements/"),
    ariaLabel: "Announcements",
    eyebrow: "\u2014 News",
    title: "Announcements.",
    description:
      "Published updates from SAC, faculty advisors, and approved clubs.",
  },
  {
    match: (path) =>
      path === "/my-requests" || path.startsWith("/my-requests/"),
    ariaLabel: "My requests",
    eyebrow: "\u2014 Clubs",
    title: "My Requests.",
    description:
      "Track every request you can submit with your roles — club apps, re-apps, announcements, and more.",
  },
  {
    match: (path) =>
      path === "/my-announcements" || path.startsWith("/my-announcements/"),
    ariaLabel: "My announcements",
    eyebrow: "\u2014 News",
    title: "My Announcements.",
    description: "Draft, track, and manage announcements you have submitted.",
  },
  {
    match: (path) => path === "/schedule" || path.startsWith("/schedule/"),
    ariaLabel: "Schedule",
    eyebrow: "\u2014 Coming soon",
    title: "Schedule.",
    description:
      "School and SAC schedule information will appear here in a future update.",
  },
  {
    match: (path) => path === "/sports" || path.startsWith("/sports/"),
    ariaLabel: "Sports",
    eyebrow: "\u2014 Coming soon",
    title: "Sports.",
    description:
      "Sports schedules, scores, and updates will appear here in a future update.",
  },
  {
    match: (path) =>
      path === "/student-resources" || path.startsWith("/student-resources/"),
    ariaLabel: "Student Resources",
    eyebrow: "\u2014 Coming soon",
    title: "Student Resources.",
    description:
      "Helpful links and student resources will appear here in a future update.",
  },
  {
    match: (path) => path === "/our-team" || path.startsWith("/our-team/"),
    ariaLabel: "Our Team",
    eyebrow: "\u2014 2026\u20132027",
    title: "Our Team.",
    description:
      "Meet the SAC Executive Team and Honouraries leading clubs and events this year.",
  },
];

const FALLBACK_BANNER = {
  ariaLabel: "Page not found",
  eyebrow: "\u2014 Error",
  title: "Page not found.",
  description: "That page does not exist or may have moved.",
};

/**
 * @param {string} pathname
 * @returns {null | { ariaLabel: string, eyebrow: string, title: string, description: string }}
 */
export function resolvePageBanner(pathname) {
  const path = pathname || "/";
  if (path === "/" || path === "") return null;

  const match = PAGE_BANNERS.find((entry) => entry.match(path));
  if (!match) return FALLBACK_BANNER;

  return {
    ariaLabel: match.ariaLabel,
    eyebrow: match.eyebrow,
    title: match.title,
    description: match.description,
  };
}
