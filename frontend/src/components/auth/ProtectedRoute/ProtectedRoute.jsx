import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Chặn route yêu cầu đăng nhập.
 */
function ProtectedRoute({ user, children, redirectTo = "/account" }) {
  const location = useLocation();

  if (!user) {
    return (
      <Navigate to={redirectTo} replace state={{ from: location.pathname }} />
    );
  }

  return children;
}

export default ProtectedRoute;
