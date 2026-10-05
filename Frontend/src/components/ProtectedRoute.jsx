import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { normalizeRole } from "../constants/roles";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const location = useLocation();

  // ============================================================
  // GET STORED USER
  // ============================================================

  let user = null;

  try {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Failed to read stored user:", error);

    user = null;
  }

  // ============================================================
  // GET TOKEN
  // ============================================================

  const token = localStorage.getItem("token");

  // ============================================================
  // NOT AUTHENTICATED
  // ============================================================

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ============================================================
  // NORMALIZE USER ROLE
  // ============================================================

  const userRole = normalizeRole(user?.role);

  // ============================================================
  // DEBUG
  // ============================================================

  console.log("=================================");
  console.log("PROTECTED ROUTE");
  console.log("USER:", user);
  console.log("RAW ROLE:", user?.role);
  console.log("NORMALIZED ROLE:", userRole);
  console.log("ALLOWED ROLES:", allowedRoles);
  console.log("=================================");

  // ============================================================
  // ROLE AUTHORIZATION
  // ============================================================

  if (allowedRoles.length > 0) {
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      normalizeRole(role),
    );

    console.log("NORMALIZED ALLOWED ROLES:", normalizedAllowedRoles);

    const hasPermission = normalizedAllowedRoles.includes(userRole);

    console.log("HAS PERMISSION:", hasPermission);

    if (!hasPermission) {
      console.warn(`Access denied. User role: ${userRole}`);

      return (
        <Navigate
          to="/dashboard"
          replace
          state={{
            accessDenied: true,
            role: userRole,
          }}
        />
      );
    }
  }

  // ============================================================
  // AUTHORIZED
  // ============================================================

  return <Outlet />;
};

export default ProtectedRoute;

// import React from "react";
// import { Navigate, Outlet, useLocation } from "react-router-dom";

// import { normalizeRole } from "../constants/roles";

// function ProtectedRoute({ allowedRoles = [] }) {
//   const location = useLocation();

//   let user = null;

//   try {
//     const storedUser = localStorage.getItem("user");

//     if (storedUser) {
//       user = JSON.parse(storedUser);
//     }
//   } catch (error) {
//     console.error("Failed to read stored user:", error);
//     user = null;
//   }

//   const token = localStorage.getItem("token");

//   // =====================================================
//   // NOT AUTHENTICATED
//   // =====================================================

//   if (!token || !user) {
//     return <Navigate to="/login" replace state={{ from: location }} />;
//   }

//   // =====================================================
//   // NORMALIZE CURRENT USER ROLE
//   // =====================================================

//   const userRole = normalizeRole(user.role);

//   console.log("PROTECTED ROUTE USER:", user);
//   console.log("PROTECTED ROUTE ROLE:", userRole);

//   // =====================================================
//   // ROLE AUTHORIZATION
//   // =====================================================

//   if (allowedRoles.length > 0) {
//     const normalizedAllowedRoles = allowedRoles.map((role) =>
//       normalizeRole(role),
//     );

//     console.log("ALLOWED ROLES:", normalizedAllowedRoles);

//     if (!normalizedAllowedRoles.includes(userRole)) {
//       console.warn(`Access denied. User role: ${userRole}`);

//       return <Navigate to="/dashboard" replace />;
//     }
//   }

//   // =====================================================
//   // AUTHORIZED
//   // =====================================================

//   return <Outlet />;
// }

// export default ProtectedRoute;
