import React from "react";
import { Menu, Bell, Search, CircleHelp, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { getStoredRole } from "../constants/roles";

function Topbar({ onMenuClick }) {
  const location = useLocation();

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const role = getStoredRole();

  const pageNames = {
    "/admin": "Admin Dashboard",
    "/admin/users": "User Management",
    "/dashboard": "Dashboard",
    "/tournaments": "Tournaments",
    "/teams": "Teams",
    "/players": "Players",
    "/matches": "Matches",
    "/scoreboard": "Live Scoreboard",
  };

  const currentPage =
    pageNames[location.pathname] || pageNames["/dashboard"] || "Command Center";

  return (
    <header className="topbar">
      {/* ================= LEFT ================= */}

      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-breadcrumb">
          <span>Command Center</span>

          <ChevronRight size={15} />

          <strong>{currentPage}</strong>
        </div>
      </div>

      {/* ================= CENTER ================= */}

      <div className="topbar-search">
        <Search size={18} />

        <input
          type="text"
          placeholder="Search tournaments, teams, players..."
        />

        <span className="search-shortcut">CTRL K</span>
      </div>

      {/* ================= RIGHT ================= */}

      <div className="topbar-right">
        {/* Live Status */}

        <div className="topbar-live">
          <span className="live-dot"></span>
          LIVE
        </div>

        {/* Help */}

        <button className="topbar-icon-btn" title="Help">
          <CircleHelp size={19} />
        </button>

        {/* Notification */}

        <button
          className="topbar-icon-btn notification-btn"
          title="Notifications"
        >
          <Bell size={19} />

          <span className="notification-badge">3</span>
        </button>

        {/* Divider */}

        <div className="topbar-divider"></div>

        {/* User */}

        <div className="topbar-user">
          <div className="topbar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="topbar-user-info">
            <strong>{user?.name || "User"}</strong>

            <span>{role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
