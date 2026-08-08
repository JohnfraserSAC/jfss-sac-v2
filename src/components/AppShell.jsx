import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { displayName } from "../utils/format";

const navLinks = [
  { to: "/clubs", label: "Clubs" },
  { to: "/schedule", label: "Schedule" },
  { to: "/events", label: "Events" },
  { to: "/student-resources", label: "Student Resources" },
];

function getAvatarUrl(profile, user) {
  return (
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    ""
  );
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AppShell() {
  const { user, profile, isAuthenticated, canAccessExecDashboard } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const name = displayName(profile, user);
  const avatarUrl = getAvatarUrl(profile, user);

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <div className="site-header__slot site-header__slot--left">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "brand-logo brand-logo--active" : "brand-logo"
              }
              onClick={() => setMenuOpen(false)}
              aria-label="John Fraser SAC home"
            >
              <img
                src="/images/SAC-LOGO.png"
                alt="John Fraser SAC"
                className="brand-logo__image"
                width={800}
                height={800}
              />
            </NavLink>
          </div>

          <nav
            id="main-navigation"
            className={`main-nav${menuOpen ? " main-nav--open" : ""}`}
            aria-label="Main"
          >
            <ul className="main-nav__links">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      isActive ? "nav-link nav-link--active" : "nav-link"
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}

              {isAuthenticated && canAccessExecDashboard ? (
                <li>
                  <NavLink
                    to="/exec-dashboard"
                    className={({ isActive }) =>
                      isActive ? "nav-link nav-link--active" : "nav-link"
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    Exec Dashboard
                  </NavLink>
                </li>
              ) : null}

              {isAuthenticated ? (
                <li>
                  <NavLink
                    to="/my-requests"
                    className={({ isActive }) =>
                      isActive ? "nav-link nav-link--active" : "nav-link"
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    My Requests
                  </NavLink>
                </li>
              ) : null}
            </ul>
          </nav>

          <div className="site-header__slot site-header__slot--right">
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="main-navigation"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="menu-toggle__bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>

            {isAuthenticated ? (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "nav-avatar nav-avatar--active" : "nav-avatar"
                }
                onClick={() => setMenuOpen(false)}
                aria-label={`${name} profile`}
                title={name}
              >
                {avatarUrl && !avatarFailed ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="nav-avatar__image"
                    width={40}
                    height={40}
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <span className="nav-avatar__fallback" aria-hidden="true">
                    {getInitials(name)}
                  </span>
                )}
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive
                    ? "nav-link nav-link--active nav-link--login"
                    : "nav-link nav-link--login"
                }
                onClick={() => setMenuOpen(false)}
              >
                Login
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>John Fraser Student Activity Council portal</p>
      </footer>
    </div>
  );
}
