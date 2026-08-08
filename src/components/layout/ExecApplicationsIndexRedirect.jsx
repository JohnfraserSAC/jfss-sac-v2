import { Navigate } from "react-router-dom";

export function ExecApplicationsIndexRedirect() {
  return <Navigate to="/exec-dashboard/applications/new" replace />;
}
