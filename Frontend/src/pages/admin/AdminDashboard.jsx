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
