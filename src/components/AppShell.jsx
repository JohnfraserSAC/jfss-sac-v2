import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { displayName } from "../utils/format";
import { RoleBadge } from "./RoleBadge";

const publicLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/clubs", label: "Clubs" },
];

const signedInLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/clubs", label: "Clubs" },
  { to: "/register-club", label: "Register Club" },
  { to: "/my-requests", label: "My Requests" },
  { to: "/my-clubs", label: "My Clubs" },
];

export function AppShell() {
  const {
    user,
    profile,
    isAuthenticated,
    isAdmin,
    systemRoles,
    signOut,
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = isAuthenticated ? signedInLinks : publicLinks;
  const name = displayName(profile, user);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink to="/" className="brand" onClick={() => setMenuOpen(false)}>
            <span className="brand__eyebrow">John Fraser SS</span>
            <span className="brand__name">John Fraser SAC</span>
          </NavLink>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>

          <nav
            id="main-navigation"
            className={`main-nav${menuOpen ? " main-nav--open" : ""}`}
            aria-label="Main"
          >
            <ul>
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      isActive ? "nav-link nav-link--active" : "nav-link"
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}

              {isAdmin ? (
                <li>
                  <NavLink
                    to="/admin/club-requests"
                    className={({ isActive }) =>
                      isActive ? "nav-link nav-link--active" : "nav-link"
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    Club Request Queue
                  </NavLink>
                </li>
              ) : null}
            </ul>

            <div className="header-actions">
              {isAuthenticated ? (
                <>
                  <div className="user-chip">
                    <div>
                      <strong>{name}</strong>
                      <span>{user?.email}</span>
                    </div>
                    <div className="user-chip__roles">
                      {systemRoles.length > 0 ? (
                        systemRoles.map((role) => (
                          <RoleBadge key={role.code} role={role.code} />
                        ))
                      ) : (
                        <span className="muted">No system roles</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="button button--primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </NavLink>
              )}
            </div>
          </nav>
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
