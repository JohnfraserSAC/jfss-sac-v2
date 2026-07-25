import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BASE_SECTIONS = [
  { to: "/exec-dashboard/announcements", label: "Announcement Review" },
  { to: "/exec-dashboard/clubs", label: "New Club Applications" },
];

const CLUB_STATE_SECTIONS = [
  { to: "/exec-dashboard/inactive-clubs", label: "Inactive Clubs" },
  { to: "/exec-dashboard/pending-clubs", label: "Pending Clubs" },
  { to: "/exec-dashboard/active-clubs", label: "Active Clubs" },
  { to: "/exec-dashboard/reapplications", label: "Re-Application Review" },
];

const SAC_ADMIN_ONLY_SECTIONS = [
  { to: "/exec-dashboard/events", label: "Event Approvals" },
  { to: "/exec-dashboard/funding", label: "Club Funding Requests" },
];

export function ExecDashboardLayout() {
  const { canMutateReviews, isSacExec, isSacAdmin } = useAuth();
  const sections = [
    ...BASE_SECTIONS,
    ...((isSacAdmin || isSacExec) ? CLUB_STATE_SECTIONS : []),
    ...(isSacAdmin ? SAC_ADMIN_ONLY_SECTIONS : []),
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Executive</p>
          <h1>Exec Dashboard</h1>
          <p className="lede">
            Review announcements, club applications, annual club state, and
            re-applications.
          </p>
        </div>
        {!canMutateReviews ? (
          <span className="badge badge--role badge--role-sac-exec">
            Read only
          </span>
        ) : null}
      </header>

      {isSacExec && !canMutateReviews ? (
        <div className="alert alert--warning" role="status">
          <strong>Read-only access</strong>
          <p>
            As a SAC Executive you can view queues and re-application details,
            but you cannot approve, reject, or change request state. Mutation
            actions are limited to SAC administrators.
          </p>
        </div>
      ) : null}

      <nav className="subtabs" aria-label="Exec Dashboard sections">
        {sections.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            className={({ isActive }) =>
              isActive ? "subtab subtab--active" : "subtab"
            }
          >
            {section.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}

export function ExecDashboardIndexRedirect() {
  return <Navigate to="/exec-dashboard/announcements" replace />;
}
