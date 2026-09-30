import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Users,
  UserRound,
  CalendarDays,
  Activity,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Radio,
  MapPin,
  Clock3,
  Target,
  ShieldCheck,
  Zap,
  TrendingUp,
} from "lucide-react";
import {
  inningsAPI,
  matchAPI,
  playerAPI,
  scoreAPI,
  teamAPI,
  tournamentAPI,
} from "../services/api";

import { canManageCricket, getStoredRole, roleLabel } from "../constants/roles";

const extractList = (response, key) => {
  const data = response?.data ?? response ?? {};

  if (Array.isArray(data)) return data;

  return data?.data || data?.[key] || data?.content || [];
};

const getTeamName = (match, side) => {
  const team =
    side === 1
      ? match?.team1 || match?.teamA || match?.homeTeam
      : match?.team2 || match?.teamB || match?.awayTeam;

  return (
    team?.name ||
    team?.teamName ||
    (side === 1
      ? match?.team1Name || match?.teamAName
      : match?.team2Name || match?.teamBName) ||
    `Team ${side}`
  );
};

const formatInningsOvers = (innings) => {
  const overs = Number(innings?.overs || 0);
  const balls = Number(innings?.balls || 0);

  return `${overs}.${balls} overs`;
};

function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    tournaments: 0,
    teams: 0,
    players: 0,
    matches: 0,
  });
  const [liveMatches, setLiveMatches] = useState([]);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      const [
        tournamentsResponse,
        teamsResponse,
        playersResponse,
        matchesResponse,
      ] = await Promise.all([
        tournamentAPI.getAll(),
        teamAPI.getAll(),
        playerAPI.getAll(),
        matchAPI.getAll(),
      ]);
      const tournaments = extractList(tournamentsResponse, "tournaments");
      const teams = extractList(teamsResponse, "teams");
      const players = extractList(playersResponse, "players");
      const matches = extractList(matchesResponse, "matches");
      const activeMatches = matches.filter(
        (match) => String(match.status).toUpperCase() === "LIVE",
      );

      const liveMatchesWithScores = await Promise.all(
        activeMatches.map(async (match) => {
          const [inningsResponse, scoreResponse] = await Promise.all([
            inningsAPI.getByMatch(match.id),
            scoreAPI.getCurrent(match.id),
          ]);

          const innings = extractList(inningsResponse, "innings");
          const score = scoreResponse?.data ?? scoreResponse ?? {};
          const firstInnings = innings.find(
            (item) => Number(item.inningsNumber) === 1,
          );
          const currentInnings = innings[innings.length - 1] || {};

          return {
            ...match,
            liveInnings: innings,
            currentScore: score,
            firstInnings,
            currentInnings,
          };
        }),
      );

      if (!active) return;

      setCounts({
        tournaments: tournaments.length,
        teams: teams.length,
        players: players.length,
        matches: matches.length,
      });
      setLiveMatches(liveMatchesWithScores);
    };

    loadDashboard().catch(() => undefined);

    const refreshTimer = window.setInterval(() => {
      loadDashboard().catch(() => undefined);
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const role = getStoredRole();
  const userName = user?.name || "Cricket Manager";

  const canManage = canManageCricket(role);

  const stats = [
    {
      title: "Tournaments",
      value: counts.tournaments,
      change: "+18.2%",
      label: "vs last month",
      icon: Trophy,
      path: "/tournaments",
    },
    {
      title: "Teams",
      value: counts.teams,
      change: "+12.5%",
      label: "registered teams",
      icon: Users,
      path: "/teams",
    },
    {
      title: "Players",
      value: counts.players,
      change: "+8.4%",
      label: "active players",
      icon: UserRound,
      path: "/players",
    },
    {
      title: "Matches",
      value: counts.matches,
      change: "+24.1%",
      label: "scheduled matches",
      icon: CalendarDays,
      path: "/matches",
    },
  ];

  const liveMatchCards = liveMatches.map((match) => ({
    ...match,
    tournament:
      match.tournament?.name ||
      match.tournament?.tournamentName ||
      match.tournamentName ||
      "",
    venue: match.venue || "",
    team1: getTeamName(match, 1),
    team1Short: getTeamName(match, 1).slice(0, 2).toUpperCase(),
    team1Score: `${match.firstInnings?.runs || 0}/${match.firstInnings?.wickets || 0}`,
    team1Overs: formatInningsOvers(match.firstInnings),
    team2: getTeamName(match, 2),
    team2Short: getTeamName(match, 2).slice(0, 2).toUpperCase(),
    team2Score: `${match.currentInnings?.inningsNumber === 2 ? match.currentInnings?.runs || 0 : 0}/${match.currentInnings?.inningsNumber === 2 ? match.currentInnings?.wickets || 0 : 0}`,
    team2Overs: formatInningsOvers(
      match.currentInnings?.inningsNumber === 2 ? match.currentInnings : null,
    ),
    target: match.currentInnings?.target
      ? `Target ${match.currentInnings.target}`
      : "",
  }));

  const recentActivity = [];

  const quickActions = [
    {
      title: "Create Tournament",
      description: "Start a new competition",
      icon: Trophy,
      path: "/tournaments",
    },
    {
      title: "Manage Teams",
      description: "Add or update teams",
      icon: Users,
      path: "/teams",
    },
    {
      title: "Add Players",
      description: "Register tournament players",
      icon: UserRound,
      path: "/players",
    },
    {
      title: "Schedule Match",
      description: "Create a new fixture",
      icon: CalendarDays,
      path: "/matches",
    },
  ];

  return (
    <div className="dashboard-page">
      {/* HERO */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-bg" />

        <div className="dashboard-hero-content">
          <div>
            <div className="dashboard-eyebrow">
              <span className="dashboard-live-dot" />
              CRICKET COMMAND CENTER
            </div>

            <h1>
              Good afternoon, <span>{userName}</span>
            </h1>

            <p>
              Manage tournaments, teams, players and live matches from one
              powerful dashboard.
            </p>

            <div className="dashboard-hero-actions">
              {canManage && (
                <button
                  className="dashboard-primary-btn"
                  onClick={() => navigate("/tournaments")}
                >
                  <Plus size={18} />
                  Create Tournament
                </button>
              )}

              <button
                className="dashboard-secondary-btn"
                onClick={() => navigate("/matches")}
              >
                <Activity size={18} />
                View Matches
              </button>
            </div>
          </div>

          {liveMatchCards[0] && (
            <div className="dashboard-hero-score">
              <div className="hero-score-top">
                <Radio size={16} />
                LIVE NOW
              </div>

              <div className="hero-score-teams">
                <div>
                  <strong>{liveMatchCards[0].team1Short}</strong>
                  <span>{liveMatchCards[0].team1}</span>
                </div>

                <div className="hero-score-value">
                  {liveMatchCards[0].team1Score}
                  <small>{liveMatchCards[0].team1Overs}</small>
                </div>

                <div>
                  <strong>{liveMatchCards[0].team2Short}</strong>
                  <span>{liveMatchCards[0].team2}</span>
                </div>
              </div>

              <div className="hero-score-footer">
                <span>
                  {liveMatchCards[0]
                    ? "Live score available"
                    : "No live matches"}
                </span>
                <button onClick={() => navigate("/scoreboard")}>
                  Open Scoreboard
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* STATS */}
      <section className="dashboard-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <button
              className="dashboard-stat-card"
              key={stat.title}
              onClick={() => navigate(stat.path)}
            >
              <div className="stat-card-top">
                <div className="stat-icon">
                  <Icon size={21} />
                </div>

                <ArrowUpRight size={17} className="stat-arrow" />
              </div>

              <div className="stat-value">{stat.value}</div>

              <div className="stat-title">{stat.title}</div>

              <div className="stat-bottom">
                <span>{stat.change}</span>
                {stat.label}
              </div>
            </button>
          );
        })}
      </section>

      {/* MAIN GRID */}
      <section className="dashboard-main-grid">
        {/* LIVE MATCHES */}
        <div className="dashboard-panel live-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <span className="panel-live-icon">
                  <Radio size={16} />
                </span>
                Live Matches
              </div>

              <div className="panel-subtitle">
                Matches currently in progress
              </div>
            </div>

            <button className="panel-link" onClick={() => navigate("/matches")}>
              View all
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="live-match-list">
            {liveMatchCards.map((match) => (
              <div className="live-match-card" key={match.id}>
                <div className="match-card-top">
                  <div>
                    <span className="live-badge">
                      <span />
                      LIVE
                    </span>

                    <span className="match-id">{match.id}</span>
                  </div>

                  <span className="match-tournament">{match.tournament}</span>
                </div>

                <div className="match-teams">
                  <div className="match-team">
                    <div className="team-logo">{match.team1Short}</div>

                    <div className="team-info">
                      <strong>{match.team1}</strong>
                      <span>{match.team1Overs}</span>
                    </div>

                    <div className="team-score">{match.team1Score}</div>
                  </div>

                  <div className="match-vs">VS</div>

                  <div className="match-team">
                    <div className="team-logo">{match.team2Short}</div>

                    <div className="team-info">
                      <strong>{match.team2}</strong>
                      <span>{match.team2Overs}</span>
                    </div>

                    <div className="team-score">{match.team2Score}</div>
                  </div>
                </div>

                <div className="match-card-footer">
                  <span>
                    <MapPin size={14} />
                    {match.venue}
                  </span>

                  <span className="target-text">
                    <Target size={14} />
                    {match.target}
                  </span>

                  <button onClick={() => navigate("/scoreboard")}>
                    Scoreboard
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="dashboard-panel quick-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Zap size={17} />
                Quick Actions
              </div>

              <div className="panel-subtitle">Frequently used controls</div>
            </div>
          </div>

          <div className="quick-actions-list">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.title}
                  className={`quick-action ${
                    !canManage ? "quick-action-view" : ""
                  }`}
                  onClick={() => navigate(action.path)}
                >
                  <div className="quick-action-icon">
                    <Icon size={19} />
                  </div>

                  <div className="quick-action-content">
                    <strong>{action.title}</strong>
                    <span>{action.description}</span>
                  </div>

                  <ChevronRight size={17} />
                </button>
              );
            })}
          </div>

          <div className="role-card">
            <div className="role-card-icon">
              <ShieldCheck size={21} />
            </div>

            <div>
              <span>Your current role</span>
              <strong>{role}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM GRID */}
      <section className="dashboard-bottom-grid">
        {/* ACTIVITY */}
        <div className="dashboard-panel activity-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Activity size={17} />
                Recent Activity
              </div>

              <div className="panel-subtitle">Latest tournament updates</div>
            </div>

            <TrendingUp size={18} />
          </div>

          <div className="activity-list">
            {recentActivity.map((item, index) => {
              const Icon = item.icon;

              return (
                <div className="activity-item" key={index}>
                  <div className="activity-icon">
                    <Icon size={17} />
                  </div>

                  <div className="activity-content">
                    <strong>{item.title}</strong>
                    <span>
                      <Clock3 size={13} />
                      {item.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOURNAMENT OVERVIEW */}
        <div className="dashboard-panel overview-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                <Trophy size={17} />
                Tournament Overview
              </div>

              <div className="panel-subtitle">Current competition status</div>
            </div>
          </div>

          <div className="overview-stat-row">
            <div className="overview-stat">
              <strong>08</strong>
              <span>Active</span>
            </div>

            <div className="overview-stat">
              <strong>03</strong>
              <span>Upcoming</span>
            </div>

            <div className="overview-stat">
              <strong>21</strong>
              <span>Completed</span>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-header">
              <span>Season Progress</span>
              <strong>72%</strong>
            </div>

            <div className="progress-bar">
              <span style={{ width: "72%" }} />
            </div>

            <div className="progress-footer">
              <span>72 matches completed</span>
              <span>24 remaining</span>
            </div>
          </div>

          <button
            className="overview-button"
            onClick={() => navigate("/tournaments")}
          >
            Manage Tournaments
            <ArrowUpRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
