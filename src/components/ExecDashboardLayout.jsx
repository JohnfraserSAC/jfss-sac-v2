import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PRIMARY_TABS = [
  {
    id: "applications",
    to: "/exec-dashboard/applications/new",
    label: "Applications",
    matchPrefix: "/exec-dashboard/applications",
    visible: ({ isSacAdmin, isSacExec, isFacultyAdvisor }) =>
      isSacAdmin || isSacExec || isFacultyAdvisor,
  },
  {
    id: "requests",
    to: "/exec-dashboard/requests/announcements",
    label: "Requests",
    matchPrefix: "/exec-dashboard/requests",
    visible: ({ isSacAdmin, isSacExec, isFacultyAdvisor }) =>
      isSacAdmin || isSacExec || isFacultyAdvisor,
  },
  {
    id: "archived",
    to: "/exec-dashboard/archived",
    label: "Archived",
    matchPrefix: "/exec-dashboard/archived",
    visible: ({ isSacAdmin, isSacExec }) => isSacAdmin || isSacExec,
  },
];

function isPathActive(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function ExecDashboardLayout() {
  const { canMutateReviews, isSacExec, isSacAdmin, isFacultyAdvisor } =
    useAuth();
  const { pathname } = useLocation();

  const roleFlags = { isSacAdmin, isSacExec, isFacultyAdvisor };
  const primaryTabs = PRIMARY_TABS.filter((tab) => tab.visible(roleFlags));

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Executive</p>
          <h1>Exec Dashboard</h1>
          <p className="lede">
            Review club applications, request queues, and archived clubs.
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
        {primaryTabs.map((tab) => {
          const active = isPathActive(pathname, tab.matchPrefix);
          return (
            <NavLink
              key={tab.id}
              to={tab.to}
              className={active ? "subtab subtab--active" : "subtab"}
            >
              {tab.label}
            </NavLink>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}

export function ExecApplicationsLayout() {
  const { isSacAdmin, isSacExec, isFacultyAdvisor } = useAuth();
  const canViewApps = isSacAdmin || isSacExec || isFacultyAdvisor;
  const canViewReapps = isSacAdmin || isSacExec;

  if (!canViewApps) {
    return <Navigate to="/exec-dashboard/requests/announcements" replace />;
  }

  const subtabs = [
    { to: "/exec-dashboard/applications/new", label: "New Club Applications" },
    ...(canViewReapps
      ? [
          {
            to: "/exec-dashboard/applications/reapplications",
            label: "Reapplications",
          },
        ]
      : []),
  ];

  return (
    <div className="exec-section">
      <nav className="subtabs subtabs--nested" aria-label="Applications">
        {subtabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              isActive ? "subtab subtab--active" : "subtab"
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

export function ExecRequestsLayout() {
  const { isSacAdmin, isSacExec, isFacultyAdvisor } = useAuth();
  const canView = isSacAdmin || isSacExec || isFacultyAdvisor;

  if (!canView) {
    return <Navigate to="/" replace />;
  }

  const subtabs = [
    ...(isSacAdmin
      ? [
          {
            to: "/exec-dashboard/requests/funding",
            label: "Club Funding",
          },
        ]
      : []),
    {
      to: "/exec-dashboard/requests/announcements",
      label: "Announcements",
    },
    ...(isSacAdmin || isSacExec
      ? [
          {
            to: "/exec-dashboard/requests/supervisor",
            label: "Supervisor Requests",
          },
        ]
      : []),
  ];

  return (
    <div className="exec-section">
      <nav className="subtabs subtabs--nested" aria-label="Requests">
        {subtabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              isActive ? "subtab subtab--active" : "subtab"
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

export function ExecDashboardIndexRedirect() {
  const { isSacAdmin, isSacExec, isFacultyAdvisor } = useAuth();
  if (isSacAdmin || isSacExec) {
    return <Navigate to="/exec-dashboard/applications/new" replace />;
  }
  if (isFacultyAdvisor) {
    return <Navigate to="/exec-dashboard/requests/announcements" replace />;
  }
  return <Navigate to="/" replace />;
}

export function ExecApplicationsIndexRedirect() {
  return <Navigate to="/exec-dashboard/applications/new" replace />;
}

export function ExecRequestsIndexRedirect() {
  const { isSacAdmin } = useAuth();
  if (isSacAdmin) {
    return <Navigate to="/exec-dashboard/requests/funding" replace />;
  }
  return <Navigate to="/exec-dashboard/requests/announcements" replace />;
}
