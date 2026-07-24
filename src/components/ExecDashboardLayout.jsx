import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const BASE_SECTIONS = [
  { to: "/exec-dashboard/announcements", label: "Announcement Review" },
  { to: "/exec-dashboard/clubs", label: "New Club Applications" },
];

const SAC_ADMIN_SECTIONS = [
  { to: "/exec-dashboard/reapplications", label: "Club Re-Applications" },
  { to: "/exec-dashboard/events", label: "Event Approvals" },
  { to: "/exec-dashboard/funding", label: "Club Funding Requests" },
];

export function ExecDashboardLayout() {
  const { canMutateReviews, isSacExec, isSacAdmin } = useAuth();
  const sections = [
    ...BASE_SECTIONS,
    ...(isSacAdmin ? SAC_ADMIN_SECTIONS : []),
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Executive</p>
          <h1>Exec Dashboard</h1>
          <p className="lede">
            Review announcements, club applications, re-applications, and event
            proposals.
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
            As a SAC Executive you can view announcement and club-application
            queues, but you cannot approve or reject them. Re-application and
            event review are limited to SAC administrators.
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
