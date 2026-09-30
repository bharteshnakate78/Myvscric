export const canManageScores = (role = null) => {
  const currentRole = role
    ? normalizeRole(role)
    : getStoredRole();

  return (
    currentRole === ROLES.ADMIN ||
    currentRole === ROLES.ORGANIZER ||
    currentRole === ROLES.SCORER
  );
};
// ============================================================
// ROLES
// ============================================================

export const ROLES = {
  ADMIN: "ADMIN",
  ORGANIZER: "ORGANIZER",
  SCORER: "SCORER",
  USER: "USER",
};

// ============================================================
// ROLE OPTIONS
// ============================================================

export const ROLE_OPTIONS = [
  {
    value: ROLES.ADMIN,
    label: "Administrator",
  },
  {
    value: ROLES.ORGANIZER,
    label: "Organizer",
  },
  {
    value: ROLES.SCORER,
    label: "Scorer",
  },
  {
    value: ROLES.USER,
    label: "User",
  },
];

// ============================================================
// NORMALIZE ROLE
// ============================================================

export const normalizeRole = (role) => {
  if (!role) {
    return ROLES.USER;
  }

  const normalized = String(role)
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");

  if (Object.values(ROLES).includes(normalized)) {
    return normalized;
  }

  return ROLES.USER;
};

// ============================================================
// ROLE LABEL
//
// ADMIN      -> Administrator
// ORGANIZER  -> Organizer
// SCORER     -> Scorer
// USER       -> User
// ============================================================

export const roleLabel = (role) => {
  const normalizedRole = normalizeRole(role);

  const labels = {
    [ROLES.ADMIN]: "Administrator",
    [ROLES.ORGANIZER]: "Organizer",
    [ROLES.SCORER]: "Scorer",
    [ROLES.USER]: "User",
  };

  return labels[normalizedRole] || "User";
};

// ============================================================
// GET STORED USER
// ============================================================

export const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "Unable to read stored user:",
      error
    );

    return null;
  }
};

// ============================================================
// GET STORED ROLE
// ============================================================

export const getStoredRole = () => {
  const user = getStoredUser();

  return normalizeRole(user?.role);
};

// ============================================================
// BASIC ROLE CHECKS
// ============================================================

export const isAdmin = () => {
  return getStoredRole() === ROLES.ADMIN;
};

export const isOrganizer = () => {
  return getStoredRole() === ROLES.ORGANIZER;
};

export const isScorer = () => {
  return getStoredRole() === ROLES.SCORER;
};

export const isUser = () => {
  return getStoredRole() === ROLES.USER;
};

// ============================================================
// CRICKET MANAGEMENT
//
// ADMIN      -> YES
// ORGANIZER  -> YES
// SCORER     -> YES
// USER       -> NO
// ============================================================

export const canManageCricket = (role = null) => {
  const currentRole = role
    ? normalizeRole(role)
    : getStoredRole();

  return (
    currentRole === ROLES.ADMIN ||
    currentRole === ROLES.ORGANIZER ||
    currentRole === ROLES.SCORER
  );
};

// ============================================================
// USER MANAGEMENT
//
// Only ADMIN
// ============================================================

export const canManageUsers = (role = null) => {
  const currentRole = role
    ? normalizeRole(role)
    : getStoredRole();

  return currentRole === ROLES.ADMIN;
};

// ============================================================
// TOURNAMENT MANAGEMENT
// ============================================================

export const canManageTournaments = (role = null) => {
  const currentRole = role
    ? normalizeRole(role)
    : getStoredRole();

  return (
    currentRole === ROLES.ADMIN ||
    currentRole === ROLES.ORGANIZER ||
    currentRole === ROLES.SCORER
  );
};

// ============================================================
// TEAM MANAGEMENT
// ============================================================

export const canManageTeams = (role = null) => {
  const currentRole = role
    ? normalizeRole(role)
    : getStoredRole();

  return (
    currentRole === ROLES.ADMIN ||
    currentRole === ROLES.ORGANIZER ||
    currentRole === ROLES.SCORER
  );
};

// ============================================================
// PLAYER MANAGEMENT
// ============================================================

