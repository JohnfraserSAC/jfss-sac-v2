import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useLoginModal } from "../../context/LoginModalContext";

/** Legacy /login bookmarks open the popup and send users home. */
export function LoginRedirect() {
  const { openLoginModal } = useLoginModal();
  const location = useLocation();

  useEffect(() => {
    const from = location.state?.from;
    const returnTo = from
      ? `${from.pathname || "/"}${from.search || ""}${from.hash || ""}`
      : "/";
    openLoginModal(returnTo);
  }, [location.state, openLoginModal]);

  return <Navigate to="/" replace />;
}
