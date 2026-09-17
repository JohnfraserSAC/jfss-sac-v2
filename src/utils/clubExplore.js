export const CLUB_EXPLORE_DESKTOP_PAGE_SIZE = 9;
export const CLUB_EXPLORE_MOBILE_PAGE_SIZE = 6;
export const CLUB_EXPLORE_MOBILE_QUERY = "(max-width: 1024px)";

export function getClubExplorePageSize(isMobile) {
  return isMobile
    ? CLUB_EXPLORE_MOBILE_PAGE_SIZE
    : CLUB_EXPLORE_DESKTOP_PAGE_SIZE;
}