export const canManagePlayers = (role = null) => {
  const currentRole = role
    ? normalizeRole(role)
    : getStoredRole();

  return (
    currentRole === ROLES.ADMIN ||
    currentRole === ROLES.ORGANIZER ||
    currentRole === ROLES.SCORER
  );
};

// ============================================================
// MATCH MANAGEMENT
// ============================================================

export const canManageMatches = (role = null) => {
  const currentRole = role
    ? normalizeRole(role)
    : getStoredRole();

  return (
    currentRole === ROLES.ADMIN ||
    currentRole === ROLES.ORGANIZER ||
    currentRole === ROLES.SCORER
  );
};

// ============================================================
// SCORING
// ============================================================

export const canScore = (role = null) => {
  const currentRole = role
    ? normalizeRole(role)
    : getStoredRole();

  return (
    currentRole === ROLES.ADMIN ||
    currentRole === ROLES.ORGANIZER ||
    currentRole === ROLES.SCORER
  );
};

// ============================================================
// VIEW PERMISSIONS
// ============================================================

export const canViewDashboard = () => {
  return Boolean(getStoredUser());
};

export const canViewScoreboard = () => {
  return Boolean(getStoredUser());
};

// ============================================================
// GENERIC ROLE CHECK
// ============================================================

export const hasRole = (role) => {
  return getStoredRole() === normalizeRole(role);
};

// ============================================================
// MULTIPLE ROLE CHECK
// ============================================================

export const hasAnyRole = (roles = []) => {
  const currentRole = getStoredRole();

  return roles
    .map((role) => normalizeRole(role))
    .includes(currentRole);
};




// export const ROLES = {
//   ADMIN: "ADMIN",
//   ORGANIZER: "ORGANIZER",
//   SCORER: "SCORER",
//   USER: "USER",
// };

// export const ROLE_OPTIONS = [
//   {
//     value: ROLES.ADMIN,
//     label: "Administrator",
//   },
//   {
//     value: ROLES.ORGANIZER,
//     label: "Organizer",
//   },
//   {
//     value: ROLES.SCORER,
//     label: "Scorer",
//   },
//   {
//     value: ROLES.USER,
//     label: "User",
//   },
// ];

// /*
//  * Normalize role values coming from:
//  *
//  * ADMIN
//  * admin
//  * ROLE_ADMIN
//  * role_admin
//  *
//  * into:
//  *
//  * ADMIN
//  */
// export const normalizeRole = (role) => {
//   if (!role) {
//     return ROLES.USER;
//   }

//   const normalized = String(role)
//     .trim()
//     .toUpperCase()
//     .replace(/^ROLE_/, "");

//   if (Object.values(ROLES).includes(normalized)) {
//     return normalized;
//   }

//   return ROLES.USER;
// };

// /*
//  * Get the currently logged-in user's role
//  * from localStorage.
//  */
// export const getStoredRole = () => {
//   try {
//     const storedUser = localStorage.getItem("user");

//     if (!storedUser) {
//       return ROLES.USER;
//     }

//     const user = JSON.parse(storedUser);

//     return normalizeRole(user?.role);
//   } catch (error) {
//     console.error(
//       "Unable to read stored user role:",
//       error
//     );

//     return ROLES.USER;
//   }
// };

// /*
//  * Get the complete stored user.
//  */
// export const getStoredUser = () => {
//   try {
//     const storedUser = localStorage.getItem("user");

//     if (!storedUser) {
//       return null;
//     }

//     return JSON.parse(storedUser);
//   } catch (error) {
//     console.error(
//       "Unable to read stored user:",
//       error
//     );

//     return null;
//   }
// };

// /*
//  * Role helper functions.
//  */
// export const isAdmin = () => {
//   return getStoredRole() === ROLES.ADMIN;
// };

// export const isOrganizer = () => {
//   return getStoredRole() === ROLES.ORGANIZER;
// };

// export const isScorer = () => {
//   return getStoredRole() === ROLES.SCORER;
// };

// export const isUser = () => {
//   return getStoredRole() === ROLES.USER;
// };
