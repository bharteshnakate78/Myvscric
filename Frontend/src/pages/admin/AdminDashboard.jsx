import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Trophy,
  ShieldCheck,
  UserCog,
  Swords,
  UserRound,
  ArrowUpRight,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../services/api";

const getArray = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
};

const AdminDashboard = () => {
  const [user, setUser] = useState({});
  const [dashboard, setDashboard] = useState({
    users: [],
    tournaments: [],
    teams: [],
    players: [],
    matches: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    } catch {
      setUser({});
    }

    loadDashboard();
  }, []);

  const loadDashboard = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        usersResponse,
        tournamentsResponse,
        teamsResponse,
        playersResponse,
        matchesResponse,
      ] = await Promise.all([
        api.get("/admin/users"),
        api.get("/tournaments"),
        api.get("/teams"),
        api.get("/players"),
        api.get("/matches"),
      ]);

      setDashboard({
        users: getArray(usersResponse),
        tournaments: getArray(tournamentsResponse),
        teams: getArray(teamsResponse),
        players: getArray(playersResponse),
        matches: getArray(matchesResponse),
      });
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load dashboard data. Please check the backend connection.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const stats = useMemo(
    () => [
      {
        label: "Total Users",
        value: dashboard.users.length,
        icon: Users,
        className: "stat-blue",
        link: "/admin/users",
      },
      {
        label: "Tournaments",
        value: dashboard.tournaments.length,
        icon: Trophy,
        className: "stat-purple",
        link: "/tournaments",
      },
      {
        label: "Teams",
        value: dashboard.teams.length,
        icon: Users,
        className: "stat-green",
        link: "/teams",
      },
      {
        label: "Players",
        value: dashboard.players.length,
        icon: UserRound,
        className: "stat-orange",
        link: "/players",
      },
      {
        label: "Matches",
        value: dashboard.matches.length,
        icon: Swords,
        className: "stat-red",
        link: "/matches",
      },
    ],
    [dashboard],
  );

  const roleCounts = useMemo(() => {
    const counts = {};

    dashboard.users.forEach((item) => {
      const role = item?.role || item?.roles?.[0] || item?.authority || "USER";

      const normalized = String(role).replace("ROLE_", "").toUpperCase();

      counts[normalized] = (counts[normalized] || 0) + 1;
    });

    return counts;
  }, [dashboard.users]);

  const totalRoles = Object.values(roleCounts).reduce(
    (sum, value) => sum + value,
    0,
  );

  const activeUsers = dashboard.users.filter(
    (item) =>
      item?.enabled === true ||
      item?.active === true ||
      item?.status === "ACTIVE",
  ).length;

  const recentUsers = [...dashboard.users]
    .sort((a, b) => {
      const dateA = new Date(
        a?.createdAt || a?.createdDate || a?.registrationDate || 0,
      );
      const dateB = new Date(
        b?.createdAt || b?.createdDate || b?.registrationDate || 0,
      );

      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="admin-dashboard">
      {/* ================= HEADER ================= */}
      <section className="admin-hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="hero-pulse" />
            ADMIN CONTROL CENTER
          </div>

          <h1>
            Welcome back,
            <span> {user?.name || "Admin"}</span>
          </h1>

          <p>
            Manage your cricket platform, users and tournament operations from
            one place.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 size={17} className="spin" />
          ) : (
            <RefreshCw size={17} />
          )}

          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </section>

      {/* ================= ERROR ================= */}
      {error && (
        <div className="dashboard-error">
          <AlertCircle size={20} />

          <div>
            <strong>Dashboard data unavailable</strong>
            <span>{error}</span>
          </div>

          <button onClick={() => loadDashboard()}>Try Again</button>
        </div>
      )}

      {/* ================= STATS ================= */}
      <section className="dashboard-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link
              key={stat.label}
              to={stat.link}
              className={`dashboard-stat ${stat.className}`}
            >
              <div className="stat-top">
                <div className="stat-icon">
                  <Icon size={21} />
                </div>

                <ArrowUpRight size={17} className="stat-arrow" />
              </div>

              <div className="stat-number">
                {loading ? <span className="skeleton-number" /> : stat.value}
              </div>

              <div className="stat-name">{stat.label}</div>

              <div className="stat-live">
                <span />
                Live data
              </div>
            </Link>
          );
        })}
      </section>

      {/* ================= MAIN GRID ================= */}
      <section className="dashboard-main-grid">
        {/* System Overview */}
        <div className="dashboard-panel system-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">PLATFORM</span>
              <h2>System Overview</h2>
            </div>

            <div className="system-status">
              <span />
              Operational
            </div>
          </div>

          <div className="overview-list">
            <div className="overview-row">
              <div className="overview-icon blue">
                <Users size={19} />
              </div>

              <div className="overview-info">
                <strong>Total Users</strong>
                <span>Registered platform users</span>
              </div>

              <b>{loading ? "—" : dashboard.users.length}</b>
            </div>

            <div className="overview-row">
              <div className="overview-icon purple">
                <Trophy size={19} />
              </div>

              <div className="overview-info">
                <strong>Tournaments</strong>
                <span>Cricket competitions</span>
              </div>

              <b>{loading ? "—" : dashboard.tournaments.length}</b>
            </div>

            <div className="overview-row">
              <div className="overview-icon green">
                <Users size={19} />
              </div>

              <div className="overview-info">
                <strong>Teams</strong>
                <span>Registered cricket teams</span>
              </div>

              <b>{loading ? "—" : dashboard.teams.length}</b>
            </div>

            <div className="overview-row">
              <div className="overview-icon orange">
                <UserRound size={19} />
              </div>

              <div className="overview-info">
                <strong>Players</strong>
                <span>Registered players</span>
              </div>

              <b>{loading ? "—" : dashboard.players.length}</b>
            </div>

            <div className="overview-row">
              <div className="overview-icon red">
                <Swords size={19} />
              </div>

              <div className="overview-info">
                <strong>Matches</strong>
                <span>Scheduled / recorded matches</span>
              </div>

              <b>{loading ? "—" : dashboard.matches.length}</b>
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="dashboard-panel roles-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">ACCESS CONTROL</span>
              <h2>User Roles</h2>
            </div>

            <ShieldCheck size={21} />
          </div>

          {loading ? (
            <div className="role-loading">
              <Loader2 size={24} className="spin" />
              Loading roles...
            </div>
          ) : totalRoles === 0 ? (
            <div className="empty-state">
              <UserCog size={30} />
              <span>No user role data available.</span>
            </div>
          ) : (
            <div className="role-list">
              {Object.entries(roleCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([role, count]) => {
                  const percentage = Math.round((count / totalRoles) * 100);

                  return (
                    <div className="role-item" key={role}>
                      <div className="role-line">
                        <div>
                          <span
                            className={`role-dot role-${role.toLowerCase()}`}
                          />
                          <strong>{role}</strong>
                        </div>

                        <span>
                          {count} · {percentage}%
                        </span>
                      </div>

                      <div className="role-progress">
                        <span style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          <div className="role-footer">
            <UserCog size={17} />

            <span>
              {loading
                ? "Checking user activity..."
                : `${activeUsers} active user${
                    activeUsers === 1 ? "" : "s"
                  } detected`}
            </span>
          </div>
        </div>
      </section>

      {/* ================= LOWER GRID ================= */}
      <section className="dashboard-lower-grid">
        {/* Recent Users */}
        <div className="dashboard-panel recent-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">USER MANAGEMENT</span>
              <h2>Recent Users</h2>
            </div>

            <Link to="/admin/users">View all</Link>
          </div>

          {loading ? (
            <div className="loading-state">
              <Loader2 size={22} className="spin" />
              Loading users...
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="empty-state">
              <Users size={30} />
              <span>No users found.</span>
            </div>
          ) : (
            <div className="user-list">
              {recentUsers.map((item, index) => {
                const name =
                  item?.name ||
                  item?.fullName ||
                  item?.username ||
                  item?.email ||
                  "User";

                const email = item?.email || "No email";

                const role = item?.role || item?.roles?.[0] || "USER";

                return (
                  <div className="user-row" key={item?.id || index}>
                    <div className="user-avatar">
                      {name.charAt(0).toUpperCase()}
                    </div>

                    <div className="user-details">
                      <strong>{name}</strong>
                      <span>{email}</span>
                    </div>

                    <span className="user-role">
                      {String(role).replace("ROLE_", "")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-panel actions-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">MANAGEMENT</span>
              <h2>Quick Actions</h2>
            </div>

            <Activity size={21} />
          </div>

          <div className="quick-actions">
            <Link to="/admin/users" className="quick-action">
              <div className="quick-icon blue">
                <Users size={19} />
              </div>

              <div>
                <strong>Manage Users</strong>
                <span>Roles & permissions</span>
              </div>

              <ArrowUpRight size={17} />
            </Link>

            <Link to="/tournaments" className="quick-action">
              <div className="quick-icon purple">
                <Trophy size={19} />
              </div>

              <div>
                <strong>Tournaments</strong>
                <span>Manage competitions</span>
              </div>

              <ArrowUpRight size={17} />
            </Link>

            <Link to="/teams" className="quick-action">
              <div className="quick-icon green">
                <Users size={19} />
              </div>

              <div>
                <strong>Teams</strong>
                <span>Manage cricket teams</span>
              </div>

              <ArrowUpRight size={17} />
            </Link>

            <Link to="/matches" className="quick-action">
              <div className="quick-icon red">
                <Swords size={19} />
              </div>

              <div>
                <strong>Matches</strong>
                <span>Fixtures & scores</span>
              </div>

              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER STATUS ================= */}
      <div className="dashboard-footer-status">
        <div>
          <CheckCircle2 size={17} />
          <span>Dashboard connected to live platform data</span>
        </div>

        <span>{loading ? "Synchronizing..." : `5 data sources connected`}</span>
      </div>
      <style>{`
/* =========================================================
   MYVSCRIC — PREMIUM ADMIN DASHBOARD
   Theme: Midnight Navy + Emerald
   ========================================================= */

.admin-dashboard {
  --ad-bg: #0b1120;
  --ad-panel: #111a2b;
  --ad-panel-hover: #162238;
  --ad-border: rgba(148, 163, 184, 0.14);
  --ad-text: #f1f5f9;
  --ad-muted: #94a3b8;
  --ad-green: #34d399;
  --ad-radius: 18px;

  width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: 28px;
  color: var(--ad-text);
  background:
    radial-gradient(ellipse at 5% 0%, rgba(16, 185, 129, 0.08), transparent 34%),
    var(--ad-bg);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
  box-sizing: border-box;
}

.admin-dashboard *,
.admin-dashboard *::before,
.admin-dashboard *::after {
  box-sizing: border-box;
}

.admin-dashboard a {
  color: inherit;
  text-decoration: none;
}

.admin-dashboard button {
  font: inherit;
}

/* ---------------- HERO HEADER ---------------- */

.admin-dashboard .admin-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 34px;
  margin-bottom: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 85% 10%, rgba(52, 211, 153, 0.16), transparent 30%),
    linear-gradient(120deg, #14283a 0%, #101c2c 55%, #102b2a 100%);
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 24px;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.17);
}

.admin-dashboard .admin-hero::after {
  content: "";
  position: absolute;
  right: -55px;
  bottom: -100px;
  width: 260px;
  height: 260px;
  border: 1px solid rgba(52, 211, 153, 0.12);
  border-radius: 50%;
  box-shadow:
    0 0 0 25px rgba(52, 211, 153, 0.025),
    0 0 0 50px rgba(52, 211, 153, 0.02);
  pointer-events: none;
}

.admin-dashboard .hero-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.admin-dashboard .hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 17px;
  color: #6ee7b7;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

.admin-dashboard .hero-pulse {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  background: #34d399;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(52, 211, 153, 0.7);
}

.admin-dashboard .admin-hero h1 {
  margin: 0;
  color: #f8fafc;
  font-size: clamp(27px, 3vw, 39px);
  font-weight: 800;
  letter-spacing: -1.3px;
  line-height: 1.2;
}

.admin-dashboard .admin-hero h1 span {
  color: #6ee7b7;
}

.admin-dashboard .admin-hero p {
  max-width: 610px;
  margin: 13px 0 0;
  color: #a8b8cb;
  font-size: 14px;
  line-height: 1.8;
}

.admin-dashboard .refresh-button {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  flex-shrink: 0;
  padding: 12px 17px;
  color: #eafff7;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.34);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, border-color 0.2s;
}

.admin-dashboard .refresh-button:hover:not(:disabled) {
  background: rgba(16, 185, 129, 0.22);
  border-color: #34d399;
  transform: translateY(-2px);
}

.admin-dashboard .refresh-button:disabled {
  opacity: 0.65;
  cursor: wait;
}

/* ---------------- STATISTICS CARDS ---------------- */

.admin-dashboard .dashboard-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 17px;
  margin-bottom: 24px;
}

.admin-dashboard .dashboard-stat {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 21px;
  overflow: hidden;
  background: linear-gradient(145deg, #141f32, #101827);
  border: 1px solid var(--ad-border);
  border-radius: var(--ad-radius);
  transition: transform 0.22s, border-color 0.22s, background 0.22s;
}

.admin-dashboard .dashboard-stat:hover {
  transform: translateY(-4px);
  border-color: rgba(148, 163, 184, 0.32);
  background: linear-gradient(145deg, #19273c, #111b2d);
}

.admin-dashboard .stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 23px;
}

.admin-dashboard .stat-icon {
  display: grid;
  place-items: center;
  width: 45px;
  height: 45px;
  border: 1px solid currentColor;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
}

.admin-dashboard .stat-arrow {
  color: #64748b;
  transition: color 0.2s, transform 0.2s;
}

.admin-dashboard .dashboard-stat:hover .stat-arrow {
  color: #e2e8f0;
  transform: translate(2px, -2px);
}

.admin-dashboard .stat-number {
  margin-bottom: 5px;
  color: #f8fafc;
  font-size: clamp(26px, 2.2vw, 34px);
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.admin-dashboard .stat-name {
  color: #aebcd0;
  font-size: 12px;
  font-weight: 600;
}

.admin-dashboard .stat-live {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 18px;
  color: #7f91a8;
  font-size: 10px;
  font-weight: 600;
}

.admin-dashboard .stat-live span {
  width: 6px;
  height: 6px;
  background: #34d399;
  border-radius: 50%;
}

.admin-dashboard .stat-blue .stat-icon {
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
}

.admin-dashboard .stat-purple .stat-icon {
  color: #c084fc;
  background: rgba(168, 85, 247, 0.1);
}

.admin-dashboard .stat-green .stat-icon {
  color: #34d399;
  background: rgba(16, 185, 129, 0.1);
}

.admin-dashboard .stat-orange .stat-icon {
  color: #fb923c;
  background: rgba(249, 115, 22, 0.1);
}

.admin-dashboard .stat-red .stat-icon {
  color: #fb7185;
  background: rgba(244, 63, 94, 0.1);
}

.admin-dashboard .stat-blue:hover { border-color: rgba(96, 165, 250, 0.4); }
.admin-dashboard .stat-purple:hover { border-color: rgba(192, 132, 252, 0.4); }
.admin-dashboard .stat-green:hover { border-color: rgba(52, 211, 153, 0.4); }
.admin-dashboard .stat-orange:hover { border-color: rgba(251, 146, 60, 0.4); }
.admin-dashboard .stat-red:hover { border-color: rgba(251, 113, 133, 0.4); }

.admin-dashboard .skeleton-number {
  display: block;
  width: 72px;
  height: 34px;
  background: linear-gradient(90deg, #202d40, #34445a, #202d40);
  background-size: 200% 100%;
  border-radius: 7px;
  animation: admin-skeleton 1.4s linear infinite;
}

@keyframes admin-skeleton {
  to { background-position: -200% 0; }
}

/* ---------------- MAIN CONTENT GRID ---------------- */

.admin-dashboard .dashboard-main-grid,
.admin-dashboard .dashboard-lower-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  align-items: stretch;
  gap: 22px;
  margin-bottom: 22px;
}

.admin-dashboard .dashboard-panel {
  min-width: 0;
  padding: 24px;
  background: linear-gradient(145deg, #131e30, #101827);
  border: 1px solid var(--ad-border);
  border-radius: var(--ad-radius);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

.admin-dashboard .panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 23px;
}

.admin-dashboard .panel-label {
  display: block;
  margin-bottom: 7px;
  color: #6ee7b7;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.admin-dashboard .panel-heading h2 {
  margin: 0;
  color: #f1f5f9;
  font-size: 20px;
  font-weight: 750;
  letter-spacing: -0.45px;
}

.admin-dashboard .panel-heading > svg {
  color: #6ee7b7;
}

.admin-dashboard .panel-heading > a {
  color: #6ee7b7;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.admin-dashboard .panel-heading > a:hover {
  color: #a7f3d0;
}

/* ---------------- SYSTEM OVERVIEW ---------------- */

.admin-dashboard .system-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(52, 211, 153, 0.16);
  border-radius: 30px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.admin-dashboard .system-status span {
  width: 6px;
  height: 6px;
  background: #34d399;
  border-radius: 50%;
}

.admin-dashboard .overview-list {
  display: flex;
  flex-direction: column;
}

.admin-dashboard .overview-row {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
  padding: 14px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.admin-dashboard .overview-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.admin-dashboard .overview-icon,
.admin-dashboard .quick-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 13px;
}

.admin-dashboard .overview-icon.blue,
.admin-dashboard .quick-icon.blue {
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.12);
}

.admin-dashboard .overview-icon.purple,
.admin-dashboard .quick-icon.purple {
  color: #c084fc;
  background: rgba(168, 85, 247, 0.12);
}

.admin-dashboard .overview-icon.green,
.admin-dashboard .quick-icon.green {
  color: #34d399;
  background: rgba(16, 185, 129, 0.12);
}

.admin-dashboard .overview-icon.orange,
.admin-dashboard .quick-icon.orange {
  color: #fb923c;
  background: rgba(249, 115, 22, 0.12);
}

.admin-dashboard .overview-icon.red,
.admin-dashboard .quick-icon.red {
  color: #fb7185;
  background: rgba(244, 63, 94, 0.12);
}

.admin-dashboard .overview-info,
.admin-dashboard .user-details {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 5px;
}

.admin-dashboard .overview-info strong,
.admin-dashboard .user-details strong {
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 650;
}

.admin-dashboard .overview-info span,
.admin-dashboard .user-details span {
  color: #8292a8;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.admin-dashboard .overview-row > b {
  color: #f8fafc;
  font-size: 20px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

/* ---------------- ROLE DISTRIBUTION ---------------- */

.admin-dashboard .role-list {
  display: flex;
  flex-direction: column;
  gap: 23px;
}

.admin-dashboard .role-item {
  min-width: 0;
}

.admin-dashboard .role-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 11px;
}

.admin-dashboard .role-line > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.admin-dashboard .role-line strong {
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 700;
}

.admin-dashboard .role-line > span {
  color: #94a3b8;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.admin-dashboard .role-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.admin-dashboard .role-admin { background: #c084fc; }
.admin-dashboard .role-organizer { background: #60a5fa; }
.admin-dashboard .role-scorer { background: #34d399; }
.admin-dashboard .role-user { background: #fb923c; }

.admin-dashboard .role-progress {
  height: 7px;
  overflow: hidden;
  background: #253247;
  border-radius: 20px;
}

.admin-dashboard .role-progress span {
  display: block;
  height: 100%;
  min-width: 0;
  background: linear-gradient(90deg, #059669, #6ee7b7);
  border-radius: inherit;
  transition: width 0.6s ease;
}

.admin-dashboard .role-footer {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 26px;
  padding: 13px;
  color: #a9b8cb;
  background: rgba(16, 185, 129, 0.055);
  border: 1px solid rgba(52, 211, 153, 0.12);
  border-radius: 11px;
  font-size: 11px;
}

.admin-dashboard .role-footer svg {
  flex-shrink: 0;
  color: #34d399;
}

/* ---------------- RECENT USERS ---------------- */

.admin-dashboard .user-list {
  display: flex;
  flex-direction: column;
}

.admin-dashboard .user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 13px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.admin-dashboard .user-row:first-child {
  padding-top: 0;
}

.admin-dashboard .user-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.admin-dashboard .user-avatar {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  color: #a7f3d0;
  background: linear-gradient(145deg, #145443, #18364a);
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 14px;
  font-size: 15px;
  font-weight: 800;
}

.admin-dashboard .user-role {
  padding: 6px 9px;
  color: #a7f3d0;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.15);
  border-radius: 7px;
  font-size: 9px;
  font-weight: 800;
  white-space: nowrap;
}

/* ---------------- QUICK ACTIONS ---------------- */

.admin-dashboard .quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-dashboard .quick-action {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
  padding: 13px;
  background: rgba(255, 255, 255, 0.018);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 13px;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}

.admin-dashboard .quick-action:hover {
  background: rgba(52, 211, 153, 0.055);
  border-color: rgba(52, 211, 153, 0.28);
  transform: translateX(3px);
}

.admin-dashboard .quick-action > div:nth-child(2) {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.admin-dashboard .quick-action strong {
  color: #e5edf6;
  font-size: 12px;
  font-weight: 700;
}

.admin-dashboard .quick-action span {
  color: #8292a8;
  font-size: 10px;
}

.admin-dashboard .quick-action > svg {
  flex-shrink: 0;
  color: #71839b;
  transition: color 0.2s, transform 0.2s;
}

.admin-dashboard .quick-action:hover > svg {
  color: #6ee7b7;
  transform: translate(2px, -2px);
}

/* ---------------- ERROR, LOADING, EMPTY STATES ---------------- */

.admin-dashboard .dashboard-error {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
  padding: 17px;
  color: #fecaca;
  background: rgba(127, 29, 29, 0.2);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 14px;
}

.admin-dashboard .dashboard-error > svg {
  flex-shrink: 0;
  color: #f87171;
}

.admin-dashboard .dashboard-error > div {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.admin-dashboard .dashboard-error strong {
  font-size: 13px;
}

.admin-dashboard .dashboard-error span {
  color: #fca5a5;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.admin-dashboard .dashboard-error button {
  padding: 9px 12px;
  color: #fff;
  background: #991b1b;
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 9px;
  cursor: pointer;
}

.admin-dashboard .empty-state,
.admin-dashboard .loading-state,
.admin-dashboard .role-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  min-height: 155px;
  color: #8495ab;
  font-size: 12px;
  text-align: center;
}

.admin-dashboard .empty-state svg {
  color: #50647e;
}

.admin-dashboard .spin {
  animation: admin-spin 1s linear infinite;
}

@keyframes admin-spin {
  to { transform: rotate(360deg); }
}

/* ---------------- FOOTER STATUS ---------------- */

.admin-dashboard .dashboard-footer-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 19px;
  color: #8394aa;
  background: rgba(17, 26, 43, 0.8);
  border: 1px solid var(--ad-border);
  border-radius: 13px;
  font-size: 11px;
}

.admin-dashboard .dashboard-footer-status > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.admin-dashboard .dashboard-footer-status svg {
  color: #34d399;
}

.admin-dashboard .dashboard-footer-status > span {
  color: #6ee7b7;
}

/* ---------------- ACCESSIBILITY ---------------- */

.admin-dashboard a:focus-visible,
.admin-dashboard button:focus-visible {
  outline: 2px solid #6ee7b7;
  outline-offset: 3px;
}

/* ---------------- TABLET ---------------- */

@media (max-width: 1200px) {
  .admin-dashboard {
    padding: 22px;
  }

  .admin-dashboard .dashboard-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .admin-dashboard .dashboard-main-grid,
  .admin-dashboard .dashboard-lower-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-dashboard .dashboard-panel {
    padding: 20px;
  }
}

/* ---------------- MOBILE ---------------- */

@media (max-width: 760px) {
  .admin-dashboard {
    padding: 15px;
  }

  .admin-dashboard .admin-hero {
    align-items: flex-start;
    flex-direction: column;
    gap: 22px;
    padding: 23px;
    border-radius: 19px;
  }

  .admin-dashboard .admin-hero h1 {
    font-size: 29px;
  }

  .admin-dashboard .admin-hero p {
    font-size: 13px;
  }

  .admin-dashboard .dashboard-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .admin-dashboard .dashboard-stat {
    padding: 16px;
    border-radius: 15px;
  }

  .admin-dashboard .stat-top {
    margin-bottom: 17px;
  }

  .admin-dashboard .stat-icon {
    width: 39px;
    height: 39px;
  }

  .admin-dashboard .stat-number {
    font-size: 28px;
  }

  .admin-dashboard .dashboard-main-grid,
  .admin-dashboard .dashboard-lower-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 15px;
    margin-bottom: 15px;
  }

  .admin-dashboard .dashboard-panel {
    padding: 18px;
    border-radius: 16px;
  }

  .admin-dashboard .panel-heading {
    margin-bottom: 19px;
  }

  .admin-dashboard .panel-heading h2 {
    font-size: 18px;
  }

  .admin-dashboard .dashboard-footer-status {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 380px) {
  .admin-dashboard {
    padding: 10px;
  }

  .admin-dashboard .dashboard-stats {
    gap: 9px;
  }

  .admin-dashboard .dashboard-stat {
    padding: 12px;
  }

  .admin-dashboard .stat-number {
    font-size: 24px;
  }

  .admin-dashboard .stat-name {
    font-size: 11px;
  }

  .admin-dashboard .dashboard-panel {
    padding: 14px;
  }

  .admin-dashboard .user-role {
    padding: 5px 6px;
    font-size: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-dashboard *,
  .admin-dashboard *::before,
  .admin-dashboard *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
/* =========================================================
   MYVSCRIC — PREMIUM ADMIN DASHBOARD
   Theme: Midnight Navy + Emerald
   ========================================================= */

.admin-dashboard {
  --ad-bg: #0b1120;
  --ad-panel: #111a2b;
  --ad-panel-hover: #162238;
  --ad-border: rgba(148, 163, 184, 0.14);
  --ad-text: #f1f5f9;
  --ad-muted: #94a3b8;
  --ad-green: #34d399;
  --ad-radius: 18px;

  width: 100%;
  min-width: 0;
  min-height: 100%;
  padding: 28px;
  color: var(--ad-text);
  background:
    radial-gradient(ellipse at 5% 0%, rgba(16, 185, 129, 0.08), transparent 34%),
    var(--ad-bg);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
  box-sizing: border-box;
}

.admin-dashboard *,
.admin-dashboard *::before,
.admin-dashboard *::after {
  box-sizing: border-box;
}

.admin-dashboard a {
  color: inherit;
  text-decoration: none;
}

.admin-dashboard button {
  font: inherit;
}

/* ---------------- HERO HEADER ---------------- */

.admin-dashboard .admin-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 34px;
  margin-bottom: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 85% 10%, rgba(52, 211, 153, 0.16), transparent 30%),
    linear-gradient(120deg, #14283a 0%, #101c2c 55%, #102b2a 100%);
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 24px;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.17);
}

.admin-dashboard .admin-hero::after {
  content: "";
  position: absolute;
  right: -55px;
  bottom: -100px;
  width: 260px;
  height: 260px;
  border: 1px solid rgba(52, 211, 153, 0.12);
  border-radius: 50%;
  box-shadow:
    0 0 0 25px rgba(52, 211, 153, 0.025),
    0 0 0 50px rgba(52, 211, 153, 0.02);
  pointer-events: none;
}

.admin-dashboard .hero-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.admin-dashboard .hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 17px;
  color: #6ee7b7;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

.admin-dashboard .hero-pulse {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  background: #34d399;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(52, 211, 153, 0.7);
}

.admin-dashboard .admin-hero h1 {
  margin: 0;
  color: #f8fafc;
  font-size: clamp(27px, 3vw, 39px);
  font-weight: 800;
  letter-spacing: -1.3px;
  line-height: 1.2;
}

.admin-dashboard .admin-hero h1 span {
  color: #6ee7b7;
}

.admin-dashboard .admin-hero p {
  max-width: 610px;
  margin: 13px 0 0;
  color: #a8b8cb;
  font-size: 14px;
  line-height: 1.8;
}

.admin-dashboard .refresh-button {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  flex-shrink: 0;
  padding: 12px 17px;
  color: #eafff7;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.34);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, border-color 0.2s;
}

.admin-dashboard .refresh-button:hover:not(:disabled) {
  background: rgba(16, 185, 129, 0.22);
  border-color: #34d399;
  transform: translateY(-2px);
}

.admin-dashboard .refresh-button:disabled {
  opacity: 0.65;
  cursor: wait;
}

/* ---------------- STATISTICS CARDS ---------------- */

.admin-dashboard .dashboard-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 17px;
  margin-bottom: 24px;
}

.admin-dashboard .dashboard-stat {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 21px;
  overflow: hidden;
  background: linear-gradient(145deg, #141f32, #101827);
  border: 1px solid var(--ad-border);
  border-radius: var(--ad-radius);
  transition: transform 0.22s, border-color 0.22s, background 0.22s;
}

.admin-dashboard .dashboard-stat:hover {
  transform: translateY(-4px);
  border-color: rgba(148, 163, 184, 0.32);
  background: linear-gradient(145deg, #19273c, #111b2d);
}

.admin-dashboard .stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 23px;
}

.admin-dashboard .stat-icon {
  display: grid;
  place-items: center;
  width: 45px;
  height: 45px;
  border: 1px solid currentColor;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.035);
}

.admin-dashboard .stat-arrow {
  color: #64748b;
  transition: color 0.2s, transform 0.2s;
}

.admin-dashboard .dashboard-stat:hover .stat-arrow {
  color: #e2e8f0;
  transform: translate(2px, -2px);
}

.admin-dashboard .stat-number {
  margin-bottom: 5px;
  color: #f8fafc;
  font-size: clamp(26px, 2.2vw, 34px);
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.admin-dashboard .stat-name {
  color: #aebcd0;
  font-size: 12px;
  font-weight: 600;
}

.admin-dashboard .stat-live {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 18px;
  color: #7f91a8;
  font-size: 10px;
  font-weight: 600;
}

.admin-dashboard .stat-live span {
  width: 6px;
  height: 6px;
  background: #34d399;
  border-radius: 50%;
}

.admin-dashboard .stat-blue .stat-icon {
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
}

.admin-dashboard .stat-purple .stat-icon {
  color: #c084fc;
  background: rgba(168, 85, 247, 0.1);
}

.admin-dashboard .stat-green .stat-icon {
  color: #34d399;
  background: rgba(16, 185, 129, 0.1);
}

.admin-dashboard .stat-orange .stat-icon {
  color: #fb923c;
  background: rgba(249, 115, 22, 0.1);
}

.admin-dashboard .stat-red .stat-icon {
  color: #fb7185;
  background: rgba(244, 63, 94, 0.1);
}

.admin-dashboard .stat-blue:hover { border-color: rgba(96, 165, 250, 0.4); }
.admin-dashboard .stat-purple:hover { border-color: rgba(192, 132, 252, 0.4); }
.admin-dashboard .stat-green:hover { border-color: rgba(52, 211, 153, 0.4); }
.admin-dashboard .stat-orange:hover { border-color: rgba(251, 146, 60, 0.4); }
.admin-dashboard .stat-red:hover { border-color: rgba(251, 113, 133, 0.4); }

.admin-dashboard .skeleton-number {
  display: block;
  width: 72px;
  height: 34px;
  background: linear-gradient(90deg, #202d40, #34445a, #202d40);
  background-size: 200% 100%;
  border-radius: 7px;
  animation: admin-skeleton 1.4s linear infinite;
}

@keyframes admin-skeleton {
  to { background-position: -200% 0; }
}

/* ---------------- MAIN CONTENT GRID ---------------- */

.admin-dashboard .dashboard-main-grid,
.admin-dashboard .dashboard-lower-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  align-items: stretch;
  gap: 22px;
  margin-bottom: 22px;
}

.admin-dashboard .dashboard-panel {
  min-width: 0;
  padding: 24px;
  background: linear-gradient(145deg, #131e30, #101827);
  border: 1px solid var(--ad-border);
  border-radius: var(--ad-radius);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
}

.admin-dashboard .panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 23px;
}

.admin-dashboard .panel-label {
  display: block;
  margin-bottom: 7px;
  color: #6ee7b7;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.admin-dashboard .panel-heading h2 {
  margin: 0;
  color: #f1f5f9;
  font-size: 20px;
  font-weight: 750;
  letter-spacing: -0.45px;
}

.admin-dashboard .panel-heading > svg {
  color: #6ee7b7;
}

.admin-dashboard .panel-heading > a {
  color: #6ee7b7;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.admin-dashboard .panel-heading > a:hover {
  color: #a7f3d0;
}

/* ---------------- SYSTEM OVERVIEW ---------------- */

.admin-dashboard .system-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(52, 211, 153, 0.16);
  border-radius: 30px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.admin-dashboard .system-status span {
  width: 6px;
  height: 6px;
  background: #34d399;
  border-radius: 50%;
}

.admin-dashboard .overview-list {
  display: flex;
  flex-direction: column;
}

.admin-dashboard .overview-row {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
  padding: 14px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.admin-dashboard .overview-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.admin-dashboard .overview-icon,
.admin-dashboard .quick-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 13px;
}

.admin-dashboard .overview-icon.blue,
.admin-dashboard .quick-icon.blue {
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.12);
}

.admin-dashboard .overview-icon.purple,
.admin-dashboard .quick-icon.purple {
  color: #c084fc;
  background: rgba(168, 85, 247, 0.12);
}

.admin-dashboard .overview-icon.green,
.admin-dashboard .quick-icon.green {
  color: #34d399;
  background: rgba(16, 185, 129, 0.12);
}

.admin-dashboard .overview-icon.orange,
.admin-dashboard .quick-icon.orange {
  color: #fb923c;
  background: rgba(249, 115, 22, 0.12);
}

.admin-dashboard .overview-icon.red,
.admin-dashboard .quick-icon.red {
  color: #fb7185;
  background: rgba(244, 63, 94, 0.12);
}

.admin-dashboard .overview-info,
.admin-dashboard .user-details {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 5px;
}

.admin-dashboard .overview-info strong,
.admin-dashboard .user-details strong {
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 650;
}

.admin-dashboard .overview-info span,
.admin-dashboard .user-details span {
  color: #8292a8;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.admin-dashboard .overview-row > b {
  color: #f8fafc;
  font-size: 20px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

/* ---------------- ROLE DISTRIBUTION ---------------- */

.admin-dashboard .role-list {
  display: flex;
  flex-direction: column;
  gap: 23px;
}

.admin-dashboard .role-item {
  min-width: 0;
}

.admin-dashboard .role-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 11px;
}

.admin-dashboard .role-line > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.admin-dashboard .role-line strong {
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 700;
}

.admin-dashboard .role-line > span {
  color: #94a3b8;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.admin-dashboard .role-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.admin-dashboard .role-admin { background: #c084fc; }
.admin-dashboard .role-organizer { background: #60a5fa; }
.admin-dashboard .role-scorer { background: #34d399; }
.admin-dashboard .role-user { background: #fb923c; }

.admin-dashboard .role-progress {
  height: 7px;
  overflow: hidden;
  background: #253247;
  border-radius: 20px;
}

.admin-dashboard .role-progress span {
  display: block;
  height: 100%;
  min-width: 0;
  background: linear-gradient(90deg, #059669, #6ee7b7);
  border-radius: inherit;
  transition: width 0.6s ease;
}

.admin-dashboard .role-footer {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 26px;
  padding: 13px;
  color: #a9b8cb;
  background: rgba(16, 185, 129, 0.055);
  border: 1px solid rgba(52, 211, 153, 0.12);
  border-radius: 11px;
  font-size: 11px;
}

.admin-dashboard .role-footer svg {
  flex-shrink: 0;
  color: #34d399;
}

/* ---------------- RECENT USERS ---------------- */

.admin-dashboard .user-list {
  display: flex;
  flex-direction: column;
}

.admin-dashboard .user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 13px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.admin-dashboard .user-row:first-child {
  padding-top: 0;
}

.admin-dashboard .user-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.admin-dashboard .user-avatar {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  color: #a7f3d0;
  background: linear-gradient(145deg, #145443, #18364a);
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 14px;
  font-size: 15px;
  font-weight: 800;
}

.admin-dashboard .user-role {
  padding: 6px 9px;
  color: #a7f3d0;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.15);
  border-radius: 7px;
  font-size: 9px;
  font-weight: 800;
  white-space: nowrap;
}

/* ---------------- QUICK ACTIONS ---------------- */

.admin-dashboard .quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-dashboard .quick-action {
  display: flex;
  align-items: center;
  gap: 13px;
  min-width: 0;
  padding: 13px;
  background: rgba(255, 255, 255, 0.018);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 13px;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}

.admin-dashboard .quick-action:hover {
  background: rgba(52, 211, 153, 0.055);
  border-color: rgba(52, 211, 153, 0.28);
  transform: translateX(3px);
}

.admin-dashboard .quick-action > div:nth-child(2) {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.admin-dashboard .quick-action strong {
  color: #e5edf6;
  font-size: 12px;
  font-weight: 700;
}

.admin-dashboard .quick-action span {
  color: #8292a8;
  font-size: 10px;
}

.admin-dashboard .quick-action > svg {
  flex-shrink: 0;
  color: #71839b;
  transition: color 0.2s, transform 0.2s;
}

.admin-dashboard .quick-action:hover > svg {
  color: #6ee7b7;
  transform: translate(2px, -2px);
}

/* ---------------- ERROR, LOADING, EMPTY STATES ---------------- */

.admin-dashboard .dashboard-error {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
  padding: 17px;
  color: #fecaca;
  background: rgba(127, 29, 29, 0.2);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 14px;
}

.admin-dashboard .dashboard-error > svg {
  flex-shrink: 0;
  color: #f87171;
}

.admin-dashboard .dashboard-error > div {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.admin-dashboard .dashboard-error strong {
  font-size: 13px;
}

.admin-dashboard .dashboard-error span {
  color: #fca5a5;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.admin-dashboard .dashboard-error button {
  padding: 9px 12px;
  color: #fff;
  background: #991b1b;
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 9px;
  cursor: pointer;
}

.admin-dashboard .empty-state,
.admin-dashboard .loading-state,
.admin-dashboard .role-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  min-height: 155px;
  color: #8495ab;
  font-size: 12px;
  text-align: center;
}

.admin-dashboard .empty-state svg {
  color: #50647e;
}

.admin-dashboard .spin {
  animation: admin-spin 1s linear infinite;
}

@keyframes admin-spin {
  to { transform: rotate(360deg); }
}

/* ---------------- FOOTER STATUS ---------------- */

.admin-dashboard .dashboard-footer-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 19px;
  color: #8394aa;
  background: rgba(17, 26, 43, 0.8);
  border: 1px solid var(--ad-border);
  border-radius: 13px;
  font-size: 11px;
}

.admin-dashboard .dashboard-footer-status > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.admin-dashboard .dashboard-footer-status svg {
  color: #34d399;
}

.admin-dashboard .dashboard-footer-status > span {
  color: #6ee7b7;
}

/* ---------------- ACCESSIBILITY ---------------- */

.admin-dashboard a:focus-visible,
.admin-dashboard button:focus-visible {
  outline: 2px solid #6ee7b7;
  outline-offset: 3px;
}

/* ---------------- TABLET ---------------- */

@media (max-width: 1200px) {
  .admin-dashboard {
    padding: 22px;
  }

  .admin-dashboard .dashboard-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .admin-dashboard .dashboard-main-grid,
  .admin-dashboard .dashboard-lower-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-dashboard .dashboard-panel {
    padding: 20px;
  }
}

/* ---------------- MOBILE ---------------- */

@media (max-width: 760px) {
  .admin-dashboard {
    padding: 15px;
  }

  .admin-dashboard .admin-hero {
    align-items: flex-start;
    flex-direction: column;
    gap: 22px;
    padding: 23px;
    border-radius: 19px;
  }

  .admin-dashboard .admin-hero h1 {
    font-size: 29px;
  }

  .admin-dashboard .admin-hero p {
    font-size: 13px;
  }

  .admin-dashboard .dashboard-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .admin-dashboard .dashboard-stat {
    padding: 16px;
    border-radius: 15px;
  }

  .admin-dashboard .stat-top {
    margin-bottom: 17px;
  }

  .admin-dashboard .stat-icon {
    width: 39px;
    height: 39px;
  }

  .admin-dashboard .stat-number {
    font-size: 28px;
  }

  .admin-dashboard .dashboard-main-grid,
  .admin-dashboard .dashboard-lower-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 15px;
    margin-bottom: 15px;
  }

  .admin-dashboard .dashboard-panel {
    padding: 18px;
    border-radius: 16px;
  }

  .admin-dashboard .panel-heading {
    margin-bottom: 19px;
  }

  .admin-dashboard .panel-heading h2 {
    font-size: 18px;
  }

  .admin-dashboard .dashboard-footer-status {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 380px) {
  .admin-dashboard {
    padding: 10px;
  }

  .admin-dashboard .dashboard-stats {
    gap: 9px;
  }

  .admin-dashboard .dashboard-stat {
    padding: 12px;
  }

  .admin-dashboard .stat-number {
    font-size: 24px;
  }

  .admin-dashboard .stat-name {
    font-size: 11px;
  }

  .admin-dashboard .dashboard-panel {
    padding: 14px;
  }

  .admin-dashboard .user-role {
    padding: 5px 6px;
    font-size: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-dashboard *,
  .admin-dashboard *::before,
  .admin-dashboard *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}`}</style>
    </div>
  );
};

export default AdminDashboard;

// import React from "react";
// import { Users, ShieldCheck, UserCog, Trophy, ArrowUpRight } from "lucide-react";
// import { Link } from "react-router-dom";

// const AdminDashboard = () => {
//   let user = {};

//   try {
//     user = JSON.parse(localStorage.getItem("user") || "{}");
//   } catch {
//     user = {};
//   }

//   const stats = [
//     { label: "Total users", value: "1,248", trend: "+12.4%" },
//     { label: "Roles active", value: "4", trend: "Live" },
//     { label: "Tournaments", value: "18", trend: "+3 this week" },
//     { label: "Alerts", value: "12", trend: "Needs review" },
//   ];

//   return (
//     <div className="dashboard-page admin-dashboard-shell">
//       <div className="dashboard-header premium-header">
//         <div className="header-copy">
//           <p>Administration</p>
//           <h1>Welcome back, {user.name || "Admin"}</h1>
//           <span>Manage your Myvscric cricket platform from a premium command center.</span>
//         </div>

//         <div className="header-status-pill">
//           <span className="status-dot" />
//           System live
//         </div>
//       </div>

//       <div className="stats-strip">
//         {stats.map((stat) => (
//           <div key={stat.label} className="stat-card">
//             <span className="stat-label">{stat.label}</span>
//             <strong>{stat.value}</strong>
//             <small>{stat.trend}</small>
//           </div>
//         ))}
//       </div>

//       <div className="dashboard-grid">
//         <Link to="/admin/users" className="dashboard-card premium-card">
//           <div className="card-icon-wrap icon-users">
//             <Users />
//           </div>
//           <div className="card-content">
//             <h3>User Management</h3>
//             <p>Create users, review profiles, and manage access roles.</p>
//           </div>
//           <ArrowUpRight className="card-arrow" />
//         </Link>

//         <div className="dashboard-card premium-card">
//           <div className="card-icon-wrap icon-security">
//             <ShieldCheck />
//           </div>
//           <div className="card-content">
//             <h3>Security</h3>
//             <p>Monitor permissions, access controls, and secure activity.</p>
//           </div>
//           <ArrowUpRight className="card-arrow" />
//         </div>

//         <div className="dashboard-card premium-card">
//           <div className="card-icon-wrap icon-roles">
//             <UserCog />
//           </div>
//           <div className="card-content">
//             <h3>Roles</h3>
//             <p>ADMIN, ORGANIZER, SCORER, and USER access assignments.</p>
//           </div>
//           <ArrowUpRight className="card-arrow" />
//         </div>

//         <div className="dashboard-card premium-card">
//           <div className="card-icon-wrap icon-tournaments">
//             <Trophy />
//           </div>
//           <div className="card-content">
//             <h3>Tournaments</h3>
//             <p>Track fixtures, outcomes, and cricket competition operations.</p>
//           </div>
//           <ArrowUpRight className="card-arrow" />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;
