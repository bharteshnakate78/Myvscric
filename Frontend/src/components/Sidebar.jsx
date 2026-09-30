import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Users,
  UserRound,
  Swords,
  Radio,
  ShieldCheck,
  LogOut,
  X,
  Activity,
  ChevronRight,
} from "lucide-react";
import { ROLES, getStoredRole } from "../constants/roles";

function Sidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const role = getStoredRole();

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.SCORER, ROLES.USER],
    },
    {
      label: "Tournaments",
      path: "/tournaments",
      icon: Trophy,
      roles: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.USER],
    },
    {
      label: "Teams",
      path: "/teams",
      icon: Users,
      roles: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.USER],
    },
    {
      label: "Players",
      path: "/players",
      icon: UserRound,
      roles: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.USER],
    },
    {
      label: "Matches",
      path: "/matches",
      icon: Swords,
      roles: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.SCORER, ROLES.USER],
    },
    {
      label: "Scoreboard",
      path: "/scoreboard",
      icon: Radio,
      roles: [ROLES.ADMIN, ROLES.ORGANIZER, ROLES.SCORER, ROLES.USER],
    },
    {
      label: "Users",
      path: "/users",
      icon: ShieldCheck,
      roles: [ROLES.ADMIN],
    },
  ];

  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setMobileOpen?.(false);

    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        {/* ================= LOGO ================= */}

        <div className="sidebar-logo">
          <div className="logo-mark">
            <Trophy size={22} strokeWidth={2.5} />
          </div>

          <div className="logo-text">
            <strong>CRICKET</strong>
            <span>COMMAND CENTER</span>
          </div>

          <button
            className="sidebar-close"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* ================= LIVE STATUS ================= */}

        <div className="sidebar-live">
          <span className="live-dot"></span>

          <div>
            <strong>System Live</strong>
            <small>All services operational</small>
          </div>

          <Activity size={16} />
        </div>

        {/* ================= NAVIGATION ================= */}

        <div className="sidebar-section-title">MAIN MENU</div>

        <nav className="sidebar-nav">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen?.(false)}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} strokeWidth={2} />

                <span>{item.label}</span>

                <ChevronRight className="sidebar-arrow" size={15} />
              </NavLink>
            );
          })}
        </nav>

        {/* ================= BOTTOM ================= */}

        <div className="sidebar-bottom">
          {/* User Profile */}

          <div className="sidebar-profile">
            <div className="profile-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="profile-info">
              <strong>{user?.name || "User"}</strong>

              <span>{role}</span>
            </div>
          </div>

          {/* Logout */}

          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} />

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
