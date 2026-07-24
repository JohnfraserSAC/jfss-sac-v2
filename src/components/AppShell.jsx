import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { displayName } from "../utils/format";

const rightLinks = [
  { to: "/clubs", label: "Clubs" },
  { to: "/schedule", label: "Schedule" },
  { to: "/events", label: "Events" },
  { to: "/student-resources", label: "Student Resources" },
];

export function AppShell() {
  const {
    user,
    profile,
    isAuthenticated,
    canAccessExecDashboard,
    signOut,
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const name = displayName(profile, user);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "brand brand--active" : "brand"
            }
            onClick={() => setMenuOpen(false)}
          >
            Home
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
            <ul className="main-nav__links">
              <li className="main-nav__home-mobile">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    isActive ? "nav-link nav-link--active" : "nav-link"
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  Home
                </NavLink>
              </li>

              {rightLinks.map((link) => (
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
                <>
                  <li>
                    <NavLink
                      to="/dashboard"
                      className={({ isActive }) =>
                        isActive
                          ? "nav-link nav-link--active nav-link--profile"
                          : "nav-link nav-link--profile"
                      }
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </NavLink>
                  </li>
                  <li className="main-nav__account-mobile">
                    <span className="nav-account-label">
                      {name}
                      {user?.email ? ` · ${user.email}` : ""}
                    </span>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="nav-link nav-link--button"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      isActive
                        ? "nav-link nav-link--active nav-link--profile"
                        : "nav-link nav-link--profile"
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </NavLink>
                </li>
              )}
            </ul>
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
