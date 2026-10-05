import React from "react";
import { Navigate } from "react-router-dom";
import { ROLES, normalizeRole, getStoredUser } from "../constants/roles";

const AdminGuard = ({ children }) => {
  const user = getStoredUser();

  // ============================================================
  // NOT LOGGED IN
  // ============================================================

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ============================================================
  // CHECK ADMIN ROLE
  // ============================================================

  const role = normalizeRole(user.role);

  if (role !== ROLES.ADMIN) {
    console.warn(`AdminGuard: Access denied. User role: ${role}`);

    return <Navigate to="/dashboard" replace />;
  }

  // ============================================================
  // ADMIN AUTHORIZED
  // ============================================================

  return children;
};

export default AdminGuard;

// import React from "react";
// import { Navigate } from "react-router-dom";
// import { ROLES, normalizeRole } from "../constants/roles";

// const AdminGuard = ({ children }) => {
//   let user = null;

//   try {
//     user = JSON.parse(localStorage.getItem("user"));
//   } catch {
//     user = null;
//   }

//   const role = normalizeRole(user?.role);

//   if (role !== ROLES.ADMIN) {
//     return <Navigate to="/dashboard" replace />;
//   }

//   return children;
// };

// export default AdminGuard;
