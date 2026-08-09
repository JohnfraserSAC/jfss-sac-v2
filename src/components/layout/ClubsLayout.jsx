import { Outlet, useLocation } from "react-router-dom";
import { SiteBanner } from "../banners/SiteBanner";
import { ClubsSubnav } from "../clubs/ClubsSubnav";

function shouldShowClubsSubnav(pathname) {
  if (pathname === "/clubs" || pathname === "/clubs/") return true;
  if (pathname.startsWith("/clubs/my-clubs")) return true;
  if (pathname.startsWith("/clubs/apply")) return true;
  if (pathname.startsWith("/clubs/reapply")) return true;
  if (pathname.startsWith("/clubs/register")) return true;
  return false;
}

/**
 * Shared Clubs section shell — banner + hub subnav mount once and persist
 * across Explore / My Clubs / Apply / Re-Apply so underline transitions run.
 */
export function ClubsLayout() {
  const { pathname } = useLocation();
  const showSubnav = shouldShowClubsSubnav(pathname);

  return (
    <div className="page clubs-page">
      <SiteBanner
        variant="clubs"
        ariaLabel="Clubs"
        eyebrow={"\u2014 Club Dashboard"}
        title="Your Clubs Hub."
        description="Explore, manage, post announcements, and apply for clubs all in one space."
      />
      {showSubnav ? <ClubsSubnav /> : null}
      <div className="clubs-page__content">
        <Outlet />
      </div>
    </div>
  );
}
