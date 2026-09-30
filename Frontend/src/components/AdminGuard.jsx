import React from "react";
import { Navigate } from "react-router-dom";
import { ROLES, normalizeRole } from "../constants/roles";

const AdminGuard = ({ children }) => {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  const role = normalizeRole(user?.role);

  if (role !== ROLES.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminGuard;
