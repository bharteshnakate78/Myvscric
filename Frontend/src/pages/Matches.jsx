import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  CalendarDays,
  MapPin,
  Trophy,
  Users,
  Clock3,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Shield,
} from "lucide-react";

import { matchAPI, teamAPI, tournamentAPI } from "../services/api";

/* =========================================================
   DEFAULT MATCH
========================================================= */

const emptyMatch = {
  id: null,

  name: "",

  tournamentId: "",

  team1Id: "",
  team2Id: "",

  team1: "",
  team2: "",

  matchDate: "",
  time: "",

  venue: "",

  matchType: "LEAGUE",

  status: "SCHEDULED",

  overs: 20,

  team1Score: "",
  team2Score: "",

  result: "",

  toss: "",
};

/* =========================================================
   ROLE HELPERS
========================================================= */

const getStoredUser = () => {
  try {
    const user = localStorage.getItem("user");

    if (!user) {
      return null;
    }

    return JSON.parse(user);
  } catch {
    return null;
  }
};

const getRole = () => {
  const user = getStoredUser();

  return String(user?.role || "").toLowerCase();
};

const canManageMatches = () => {
  const role = getRole();

  return role === "admin" || role === "organizer" || role === "scorer";
};

/* =========================================================
   ARRAY EXTRACTOR
========================================================= */

function extractArray(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.matches)) {
    return data.matches;
  }

  if (Array.isArray(data?.teams)) {
    return data.teams;
  }

  if (Array.isArray(data?.tournaments)) {
    return data.tournaments;
  }

  return [];
}

/* =========================================================
   NORMALIZE TOURNAMENT
========================================================= */

function normalizeTournament(tournament) {
  if (!tournament) {
    return null;
  }

  const name =
    tournament.name ||
    tournament.tournamentName ||
    tournament.tournament_name ||
    "";

  return {
    ...tournament,

    id: tournament.id,

    name: String(name).trim(),
  };
}

/* =========================================================
   NORMALIZE TEAM
========================================================= */

function normalizeTeam(team) {
  if (!team) {
    return null;
  }

  const name = team.name || team.teamName || team.team_name || "";

  return {
    ...team,

    id: team.id,

    name: String(name).trim(),
  };
}

/* =========================================================
   NORMALIZE MATCH
========================================================= */

function normalizeMatch(match) {
  if (!match) {
    return null;
  }

  const tournament = match.tournament || match.tournamentDetails || null;

  const team1 = match.team1 || match.teamA || match.homeTeam || null;

  const team2 = match.team2 || match.teamB || match.awayTeam || null;

  const tournamentId = match.tournamentId || tournament?.id || "";

  const team1Id =
    match.team1Id || match.teamAId || match.homeTeamId || team1?.id || "";

  const team2Id =
    match.team2Id || match.teamBId || match.awayTeamId || team2?.id || "";

  return {
    ...match,

    id: match.id,

    name: match.name || match.matchName || "",

    tournamentId,

    tournamentName:
      match.tournamentName ||
      tournament?.name ||
      tournament?.tournamentName ||
      "",

    team1Id,

    team2Id,

    team1Name:
      match.team1Name ||
      match.teamAName ||
      team1?.name ||
      team1?.teamName ||
      "",

    team2Name:
      match.team2Name ||
      match.teamBName ||
      team2?.name ||
      team2?.teamName ||
      "",

    matchDate: match.matchDate || match.date || "",

    time: match.time || "",

    venue: match.venue || "",

    matchType: match.matchType || match.type || "LEAGUE",

    status: match.status || "SCHEDULED",

    overs: match.overs ?? 20,

    team1Score: match.team1Score ?? "",

    team2Score: match.team2Score ?? "",

    result: match.result || "",

    winner: match.winner || "",

    toss: match.toss || "",
  };
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Matches() {
  const [matches, setMatches] = useState([]);

  const [teams, setTeams] = useState([]);

  const [tournaments, setTournaments] = useState([]);

  const [loading, setLoading] = useState(true);

  const [teamsLoading, setTeamsLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [tournamentFilter, setTournamentFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyMatch);

  /* =======================================================
     LOAD MATCHES + TOURNAMENTS
  ======================================================= */

  const loadData = async () => {
    try {
      setLoading(true);

      setError("");

      const [matchResponse, tournamentResponse] = await Promise.all([
        matchAPI.getAll(),
        tournamentAPI.getAll(),
      ]);

      const matchData = extractArray(matchResponse)
        .map(normalizeMatch)
        .filter(Boolean);

      const tournamentData = extractArray(tournamentResponse)
        .map(normalizeTournament)
        .filter((item) => item && item.id && item.name);

      setMatches(matchData);

      setTournaments(tournamentData);

      /*
       * Important:
       *
       * We do NOT load all teams here.
       *
       * Teams are loaded according to the
       * selected tournament.
       */

      setTeams([]);
    } catch (err) {
      console.error("Failed to load match data:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to load matches and tournaments.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD TEAMS FOR TOURNAMENT
  ======================================================= */

  const loadTeamsForTournament = async (tournamentId) => {
    if (!tournamentId) {
      setTeams([]);

      return [];
    }

    try {
      setTeamsLoading(true);

      setError("");

      console.log("Loading teams for tournament:", tournamentId);

      const response = await teamAPI.getByTournament(tournamentId);

      console.log("Tournament teams response:", response?.data);

      const teamData = extractArray(response)
        .map(normalizeTeam)
        .filter((team) => team && team.id && team.name);

      setTeams(teamData);

      return teamData;
    } catch (err) {
      console.error("Failed to load tournament teams:", err);

      setTeams([]);

      setError(
        err?.response?.data?.message ||
          "Failed to load teams for this tournament.",
      );

      return [];
    } finally {
      setTeamsLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadData();
  }, []);

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,

      [name]: value,
    }));
  };

  /* =======================================================
     TOURNAMENT CHANGE
  ======================================================= */

  const handleTournamentChange = async (event) => {
    const tournamentId = event.target.value;

    setForm((previous) => ({
      ...previous,

      tournamentId,

      team1Id: "",
      team2Id: "",

      team1: "",
      team2: "",
    }));

    setTeams([]);

    if (tournamentId) {
      await loadTeamsForTournament(tournamentId);
    }
  };

  /* =======================================================
     OPEN CREATE MODAL
  ======================================================= */

  const openCreateModal = () => {
    setEditingId(null);

    setForm({
      ...emptyMatch,
    });

    setTeams([]);

    setError("");

    setSuccess("");

    setModalOpen(true);
  };

  /* =======================================================
     OPEN EDIT MODAL
  ======================================================= */

  const openEditModal = async (match) => {
    setEditingId(match.id);

    setError("");

    setSuccess("");

    const tournamentId = match.tournamentId || "";

    /*
     * Load teams first because teams are now
     * tournament-specific.
     */

    let loadedTeams = [];

    if (tournamentId) {
      loadedTeams = await loadTeamsForTournament(tournamentId);
    }

    const team1Id = match.team1Id ? String(match.team1Id) : "";

    const team2Id = match.team2Id ? String(match.team2Id) : "";

    /*
     * Find team names from loaded teams.
     */

    const team1 = loadedTeams.find((team) => String(team.id) === team1Id);

    const team2 = loadedTeams.find((team) => String(team.id) === team2Id);

    setForm({
      id: match.id,

      name: match.name || "",

      tournamentId,

      team1Id,

      team2Id,

      team1: team1?.name || match.team1Name || "",

      team2: team2?.name || match.team2Name || "",

      matchDate: match.matchDate || "",

      time: match.time || "",

      venue: match.venue || "",

      matchType: match.matchType || "LEAGUE",

      status: match.status || "SCHEDULED",

      overs: match.overs ?? 20,

      team1Score: match.team1Score ?? "",

      team2Score: match.team2Score ?? "",

      result: match.result || "",

      toss: match.toss || "",
    });

    setModalOpen(true);
  };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingId(null);

    setForm({
      ...emptyMatch,
    });

    setTeams([]);

    setError("");
  };

  /* =======================================================
     SAVE MATCH
  ======================================================= */

  const handleSave = async (event) => {
    event.preventDefault();

    setError("");

    setSuccess("");

    const tournamentId = form.tournamentId;

    const team1Id = form.team1Id;

    const team2Id = form.team2Id;

    /* -----------------------------------------------
       VALIDATION
    ------------------------------------------------ */

    if (!tournamentId) {
      setError("Please select a tournament.");

      return;
    }

    if (!team1Id) {
      setError("Please select Team 1.");

      return;
    }

    if (!team2Id) {
      setError("Please select Team 2.");

      return;
    }

    if (String(team1Id) === String(team2Id)) {
      setError("Team 1 and Team 2 must be different.");

      return;
    }

    if (!form.matchDate) {
      setError("Please select match date.");

      return;
    }

    /* -----------------------------------------------
       FIND TEAM NAMES
    ------------------------------------------------ */

    const team1 = teams.find((team) => String(team.id) === String(team1Id));

    const team2 = teams.find((team) => String(team.id) === String(team2Id));

    /* -----------------------------------------------
       PAYLOAD
    ------------------------------------------------ */

    const payload = {
      name:
        form.name?.trim() ||
        `${team1?.name || "Team 1"} vs ${team2?.name || "Team 2"}`,

      tournamentId: Number(tournamentId),

      teamAId: Number(team1Id),

      teamBId: Number(team2Id),

      matchDate: form.matchDate,

      time: form.time || null,

      venue: form.venue?.trim() || null,

      matchType: form.matchType || "LEAGUE",

      status: form.status || "SCHEDULED",

      overs: form.overs ? Number(form.overs) : 20,

      team1Score: form.team1Score === "" ? null : Number(form.team1Score),

      team2Score: form.team2Score === "" ? null : Number(form.team2Score),

      result: form.result?.trim() || null,

      toss: form.toss?.trim() || null,
    };

    console.log("MATCH PAYLOAD:", payload);

    /* -----------------------------------------------
       API CALL
    ------------------------------------------------ */

    try {
      setSaving(true);

      if (editingId) {
        await matchAPI.update(editingId, payload);

        setSuccess("Match updated successfully.");
      } else {
        await matchAPI.create(payload);

        setSuccess("Match created successfully.");
      }

      /* ---------------------------------------------
         REFRESH DATA
      ---------------------------------------------- */

      await loadData();

      setTeams([]);

      setForm({
        ...emptyMatch,
      });

      setEditingId(null);

      /*
       * Keep modal open briefly so success
       * message can be seen.
       */

      setTimeout(() => {
        setModalOpen(false);

        setSuccess("");
      }, 700);
    } catch (err) {
      console.error("Save match error:", err);

      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data;

      setError(
        typeof backendMessage === "string"
          ? backendMessage
          : "Failed to save match.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE MATCH
  ======================================================= */

  const handleDelete = async (id) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this match?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await matchAPI.delete(id);

      setMatches((previous) =>
        previous.filter((match) => String(match.id) !== String(id)),
      );

      setSuccess("Match deleted successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Delete match error:", err);

      setError(err?.response?.data?.message || "Failed to delete match.");
    }
  };

  /* =======================================================
     FILTER MATCHES
  ======================================================= */

  const filteredMatches = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return matches.filter((match) => {
      const matchesSearch =
        !searchValue ||
        String(match.name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(match.team1Name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(match.team2Name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(match.venue || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" ||
        String(match.status).toUpperCase() === statusFilter;

      const matchesTournament =
        tournamentFilter === "ALL" ||
        String(match.tournamentId) === String(tournamentFilter);

      return matchesSearch && matchesStatus && matchesTournament;
    });
  }, [matches, search, statusFilter, tournamentFilter]);

  /* =======================================================
     STATS
  ======================================================= */

  const totalMatches = matches.length;

  const scheduledMatches = matches.filter(
    (match) => String(match.status).toUpperCase() === "SCHEDULED",
  ).length;

  const liveMatches = matches.filter(
    (match) => String(match.status).toUpperCase() === "LIVE",
  ).length;

  const completedMatches = matches.filter(
    (match) => String(match.status).toUpperCase() === "COMPLETED",
  ).length;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="matches-page">
        <div className="matches-loading">
          <RefreshCw size={28} className="spin" />

          <span>Loading matches...</span>
        </div>

        <style>{`
          .matches-page {
            min-height: 100vh;
            padding: 32px;
            background:
              radial-gradient(
                circle at top right,
                rgba(163,230,53,.08),
                transparent 35%
              ),
              #07090c;
            color: #fff;
          }

          .matches-loading {
            min-height: 70vh;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            font-size: 16px;
            color: #a7adb7;
          }

          .spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="matches-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="page-header">
        <div>
          <div className="eyebrow">
            <Trophy size={15} />
            MATCH CENTER
          </div>

          <h1>Matches</h1>

          <p>Create, schedule and manage tournament matches.</p>
        </div>

        <div className="header-actions">
          <button className="refresh-btn" onClick={loadData} disabled={loading}>
            <RefreshCw size={17} />
            Refresh
          </button>

          {canManageMatches() && (
            <button className="primary-btn" onClick={openCreateModal}>
              <Plus size={18} />
              Create Match
            </button>
          )}
        </div>
      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {error && (
        <div className="alert error">
          <AlertCircle size={18} />

          <span>{error}</span>

          <button onClick={() => setError("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert success">
          <CheckCircle2 size={18} />

          <span>{success}</span>
        </div>
      )}

      {/* =================================================
          STAT CARDS
      ================================================= */}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <CalendarDays size={20} />
          </div>

          <div>
            <span>Total Matches</span>

            <strong>{totalMatches}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Scheduled</span>

            <strong>{scheduledMatches}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon live">
            <span />
          </div>

          <div>
            <span>Live</span>

            <strong>{liveMatches}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Completed</span>

            <strong>{completedMatches}</strong>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTER BAR
      ================================================= */}

      <div className="filter-card">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search matches, teams or venue..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={tournamentFilter}
          onChange={(event) => setTournamentFilter(event.target.value)}
        >
          <option value="ALL">All Tournaments</option>

          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All Status</option>

          <option value="SCHEDULED">Scheduled</option>

          <option value="LIVE">Live</option>

          <option value="COMPLETED">Completed</option>

          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* =================================================
          MATCH LIST
      ================================================= */}

      <div className="matches-card">
        <div className="table-header">
          <div>Match</div>

          <div>Tournament</div>

          <div>Date & Time</div>

          <div>Venue</div>

          <div>Status</div>

          <div>Action</div>
        </div>

        {filteredMatches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Trophy size={30} />
            </div>

            <h3>No matches found</h3>

            <p>Create a match or change your filters.</p>

            {canManageMatches() && (
              <button className="primary-btn" onClick={openCreateModal}>
                <Plus size={17} />
                Create Match
              </button>
            )}
          </div>
        ) : (
          filteredMatches.map((match) => (
            <div className="match-row" key={match.id}>
              <div className="match-info">
                <strong>
                  {match.name || `${match.team1Name} vs ${match.team2Name}`}
                </strong>

                <div className="teams">
                  <span>{match.team1Name || "Team 1"}</span>

                  <b>VS</b>

                  <span>{match.team2Name || "Team 2"}</span>
                </div>

                {String(match.status).toUpperCase() === "COMPLETED" &&
                  match.result && (
                    <div className="completed-result">
                      <Trophy size={14} />
                      <span>{match.result}</span>
                    </div>
                  )}
              </div>

              <div className="tournament-name">
                <Trophy size={15} />

                {match.tournamentName || "Tournament"}
              </div>

              <div className="date-info">
                <strong>{match.matchDate || "-"}</strong>

                {match.time && (
                  <span>
                    <Clock3 size={13} />

                    {match.time}
                  </span>
                )}
              </div>

              <div className="venue">
                <MapPin size={15} />

                <span>{match.venue || "TBA"}</span>
              </div>

              <div>
                <span
                  className={`status ${String(
                    match.status || "",
                  ).toLowerCase()}`}
                >
                  {match.status || "SCHEDULED"}
                </span>
              </div>

              <div className="row-actions">
                {canManageMatches() && (
                  <>
                    <button
                      className="icon-btn"
                      title="Edit"
                      onClick={() => openEditModal(match)}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      className="icon-btn danger"
                      title="Delete"
                      onClick={() => handleDelete(match.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* =================================================
          CREATE / EDIT MODAL
      ================================================= */}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-eyebrow">
                  <Shield size={14} />
                  MATCH MANAGEMENT
                </div>

                <h2>{editingId ? "Edit Match" : "Create Match"}</h2>

                <p>
                  Select a tournament first. Teams will automatically load for
                  that tournament.
                </p>
              </div>

              <button
                className="close-btn"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="modal-error">
                <AlertCircle size={17} />

                {error}
              </div>
            )}

            {success && (
              <div className="modal-success">
                <CheckCircle2 size={17} />

                {success}
              </div>
            )}

            <form onSubmit={handleSave} className="match-form">
              {/* -----------------------------------------
                  MATCH NAME
              ------------------------------------------ */}

              <div className="form-group full">
                <label>Match Name</label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Example: Semi Final 1"
                />
              </div>

              {/* -----------------------------------------
                  TOURNAMENT
              ------------------------------------------ */}

              <div className="form-group full">
                <label>
                  Tournament
                  <span>*</span>
                </label>

                <select
                  name="tournamentId"
                  value={form.tournamentId}
                  onChange={handleTournamentChange}
                >
                  <option value="">Select Tournament</option>

                  {tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* -----------------------------------------
                  TEAMS
              ------------------------------------------ */}

              <div className="team-selection">
                <div className="team-box">
                  <label>
                    Team 1<span>*</span>
                  </label>

                  <div className="select-wrapper">
                    <Users size={16} />

                    <select
                      name="team1Id"
                      value={form.team1Id}
                      onChange={handleChange}
                      disabled={
                        !form.tournamentId || teamsLoading || teams.length === 0
                      }
                    >
                      <option value="">
                        {!form.tournamentId
                          ? "Select tournament first"
                          : teamsLoading
                            ? "Loading teams..."
                            : teams.length === 0
                              ? "No teams available"
                              : "Select Team 1"}
                      </option>

                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="vs-box">VS</div>

                <div className="team-box">
                  <label>
                    Team 2<span>*</span>
                  </label>

                  <div className="select-wrapper">
                    <Users size={16} />

                    <select
                      name="team2Id"
                      value={form.team2Id}
                      onChange={handleChange}
                      disabled={
                        !form.tournamentId || teamsLoading || teams.length === 0
                      }
                    >
                      <option value="">
                        {!form.tournamentId
                          ? "Select tournament first"
                          : teamsLoading
                            ? "Loading teams..."
                            : teams.length === 0
                              ? "No teams available"
                              : "Select Team 2"}
                      </option>

                      {teams.map((team) => (
                        <option
                          key={team.id}
                          value={team.id}
                          disabled={String(team.id) === String(form.team1Id)}
                        >
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* -----------------------------------------
                  TEAM STATUS MESSAGE
              ------------------------------------------ */}

              {form.tournamentId && (
                <div className="team-status">
                  {teamsLoading ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      Loading teams for selected tournament...
                    </>
                  ) : teams.length === 0 ? (
                    <>
                      <AlertCircle size={15} />
                      No teams found for this tournament. Create/assign teams to
                      this tournament first.
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      {teams.length} team
                      {teams.length !== 1 ? "s" : ""} available for this
                      tournament.
                    </>
                  )}
                </div>
              )}

              {/* -----------------------------------------
                  DATE / TIME
              ------------------------------------------ */}

              <div className="form-group">
                <label>
                  Match Date
                  <span>*</span>
                </label>

                <input
                  type="date"
                  name="matchDate"
                  value={form.matchDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Time</label>

                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                />
              </div>

              {/* -----------------------------------------
                  VENUE
              ------------------------------------------ */}

              <div className="form-group">
                <label>Venue</label>

                <input
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  placeholder="Stadium / Ground"
                />
              </div>

              {/* -----------------------------------------
                  MATCH TYPE
              ------------------------------------------ */}

              <div className="form-group">
                <label>Match Type</label>

                <select
                  name="matchType"
                  value={form.matchType}
                  onChange={handleChange}
                >
                  <option value="LEAGUE">League</option>

                  <option value="QUARTER_FINAL">Quarter Final</option>

                  <option value="SEMI_FINAL">Semi Final</option>

                  <option value="FINAL">Final</option>

                  <option value="FRIENDLY">Friendly</option>
                </select>
              </div>

              {/* -----------------------------------------
                  OVERS
              ------------------------------------------ */}

              <div className="form-group">
                <label>Overs</label>

                <input
                  type="number"
                  name="overs"
                  min="1"
                  max="100"
                  value={form.overs}
                  onChange={handleChange}
                />
              </div>

              {/* -----------------------------------------
                  STATUS
              ------------------------------------------ */}

              <div className="form-group">
                <label>Status</label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="SCHEDULED">Scheduled</option>

                  <option value="LIVE">Live</option>

                  <option value="UPCOMING">Upcoming</option>

                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* -----------------------------------------
                  TOSS
              ------------------------------------------ */}

              {/* <div className="form-group full">
                <label>Toss</label>

                <input
                  type="text"
                  name="toss"
                  value={form.toss}
                  onChange={handleChange}
                  placeholder="Example: Mumbai Warriors won toss and elected to bat"
                />
              </div> */}

              {/* -----------------------------------------
                  RESULT
              ------------------------------------------ */}

              {/* <div className="form-group full">
                <label>Result</label>

                <input
                  type="text"
                  name="result"
                  value={form.result}
                  onChange={handleChange}
                  placeholder="Example: Mumbai Warriors won by 5 wickets"
                />
              </div> */}

              {/* -----------------------------------------
                  SCORES
              ------------------------------------------ */}
              {/*
              <div className="form-group">
                <label>Team 1 Score</label>

                <input
                  type="number"
                  min="0"
                  name="team1Score"
                  value={form.team1Score}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label>Team 2 Score</label>

                <input
                  type="number"
                  min="0"
                  name="team2Score"
                  value={form.team2Score}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div> */}

              {/* -----------------------------------------
                  FOOTER
              ------------------------------------------ */}

              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-btn save-btn"
                  disabled={
                    saving ||
                    teamsLoading ||
                    !form.tournamentId ||
                    !form.team1Id ||
                    !form.team2Id ||
                    teams.length < 2
                  }
                >
                  {saving ? (
                    <>
                      <RefreshCw size={17} className="spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />

                      {editingId ? "Update Match" : "Create Match"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          CSS
      ================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .matches-page {
          min-height: 100vh;
          padding: 30px;
          color: #f7f8fa;

          background:
            radial-gradient(
              circle at 90% 0%,
              rgba(163,230,53,.09),
              transparent 32%
            ),
            radial-gradient(
              circle at 10% 30%,
              rgba(59,130,246,.05),
              transparent 30%
            ),
            #07090c;
        }

        /* HEADER */

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 25px;
          margin-bottom: 28px;
        }

        .eyebrow,
        .modal-eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #a3e635;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .14em;
          margin-bottom: 8px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 34px;
          font-weight: 850;
          letter-spacing: -.04em;
        }

        .page-header p {
          margin: 7px 0 0;
          color: #858d99;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        /* BUTTONS */

        .primary-btn,
        .refresh-btn,
        .cancel-btn {
          border: 0;
          border-radius: 11px;
          padding: 11px 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 750;
          transition:
            transform .18s ease,
            opacity .18s ease,
            background .18s ease;
        }

        .primary-btn {
          background: #a3e635;
          color: #10140b;
          box-shadow:
            0 8px 30px
            rgba(163,230,53,.14);
        }

        .primary-btn:hover {
          transform: translateY(-1px);
          background: #b4ef50;
        }

        .refresh-btn,
        .cancel-btn {
          background: #11151b;
          border: 1px solid #232a33;
          color: #c5cbd4;
        }

        .refresh-btn:hover,
        .cancel-btn:hover {
          background: #181d24;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        /* ALERT */

        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 15px;
          border-radius: 12px;
          margin-bottom: 18px;
          border: 1px solid;
          font-size: 13px;
        }

        .alert button {
          margin-left: auto;
          background: transparent;
          border: 0;
          color: inherit;
          cursor: pointer;
        }

        .alert.error {
          background: rgba(239,68,68,.08);
          border-color: rgba(239,68,68,.2);
          color: #fca5a5;
        }

        .alert.success {
          background: rgba(34,197,94,.08);
          border-color: rgba(34,197,94,.2);
          color: #86efac;
        }

        /* STATS */

        .stats-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 18px;
          border-radius: 15px;

          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.045),
              rgba(255,255,255,.018)
            );

          border: 1px solid #1d242d;
        }

        .stat-icon {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(163,230,53,.09);
          color: #a3e635;
        }

        .stat-icon.live {
          position: relative;
        }

        .stat-icon.live span {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow:
            0 0 0 5px
            rgba(239,68,68,.1);
        }

        .stat-card span {
          display: block;
          color: #7e8793;
          font-size: 12px;
          margin-bottom: 3px;
        }

        .stat-card strong {
          font-size: 23px;
          letter-spacing: -.03em;
        }

        /* FILTER */

        .filter-card {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }

        .search-box {
          flex: 1;
          min-width: 220px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 13px;
          border-radius: 11px;
          background: #0d1116;
          border: 1px solid #202730;
          color: #69727f;
        }

        .search-box input {
          width: 100%;
          height: 43px;
          background: transparent;
          border: 0;
          outline: 0;
          color: #fff;
          font-size: 13px;
        }

        .filter-card select {
          min-width: 170px;
          height: 43px;
          padding: 0 12px;
          border-radius: 11px;
          border: 1px solid #202730;
          background: #0d1116;
          color: #cbd1d9;
          outline: 0;
        }

        /* MATCH TABLE */

        .matches-card {
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid #1c232c;
          background: rgba(10,13,17,.78);
        }

        .table-header,
        .match-row {
          display: grid;
          grid-template-columns:
            2fr
            1.15fr
            1fr
            1.15fr
            .8fr
            .65fr;
          gap: 18px;
          align-items: center;
          padding: 15px 18px;
        }

        .table-header {
          background: #0e1217;
          color: #6e7784;
          text-transform: uppercase;
          letter-spacing: .08em;
          font-size: 10px;
          font-weight: 800;
          border-bottom: 1px solid #1c232c;
        }

        .match-row {
          min-height: 86px;
          border-bottom: 1px solid #181e26;
          transition: background .18s ease;
        }

        .match-row:last-child {
          border-bottom: 0;
        }

        .match-row:hover {
          background: rgba(255,255,255,.018);
        }

        .match-info strong {
          display: block;
          font-size: 13px;
          margin-bottom: 7px;
        }

        .teams {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #aab1bb;
          font-size: 12px;
        }

        .teams b {
          color: #59616d;
          font-size: 9px;
        }

        .tournament-name,
        .venue {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #a7afb9;
          font-size: 12px;
        }

        .tournament-name svg {
          color: #a3e635;
        }

        .venue svg {
          color: #6f7885;
          flex-shrink: 0;
        }

        .date-info strong {
          display: block;
          font-size: 12px;
        }

        .date-info span {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #727b87;
          margin-top: 4px;
          font-size: 11px;
        }



        .completed-result {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 9px;
          color: #86efac;
          font-size: 12px;
          font-weight: 750;
          line-height: 1.35;
        }

        .completed-result svg {
          flex-shrink: 0;
          color: #4ade80;
        }

        /* STATUS */

        .status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .05em;
          text-transform: uppercase;
          background: #171c22;
          color: #9da5b0;
        }

        .status.scheduled {
          background: rgba(59,130,246,.1);
          color: #93c5fd;
        }

        .status.live {
          background: rgba(239,68,68,.1);
          color: #fca5a5;
        }

        .status.completed {
          background: rgba(34,197,94,.1);
          color: #86efac;
        }

        .status.cancelled {
          background: rgba(148,163,184,.1);
          color: #94a3b8;
        }

        /* ACTIONS */

        .row-actions {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
        }

        .icon-btn {
          width: 33px;
          height: 33px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          border: 1px solid #242b34;
          background: #11161c;
          color: #aeb5bf;
          cursor: pointer;
        }

        .icon-btn:hover {
          background: #1a2027;
          color: #fff;
        }

        .icon-btn.danger:hover {
          color: #f87171;
          border-color: rgba(248,113,113,.25);
        }

        /* EMPTY */

        .empty-state {
          padding: 70px 20px;
          text-align: center;
          color: #78818d;
        }

        .empty-icon {
          width: 62px;
          height: 62px;
          margin: auto;
          display: grid;
          place-items: center;
          border-radius: 18px;
          color: #a3e635;
          background: rgba(163,230,53,.08);
        }

        .empty-state h3 {
          margin: 16px 0 7px;
          color: #fff;
        }

        .empty-state p {
          margin: 0 0 18px;
          font-size: 13px;
        }

        /* MODAL */

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;

          background:
            rgba(0,0,0,.72);

          backdrop-filter:
            blur(10px);
        }

        .modal {
          width: min(760px, 100%);
          max-height: 92vh;
          overflow-y: auto;

          border-radius: 20px;

          background:
            linear-gradient(
              145deg,
              #10151b,
              #090c10
            );

          border: 1px solid #252d37;

          box-shadow:
            0 30px 100px
            rgba(0,0,0,.55);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 23px 24px;
          border-bottom: 1px solid #202731;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 22px;
        }

        .modal-header p {
          margin: 6px 0 0;
          color: #727b87;
          font-size: 12px;
          line-height: 1.5;
        }

        .close-btn {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border: 1px solid #252c35;
          border-radius: 10px;
          background: #11161c;
          color: #9aa2ad;
          cursor: pointer;
        }

        .close-btn:hover {
          color: #fff;
          background: #181d23;
        }

        /* MODAL ALERTS */

        .modal-error,
        .modal-success {
          margin: 16px 24px 0;
          padding: 11px 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 10px;
          font-size: 12px;
        }

        .modal-error {
          color: #fca5a5;
          background: rgba(239,68,68,.08);
          border: 1px solid rgba(239,68,68,.18);
        }

        .modal-success {
          color: #86efac;
          background: rgba(34,197,94,.08);
          border: 1px solid rgba(34,197,94,.18);
        }

        /* FORM */

        .match-form {
          padding: 22px 24px 24px;
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .form-group {
          min-width: 0;
        }

        .form-group.full {
          grid-column: 1 / -1;
        }

        .form-group label,
        .team-box label {
          display: block;
          margin-bottom: 7px;
          color: #aab2bd;
          font-size: 11px;
          font-weight: 750;
        }

        .form-group label span,
        .team-box label span {
          color: #a3e635;
          margin-left: 3px;
        }

        .form-group input,
        .form-group select,
        .team-box select {
          width: 100%;
          height: 43px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid #252d37;
          outline: none;
          background: #0c1015;
          color: #f2f4f7;
          font-size: 12px;
          transition:
            border-color .18s ease,
            box-shadow .18s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .team-box select:focus {
          border-color: rgba(163,230,53,.5);
          box-shadow:
            0 0 0 3px
            rgba(163,230,53,.07);
        }

        .form-group input::placeholder {
          color: #525b67;
        }

        /* TEAM SELECTION */

        .team-selection {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            48px
            minmax(0, 1fr);
          align-items: end;
          gap: 10px;
          padding: 15px;
          border-radius: 14px;
          border: 1px solid #202832;
          background: rgba(255,255,255,.018);
        }

        .team-box {
          min-width: 0;
        }

        .select-wrapper {
          position: relative;
        }

        .select-wrapper svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #727b87;
          pointer-events: none;
          z-index: 1;
        }

        .team-box select {
          padding-left: 38px;
        }

        .vs-box {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(163,230,53,.08);
          border: 1px solid rgba(163,230,53,.18);
          color: #a3e635;
          font-size: 10px;
          font-weight: 900;
          margin-bottom: 1px;
        }

        .team-status {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: -4px;
          color: #77818d;
          font-size: 11px;
        }

        .team-status svg {
          color: #a3e635;
        }

        /* FOOTER */

        .modal-footer {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding-top: 7px;
          border-top: 1px solid #202731;
          margin-top: 3px;
        }

        .save-btn {
          min-width: 145px;
        }

        /* SCROLLBAR */

        .modal::-webkit-scrollbar {
          width: 7px;
        }

        .modal::-webkit-scrollbar-track {
          background: #090c10;
        }

        .modal::-webkit-scrollbar-thumb {
          background: #252d37;
          border-radius: 10px;
        }

        /* SPIN */

        .spin {
          animation:
            spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* RESPONSIVE */

        @media (max-width: 1100px) {

          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .table-header {
            display: none;
          }

          .match-row {
            grid-template-columns:
              1fr 1fr;
            gap: 13px;
          }

          .row-actions {
            justify-content: flex-start;
          }

        }

        @media (max-width: 700px) {

          .matches-page {
            padding: 18px;
          }

          .page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions button {
            flex: 1;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .filter-card {
            flex-direction: column;
          }

          .filter-card select {
            width: 100%;
          }

          .match-row {
            grid-template-columns: 1fr;
          }

          .team-selection {
            grid-template-columns: 1fr;
          }

          .vs-box {
            margin: auto;
          }

          .match-form {
            grid-template-columns: 1fr;
          }

          .form-group.full,
          .team-selection,
          .modal-footer {
            grid-column: 1;
          }

        }

      `}</style>
    </div>
  );
}

// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Plus,
//   Search,
//   Edit3,
//   Trash2,
//   X,
//   CalendarDays,
//   MapPin,
//   Trophy,
//   Users,
//   Clock3,
//   RefreshCw,
//   AlertCircle,
//   CheckCircle2,
//   Shield,
// } from "lucide-react";

// import { matchAPI, teamAPI, tournamentAPI } from "../services/api";

// /* =========================================================
//    DEFAULT MATCH
// ========================================================= */

// const emptyMatch = {
//   id: null,

//   name: "",

//   tournamentId: "",

//   team1Id: "",
//   team2Id: "",

//   team1: "",
//   team2: "",

//   matchDate: "",
//   time: "",

//   venue: "",

//   matchType: "LEAGUE",

//   status: "SCHEDULED",

//   overs: 20,

//   team1Score: "",
//   team2Score: "",

//   result: "",

//   toss: "",
// };

// /* =========================================================
//    ROLE HELPERS
// ========================================================= */

// const getStoredUser = () => {
//   try {
//     const user = localStorage.getItem("user");

//     if (!user) {
//       return null;
//     }

//     return JSON.parse(user);
//   } catch {
//     return null;
//   }
// };

// const getRole = () => {
//   const user = getStoredUser();

//   return String(user?.role || "").toLowerCase();
// };

// const canManageMatches = () => {
//   const role = getRole();

//   return role === "admin" || role === "organizer" || role === "scorer";
// };

// /* =========================================================
//    ARRAY EXTRACTOR
// ========================================================= */

// function extractArray(response) {
//   const data = response?.data ?? response;

//   if (Array.isArray(data)) {
//     return data;
//   }

//   if (Array.isArray(data?.content)) {
//     return data.content;
//   }

//   if (Array.isArray(data?.data)) {
//     return data.data;
//   }

//   if (Array.isArray(data?.items)) {
//     return data.items;
//   }

//   if (Array.isArray(data?.matches)) {
//     return data.matches;
//   }

//   if (Array.isArray(data?.teams)) {
//     return data.teams;
//   }

//   if (Array.isArray(data?.tournaments)) {
//     return data.tournaments;
//   }

//   return [];
// }

// /* =========================================================
//    NORMALIZE TOURNAMENT
// ========================================================= */

// function normalizeTournament(tournament) {
//   if (!tournament) {
//     return null;
//   }

//   const name =
//     tournament.name ||
//     tournament.tournamentName ||
//     tournament.tournament_name ||
//     "";

//   return {
//     ...tournament,

//     id: tournament.id,

//     name: String(name).trim(),
//   };
// }

// /* =========================================================
//    NORMALIZE TEAM
// ========================================================= */

// function normalizeTeam(team) {
//   if (!team) {
//     return null;
//   }

//   const name = team.name || team.teamName || team.team_name || "";

//   return {
//     ...team,

//     id: team.id,

//     name: String(name).trim(),
//   };
// }

// /* =========================================================
//    NORMALIZE MATCH
// ========================================================= */

// function normalizeMatch(match) {
//   if (!match) {
//     return null;
//   }

//   const tournament = match.tournament || match.tournamentDetails || null;

//   const team1 = match.team1 || match.teamA || match.homeTeam || null;

//   const team2 = match.team2 || match.teamB || match.awayTeam || null;

//   const tournamentId = match.tournamentId || tournament?.id || "";

//   const team1Id =
//     match.team1Id || match.teamAId || match.homeTeamId || team1?.id || "";

//   const team2Id =
//     match.team2Id || match.teamBId || match.awayTeamId || team2?.id || "";

//   return {
//     ...match,

//     id: match.id,

//     name: match.name || match.matchName || "",

//     tournamentId,

//     tournamentName:
//       match.tournamentName ||
//       tournament?.name ||
//       tournament?.tournamentName ||
//       "",

//     team1Id,

//     team2Id,

//     team1Name:
//       match.team1Name ||
//       match.teamAName ||
//       team1?.name ||
//       team1?.teamName ||
//       "",

//     team2Name:
//       match.team2Name ||
//       match.teamBName ||
//       team2?.name ||
//       team2?.teamName ||
//       "",

//     matchDate: match.matchDate || match.date || "",

//     time: match.time || "",

//     venue: match.venue || "",

//     matchType: match.matchType || match.type || "LEAGUE",

//     status: match.status || "SCHEDULED",

//     overs: match.overs ?? 20,

//     team1Score: match.team1Score ?? "",

//     team2Score: match.team2Score ?? "",

//     result: match.result || "",

//     toss: match.toss || "",
//   };
// }

// /* =========================================================
//    MAIN COMPONENT
// ========================================================= */

// export default function Matches() {
//   const [matches, setMatches] = useState([]);

//   const [teams, setTeams] = useState([]);

//   const [tournaments, setTournaments] = useState([]);

//   const [loading, setLoading] = useState(true);

//   const [teamsLoading, setTeamsLoading] = useState(false);

//   const [saving, setSaving] = useState(false);

//   const [error, setError] = useState("");

//   const [success, setSuccess] = useState("");

//   const [search, setSearch] = useState("");

//   const [statusFilter, setStatusFilter] = useState("ALL");

//   const [tournamentFilter, setTournamentFilter] = useState("ALL");

//   const [modalOpen, setModalOpen] = useState(false);

//   const [editingId, setEditingId] = useState(null);

//   const [form, setForm] = useState(emptyMatch);

//   /* =======================================================
//      LOAD MATCHES + TOURNAMENTS
//   ======================================================= */

//   const loadData = async () => {
//     try {
//       setLoading(true);

//       setError("");

//       const [matchResponse, tournamentResponse] = await Promise.all([
//         matchAPI.getAll(),
//         tournamentAPI.getAll(),
//       ]);

//       const matchData = extractArray(matchResponse)
//         .map(normalizeMatch)
//         .filter(Boolean);

//       const tournamentData = extractArray(tournamentResponse)
//         .map(normalizeTournament)
//         .filter((item) => item && item.id && item.name);

//       setMatches(matchData);

//       setTournaments(tournamentData);

//       /*
//        * Important:
//        *
//        * We do NOT load all teams here.
//        *
//        * Teams are loaded according to the
//        * selected tournament.
//        */

//       setTeams([]);
//     } catch (err) {
//       console.error("Failed to load match data:", err);

//       setError(
//         err?.response?.data?.message ||
//           "Failed to load matches and tournaments.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* =======================================================
//      LOAD TEAMS FOR TOURNAMENT
//   ======================================================= */

//   const loadTeamsForTournament = async (tournamentId) => {
//     if (!tournamentId) {
//       setTeams([]);

//       return [];
//     }

//     try {
//       setTeamsLoading(true);

//       setError("");

//       console.log("Loading teams for tournament:", tournamentId);

//       const response = await teamAPI.getByTournament(tournamentId);

//       console.log("Tournament teams response:", response?.data);

//       const teamData = extractArray(response)
//         .map(normalizeTeam)
//         .filter((team) => team && team.id && team.name);

//       setTeams(teamData);

//       return teamData;
//     } catch (err) {
//       console.error("Failed to load tournament teams:", err);

//       setTeams([]);

//       setError(
//         err?.response?.data?.message ||
//           "Failed to load teams for this tournament.",
//       );

//       return [];
//     } finally {
//       setTeamsLoading(false);
//     }
//   };

//   /* =======================================================
//      INITIAL LOAD
//   ======================================================= */

//   useEffect(() => {
//     loadData();
//   }, []);

//   /* =======================================================
//      FORM CHANGE
//   ======================================================= */

//   const handleChange = (event) => {
//     const { name, value } = event.target;

//     setForm((previous) => ({
//       ...previous,

//       [name]: value,
//     }));
//   };

//   /* =======================================================
//      TOURNAMENT CHANGE
//   ======================================================= */

//   const handleTournamentChange = async (event) => {
//     const tournamentId = event.target.value;

//     setForm((previous) => ({
//       ...previous,

//       tournamentId,

//       team1Id: "",
//       team2Id: "",

//       team1: "",
//       team2: "",
//     }));

//     setTeams([]);

//     if (tournamentId) {
//       await loadTeamsForTournament(tournamentId);
//     }
//   };

//   /* =======================================================
//      OPEN CREATE MODAL
//   ======================================================= */

//   const openCreateModal = () => {
//     setEditingId(null);

//     setForm({
//       ...emptyMatch,
//     });

//     setTeams([]);

//     setError("");

//     setSuccess("");

//     setModalOpen(true);
//   };

//   /* =======================================================
//      OPEN EDIT MODAL
//   ======================================================= */

//   const openEditModal = async (match) => {
//     setEditingId(match.id);

//     setError("");

//     setSuccess("");

//     const tournamentId = match.tournamentId || "";

//     /*
//      * Load teams first because teams are now
//      * tournament-specific.
//      */

//     let loadedTeams = [];

//     if (tournamentId) {
//       loadedTeams = await loadTeamsForTournament(tournamentId);
//     }

//     const team1Id = match.team1Id ? String(match.team1Id) : "";

//     const team2Id = match.team2Id ? String(match.team2Id) : "";

//     /*
//      * Find team names from loaded teams.
//      */

//     const team1 = loadedTeams.find((team) => String(team.id) === team1Id);

//     const team2 = loadedTeams.find((team) => String(team.id) === team2Id);

//     setForm({
//       id: match.id,

//       name: match.name || "",

//       tournamentId,

//       team1Id,

//       team2Id,

//       team1: team1?.name || match.team1Name || "",

//       team2: team2?.name || match.team2Name || "",

//       matchDate: match.matchDate || "",

//       time: match.time || "",

//       venue: match.venue || "",

//       matchType: match.matchType || "LEAGUE",

//       status: match.status || "SCHEDULED",

//       overs: match.overs ?? 20,

//       team1Score: match.team1Score ?? "",

//       team2Score: match.team2Score ?? "",

//       result: match.result || "",

//       toss: match.toss || "",
//     });

//     setModalOpen(true);
//   };

//   /* =======================================================
//      CLOSE MODAL
//   ======================================================= */

//   const closeModal = () => {
//     if (saving) {
//       return;
//     }

//     setModalOpen(false);

//     setEditingId(null);

//     setForm({
//       ...emptyMatch,
//     });

//     setTeams([]);

//     setError("");
//   };

//   /* =======================================================
//      SAVE MATCH
//   ======================================================= */

//   const handleSave = async (event) => {
//     event.preventDefault();

//     setError("");

//     setSuccess("");

//     const tournamentId = form.tournamentId;

//     const team1Id = form.team1Id;

//     const team2Id = form.team2Id;

//     /* -----------------------------------------------
//        VALIDATION
//     ------------------------------------------------ */

//     if (!tournamentId) {
//       setError("Please select a tournament.");

//       return;
//     }

//     if (!team1Id) {
//       setError("Please select Team 1.");

//       return;
//     }

//     if (!team2Id) {
//       setError("Please select Team 2.");

//       return;
//     }

//     if (String(team1Id) === String(team2Id)) {
//       setError("Team 1 and Team 2 must be different.");

//       return;
//     }

//     if (!form.matchDate) {
//       setError("Please select match date.");

//       return;
//     }

//     /* -----------------------------------------------
//        FIND TEAM NAMES
//     ------------------------------------------------ */

//     const team1 = teams.find((team) => String(team.id) === String(team1Id));

//     const team2 = teams.find((team) => String(team.id) === String(team2Id));

//     /* -----------------------------------------------
//        PAYLOAD
//     ------------------------------------------------ */

//     const payload = {
//       name:
//         form.name?.trim() ||
//         `${team1?.name || "Team 1"} vs ${team2?.name || "Team 2"}`,

//       tournamentId: Number(tournamentId),

//       teamAId: Number(team1Id),

//       teamBId: Number(team2Id),

//       matchDate: form.matchDate,

//       time: form.time || null,

//       venue: form.venue?.trim() || null,

//       matchType: form.matchType || "LEAGUE",

//       status: form.status || "SCHEDULED",

//       overs: form.overs ? Number(form.overs) : 20,

//       team1Score: form.team1Score === "" ? null : Number(form.team1Score),

//       team2Score: form.team2Score === "" ? null : Number(form.team2Score),

//       result: form.result?.trim() || null,

//       toss: form.toss?.trim() || null,
//     };

//     console.log("MATCH PAYLOAD:", payload);

//     /* -----------------------------------------------
//        API CALL
//     ------------------------------------------------ */

//     try {
//       setSaving(true);

//       if (editingId) {
//         await matchAPI.update(editingId, payload);

//         setSuccess("Match updated successfully.");
//       } else {
//         await matchAPI.create(payload);

//         setSuccess("Match created successfully.");
//       }

//       /* ---------------------------------------------
//          REFRESH DATA
//       ---------------------------------------------- */

//       await loadData();

//       setTeams([]);

//       setForm({
//         ...emptyMatch,
//       });

//       setEditingId(null);

//       /*
//        * Keep modal open briefly so success
//        * message can be seen.
//        */

//       setTimeout(() => {
//         setModalOpen(false);

//         setSuccess("");
//       }, 700);
//     } catch (err) {
//       console.error("Save match error:", err);

//       const backendMessage =
//         err?.response?.data?.message ||
//         err?.response?.data?.error ||
//         err?.response?.data;

//       setError(
//         typeof backendMessage === "string"
//           ? backendMessage
//           : "Failed to save match.",
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* =======================================================
//      DELETE MATCH
//   ======================================================= */

//   const handleDelete = async (id) => {
//     if (!id) {
//       return;
//     }

//     const confirmed = window.confirm(
//       "Are you sure you want to delete this match?",
//     );

//     if (!confirmed) {
//       return;
//     }

//     try {
//       setError("");

//       await matchAPI.delete(id);

//       setMatches((previous) =>
//         previous.filter((match) => String(match.id) !== String(id)),
//       );

//       setSuccess("Match deleted successfully.");

//       setTimeout(() => {
//         setSuccess("");
//       }, 2500);
//     } catch (err) {
//       console.error("Delete match error:", err);

//       setError(err?.response?.data?.message || "Failed to delete match.");
//     }
//   };

//   /* =======================================================
//      FILTER MATCHES
//   ======================================================= */

//   const filteredMatches = useMemo(() => {
//     const searchValue = search.trim().toLowerCase();

//     return matches.filter((match) => {
//       const matchesSearch =
//         !searchValue ||
//         String(match.name || "")
//           .toLowerCase()
//           .includes(searchValue) ||
//         String(match.team1Name || "")
//           .toLowerCase()
//           .includes(searchValue) ||
//         String(match.team2Name || "")
//           .toLowerCase()
//           .includes(searchValue) ||
//         String(match.venue || "")
//           .toLowerCase()
//           .includes(searchValue);

//       const matchesStatus =
//         statusFilter === "ALL" ||
//         String(match.status).toUpperCase() === statusFilter;

//       const matchesTournament =
//         tournamentFilter === "ALL" ||
//         String(match.tournamentId) === String(tournamentFilter);

//       return matchesSearch && matchesStatus && matchesTournament;
//     });
//   }, [matches, search, statusFilter, tournamentFilter]);

//   /* =======================================================
//      STATS
//   ======================================================= */

//   const totalMatches = matches.length;

//   const scheduledMatches = matches.filter(
//     (match) => String(match.status).toUpperCase() === "SCHEDULED",
//   ).length;

//   const liveMatches = matches.filter(
//     (match) => String(match.status).toUpperCase() === "LIVE",
//   ).length;

//   const completedMatches = matches.filter(
//     (match) => String(match.status).toUpperCase() === "COMPLETED",
//   ).length;

//   /* =======================================================
//      LOADING
//   ======================================================= */

//   if (loading) {
//     return (
//       <div className="matches-page">
//         <div className="matches-loading">
//           <RefreshCw size={28} className="spin" />

//           <span>Loading matches...</span>
//         </div>

//         <style>{`
//           .matches-page {
//             min-height: 100vh;
//             padding: 32px;
//             background:
//               radial-gradient(
//                 circle at top right,
//                 rgba(163,230,53,.08),
//                 transparent 35%
//               ),
//               #07090c;
//             color: #fff;
//           }

//           .matches-loading {
//             min-height: 70vh;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             gap: 12px;
//             font-size: 16px;
//             color: #a7adb7;
//           }

//           .spin {
//             animation: spin 1s linear infinite;
//           }

//           @keyframes spin {
//             to {
//               transform: rotate(360deg);
//             }
//           }
//         `}</style>
//       </div>
//     );
//   }

//   /* =======================================================
//      UI
//   ======================================================= */

//   return (
//     <div className="matches-page">
//       {/* =================================================
//           HEADER
//       ================================================= */}

//       <div className="page-header">
//         <div>
//           <div className="eyebrow">
//             <Trophy size={15} />
//             MATCH CENTER
//           </div>

//           <h1>Matches</h1>

//           <p>Create, schedule and manage tournament matches.</p>
//         </div>

//         <div className="header-actions">
//           <button className="refresh-btn" onClick={loadData} disabled={loading}>
//             <RefreshCw size={17} />
//             Refresh
//           </button>

//           {canManageMatches() && (
//             <button className="primary-btn" onClick={openCreateModal}>
//               <Plus size={18} />
//               Create Match
//             </button>
//           )}
//         </div>
//       </div>

//       {/* =================================================
//           ALERTS
//       ================================================= */}

//       {error && (
//         <div className="alert error">
//           <AlertCircle size={18} />

//           <span>{error}</span>

//           <button onClick={() => setError("")}>
//             <X size={17} />
//           </button>
//         </div>
//       )}

//       {success && (
//         <div className="alert success">
//           <CheckCircle2 size={18} />

//           <span>{success}</span>
//         </div>
//       )}

//       {/* =================================================
//           STAT CARDS
//       ================================================= */}

//       <div className="stats-grid">
//         <div className="stat-card">
//           <div className="stat-icon">
//             <CalendarDays size={20} />
//           </div>

//           <div>
//             <span>Total Matches</span>

//             <strong>{totalMatches}</strong>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon">
//             <Clock3 size={20} />
//           </div>

//           <div>
//             <span>Scheduled</span>

//             <strong>{scheduledMatches}</strong>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon live">
//             <span />
//           </div>

//           <div>
//             <span>Live</span>

//             <strong>{liveMatches}</strong>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon">
//             <CheckCircle2 size={20} />
//           </div>

//           <div>
//             <span>Completed</span>

//             <strong>{completedMatches}</strong>
//           </div>
//         </div>
//       </div>

//       {/* =================================================
//           FILTER BAR
//       ================================================= */}

//       <div className="filter-card">
//         <div className="search-box">
//           <Search size={18} />

//           <input
//             type="text"
//             placeholder="Search matches, teams or venue..."
//             value={search}
//             onChange={(event) => setSearch(event.target.value)}
//           />
//         </div>

//         <select
//           value={tournamentFilter}
//           onChange={(event) => setTournamentFilter(event.target.value)}
//         >
//           <option value="ALL">All Tournaments</option>

//           {tournaments.map((tournament) => (
//             <option key={tournament.id} value={tournament.id}>
//               {tournament.name}
//             </option>
//           ))}
//         </select>

//         <select
//           value={statusFilter}
//           onChange={(event) => setStatusFilter(event.target.value)}
//         >
//           <option value="ALL">All Status</option>

//           <option value="SCHEDULED">Scheduled</option>

//           <option value="LIVE">Live</option>

//           <option value="COMPLETED">Completed</option>

//           <option value="CANCELLED">Cancelled</option>
//         </select>
//       </div>

//       {/* =================================================
//           MATCH LIST
//       ================================================= */}

//       <div className="matches-card">
//         <div className="table-header">
//           <div>Match</div>

//           <div>Tournament</div>

//           <div>Date & Time</div>

//           <div>Venue</div>

//           <div>Status</div>

//           <div>Action</div>
//         </div>

//         {filteredMatches.length === 0 ? (
//           <div className="empty-state">
//             <div className="empty-icon">
//               <Trophy size={30} />
//             </div>

//             <h3>No matches found</h3>

//             <p>Create a match or change your filters.</p>

//             {canManageMatches() && (
//               <button className="primary-btn" onClick={openCreateModal}>
//                 <Plus size={17} />
//                 Create Match
//               </button>
//             )}
//           </div>
//         ) : (
//           filteredMatches.map((match) => (
//             <div className="match-row" key={match.id}>
//               <div className="match-info">
//                 <strong>
//                   {match.name || `${match.team1Name} vs ${match.team2Name}`}
//                 </strong>

//                 <div className="teams">
//                   <span>{match.team1Name || "Team 1"}</span>

//                   <b>VS</b>

//                   <span>{match.team2Name || "Team 2"}</span>
//                 </div>
//               </div>

//               <div className="tournament-name">
//                 <Trophy size={15} />

//                 {match.tournamentName || "Tournament"}
//               </div>

//               <div className="date-info">
//                 <strong>{match.matchDate || "-"}</strong>

//                 {match.time && (
//                   <span>
//                     <Clock3 size={13} />

//                     {match.time}
//                   </span>
//                 )}
//               </div>

//               <div className="venue">
//                 <MapPin size={15} />

//                 <span>{match.venue || "TBA"}</span>
//               </div>

//               <div>
//                 <span
//                   className={`status ${String(
//                     match.status || "",
//                   ).toLowerCase()}`}
//                 >
//                   {match.status || "SCHEDULED"}
//                 </span>
//               </div>

//               <div className="row-actions">
//                 {canManageMatches() && (
//                   <>
//                     <button
//                       className="icon-btn"
//                       title="Edit"
//                       onClick={() => openEditModal(match)}
//                     >
//                       <Edit3 size={16} />
//                     </button>

//                     <button
//                       className="icon-btn danger"
//                       title="Delete"
//                       onClick={() => handleDelete(match.id)}
//                     >
//                       <Trash2 size={16} />
//                     </button>
//                   </>
//                 )}
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* =================================================
//           CREATE / EDIT MODAL
//       ================================================= */}

//       {modalOpen && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <div className="modal-header">
//               <div>
//                 <div className="modal-eyebrow">
//                   <Shield size={14} />
//                   MATCH MANAGEMENT
//                 </div>

//                 <h2>{editingId ? "Edit Match" : "Create Match"}</h2>

//                 <p>
//                   Select a tournament first. Teams will automatically load for
//                   that tournament.
//                 </p>
//               </div>

//               <button
//                 className="close-btn"
//                 onClick={closeModal}
//                 disabled={saving}
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             {error && (
//               <div className="modal-error">
//                 <AlertCircle size={17} />

//                 {error}
//               </div>
//             )}

//             {success && (
//               <div className="modal-success">
//                 <CheckCircle2 size={17} />

//                 {success}
//               </div>
//             )}

//             <form onSubmit={handleSave} className="match-form">
//               {/* -----------------------------------------
//                   MATCH NAME
//               ------------------------------------------ */}

//               <div className="form-group full">
//                 <label>Match Name</label>

//                 <input
//                   name="name"
//                   value={form.name}
//                   onChange={handleChange}
//                   placeholder="Example: Semi Final 1"
//                 />
//               </div>

//               {/* -----------------------------------------
//                   TOURNAMENT
//               ------------------------------------------ */}

//               <div className="form-group full">
//                 <label>
//                   Tournament
//                   <span>*</span>
//                 </label>

//                 <select
//                   name="tournamentId"
//                   value={form.tournamentId}
//                   onChange={handleTournamentChange}
//                 >
//                   <option value="">Select Tournament</option>

//                   {tournaments.map((tournament) => (
//                     <option key={tournament.id} value={tournament.id}>
//                       {tournament.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* -----------------------------------------
//                   TEAMS
//               ------------------------------------------ */}

//               <div className="team-selection">
//                 <div className="team-box">
//                   <label>
//                     Team 1<span>*</span>
//                   </label>

//                   <div className="select-wrapper">
//                     <Users size={16} />

//                     <select
//                       name="team1Id"
//                       value={form.team1Id}
//                       onChange={handleChange}
//                       disabled={
//                         !form.tournamentId || teamsLoading || teams.length === 0
//                       }
//                     >
//                       <option value="">
//                         {!form.tournamentId
//                           ? "Select tournament first"
//                           : teamsLoading
//                             ? "Loading teams..."
//                             : teams.length === 0
//                               ? "No teams available"
//                               : "Select Team 1"}
//                       </option>

//                       {teams.map((team) => (
//                         <option key={team.id} value={team.id}>
//                           {team.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>

//                 <div className="vs-box">VS</div>

//                 <div className="team-box">
//                   <label>
//                     Team 2<span>*</span>
//                   </label>

//                   <div className="select-wrapper">
//                     <Users size={16} />

//                     <select
//                       name="team2Id"
//                       value={form.team2Id}
//                       onChange={handleChange}
//                       disabled={
//                         !form.tournamentId || teamsLoading || teams.length === 0
//                       }
//                     >
//                       <option value="">
//                         {!form.tournamentId
//                           ? "Select tournament first"
//                           : teamsLoading
//                             ? "Loading teams..."
//                             : teams.length === 0
//                               ? "No teams available"
//                               : "Select Team 2"}
//                       </option>

//                       {teams.map((team) => (
//                         <option
//                           key={team.id}
//                           value={team.id}
//                           disabled={String(team.id) === String(form.team1Id)}
//                         >
//                           {team.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* -----------------------------------------
//                   TEAM STATUS MESSAGE
//               ------------------------------------------ */}

//               {form.tournamentId && (
//                 <div className="team-status">
//                   {teamsLoading ? (
//                     <>
//                       <RefreshCw size={15} className="spin" />
//                       Loading teams for selected tournament...
//                     </>
//                   ) : teams.length === 0 ? (
//                     <>
//                       <AlertCircle size={15} />
//                       No teams found for this tournament. Create/assign teams to
//                       this tournament first.
//                     </>
//                   ) : (
//                     <>
//                       <CheckCircle2 size={15} />
//                       {teams.length} team
//                       {teams.length !== 1 ? "s" : ""} available for this
//                       tournament.
//                     </>
//                   )}
//                 </div>
//               )}

//               {/* -----------------------------------------
//                   DATE / TIME
//               ------------------------------------------ */}

//               <div className="form-group">
//                 <label>
//                   Match Date
//                   <span>*</span>
//                 </label>

//                 <input
//                   type="date"
//                   name="matchDate"
//                   value={form.matchDate}
//                   onChange={handleChange}
//                 />
//               </div>

//               <div className="form-group">
//                 <label>Time</label>

//                 <input
//                   type="time"
//                   name="time"
//                   value={form.time}
//                   onChange={handleChange}
//                 />
//               </div>

//               {/* -----------------------------------------
//                   VENUE
//               ------------------------------------------ */}

//               <div className="form-group">
//                 <label>Venue</label>

//                 <input
//                   type="text"
//                   name="venue"
//                   value={form.venue}
//                   onChange={handleChange}
//                   placeholder="Stadium / Ground"
//                 />
//               </div>

//               {/* -----------------------------------------
//                   MATCH TYPE
//               ------------------------------------------ */}

//               <div className="form-group">
//                 <label>Match Type</label>

//                 <select
//                   name="matchType"
//                   value={form.matchType}
//                   onChange={handleChange}
//                 >
//                   <option value="LEAGUE">League</option>

//                   <option value="QUARTER_FINAL">Quarter Final</option>

//                   <option value="SEMI_FINAL">Semi Final</option>

//                   <option value="FINAL">Final</option>

//                   <option value="FRIENDLY">Friendly</option>
//                 </select>
//               </div>

//               {/* -----------------------------------------
//                   OVERS
//               ------------------------------------------ */}

//               <div className="form-group">
//                 <label>Overs</label>

//                 <input
//                   type="number"
//                   name="overs"
//                   min="1"
//                   max="100"
//                   value={form.overs}
//                   onChange={handleChange}
//                 />
//               </div>

//               {/* -----------------------------------------
//                   STATUS
//               ------------------------------------------ */}

//               <div className="form-group">
//                 <label>Status</label>

//                 <select
//                   name="status"
//                   value={form.status}
//                   onChange={handleChange}
//                 >
//                   <option value="SCHEDULED">Scheduled</option>

//                   <option value="LIVE">Live</option>

//                   <option value="UPCOMING">Upcoming</option>

//                   <option value="CANCELLED">Cancelled</option>
//                 </select>
//               </div>

//               {/* -----------------------------------------
//                   TOSS
//               ------------------------------------------ */}

//               {/* <div className="form-group full">
//                 <label>Toss</label>

//                 <input
//                   type="text"
//                   name="toss"
//                   value={form.toss}
//                   onChange={handleChange}
//                   placeholder="Example: Mumbai Warriors won toss and elected to bat"
//                 />
//               </div> */}

//               {/* -----------------------------------------
//                   RESULT
//               ------------------------------------------ */}

//               {/* <div className="form-group full">
//                 <label>Result</label>

//                 <input
//                   type="text"
//                   name="result"
//                   value={form.result}
//                   onChange={handleChange}
//                   placeholder="Example: Mumbai Warriors won by 5 wickets"
//                 />
//               </div> */}

//               {/* -----------------------------------------
//                   SCORES
//               ------------------------------------------ */}
//               {/*
//               <div className="form-group">
//                 <label>Team 1 Score</label>

//                 <input
//                   type="number"
//                   min="0"
//                   name="team1Score"
//                   value={form.team1Score}
//                   onChange={handleChange}
//                   placeholder="0"
//                 />
//               </div>

//               <div className="form-group">
//                 <label>Team 2 Score</label>

//                 <input
//                   type="number"
//                   min="0"
//                   name="team2Score"
//                   value={form.team2Score}
//                   onChange={handleChange}
//                   placeholder="0"
//                 />
//               </div> */}

//               {/* -----------------------------------------
//                   FOOTER
//               ------------------------------------------ */}

//               <div className="modal-footer">
//                 <button
//                   type="button"
//                   className="cancel-btn"
//                   onClick={closeModal}
//                   disabled={saving}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="primary-btn save-btn"
//                   disabled={
//                     saving ||
//                     teamsLoading ||
//                     !form.tournamentId ||
//                     !form.team1Id ||
//                     !form.team2Id ||
//                     teams.length < 2
//                   }
//                 >
//                   {saving ? (
//                     <>
//                       <RefreshCw size={17} className="spin" />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <CheckCircle2 size={17} />

//                       {editingId ? "Update Match" : "Create Match"}
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* =================================================
//           CSS
//       ================================================= */}

//       <style>{`

//         * {
//           box-sizing: border-box;
//         }

//         .matches-page {
//           min-height: 100vh;
//           padding: 30px;
//           color: #f7f8fa;

//           background:
//             radial-gradient(
//               circle at 90% 0%,
//               rgba(163,230,53,.09),
//               transparent 32%
//             ),
//             radial-gradient(
//               circle at 10% 30%,
//               rgba(59,130,246,.05),
//               transparent 30%
//             ),
//             #07090c;
//         }

//         /* HEADER */

//         .page-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: flex-end;
//           gap: 25px;
//           margin-bottom: 28px;
//         }

//         .eyebrow,
//         .modal-eyebrow {
//           display: flex;
//           align-items: center;
//           gap: 7px;
//           color: #a3e635;
//           font-size: 11px;
//           font-weight: 800;
//           letter-spacing: .14em;
//           margin-bottom: 8px;
//         }

//         .page-header h1 {
//           margin: 0;
//           font-size: 34px;
//           font-weight: 850;
//           letter-spacing: -.04em;
//         }

//         .page-header p {
//           margin: 7px 0 0;
//           color: #858d99;
//           font-size: 14px;
//         }

//         .header-actions {
//           display: flex;
//           gap: 10px;
//         }

//         /* BUTTONS */

//         .primary-btn,
//         .refresh-btn,
//         .cancel-btn {
//           border: 0;
//           border-radius: 11px;
//           padding: 11px 16px;
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           gap: 8px;
//           cursor: pointer;
//           font-weight: 750;
//           transition:
//             transform .18s ease,
//             opacity .18s ease,
//             background .18s ease;
//         }

//         .primary-btn {
//           background: #a3e635;
//           color: #10140b;
//           box-shadow:
//             0 8px 30px
//             rgba(163,230,53,.14);
//         }

//         .primary-btn:hover {
//           transform: translateY(-1px);
//           background: #b4ef50;
//         }

//         .refresh-btn,
//         .cancel-btn {
//           background: #11151b;
//           border: 1px solid #232a33;
//           color: #c5cbd4;
//         }

//         .refresh-btn:hover,
//         .cancel-btn:hover {
//           background: #181d24;
//         }

//         button:disabled {
//           cursor: not-allowed;
//           opacity: .55;
//         }

//         /* ALERT */

//         .alert {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//           padding: 13px 15px;
//           border-radius: 12px;
//           margin-bottom: 18px;
//           border: 1px solid;
//           font-size: 13px;
//         }

//         .alert button {
//           margin-left: auto;
//           background: transparent;
//           border: 0;
//           color: inherit;
//           cursor: pointer;
//         }

//         .alert.error {
//           background: rgba(239,68,68,.08);
//           border-color: rgba(239,68,68,.2);
//           color: #fca5a5;
//         }

//         .alert.success {
//           background: rgba(34,197,94,.08);
//           border-color: rgba(34,197,94,.2);
//           color: #86efac;
//         }

//         /* STATS */

//         .stats-grid {
//           display: grid;
//           grid-template-columns:
//             repeat(4, minmax(0, 1fr));
//           gap: 14px;
//           margin-bottom: 18px;
//         }

//         .stat-card {
//           display: flex;
//           align-items: center;
//           gap: 13px;
//           padding: 18px;
//           border-radius: 15px;

//           background:
//             linear-gradient(
//               145deg,
//               rgba(255,255,255,.045),
//               rgba(255,255,255,.018)
//             );

//           border: 1px solid #1d242d;
//         }

//         .stat-icon {
//           width: 42px;
//           height: 42px;
//           display: grid;
//           place-items: center;
//           border-radius: 12px;
//           background: rgba(163,230,53,.09);
//           color: #a3e635;
//         }

//         .stat-icon.live {
//           position: relative;
//         }

//         .stat-icon.live span {
//           width: 11px;
//           height: 11px;
//           border-radius: 50%;
//           background: #ef4444;
//           box-shadow:
//             0 0 0 5px
//             rgba(239,68,68,.1);
//         }

//         .stat-card span {
//           display: block;
//           color: #7e8793;
//           font-size: 12px;
//           margin-bottom: 3px;
//         }

//         .stat-card strong {
//           font-size: 23px;
//           letter-spacing: -.03em;
//         }

//         /* FILTER */

//         .filter-card {
//           display: flex;
//           gap: 10px;
//           margin-bottom: 16px;
//         }

//         .search-box {
//           flex: 1;
//           min-width: 220px;
//           display: flex;
//           align-items: center;
//           gap: 9px;
//           padding: 0 13px;
//           border-radius: 11px;
//           background: #0d1116;
//           border: 1px solid #202730;
//           color: #69727f;
//         }

//         .search-box input {
//           width: 100%;
//           height: 43px;
//           background: transparent;
//           border: 0;
//           outline: 0;
//           color: #fff;
//           font-size: 13px;
//         }

//         .filter-card select {
//           min-width: 170px;
//           height: 43px;
//           padding: 0 12px;
//           border-radius: 11px;
//           border: 1px solid #202730;
//           background: #0d1116;
//           color: #cbd1d9;
//           outline: 0;
//         }

//         /* MATCH TABLE */

//         .matches-card {
//           overflow: hidden;
//           border-radius: 16px;
//           border: 1px solid #1c232c;
//           background: rgba(10,13,17,.78);
//         }

//         .table-header,
//         .match-row {
//           display: grid;
//           grid-template-columns:
//             2fr
//             1.15fr
//             1fr
//             1.15fr
//             .8fr
//             .65fr;
//           gap: 18px;
//           align-items: center;
//           padding: 15px 18px;
//         }

//         .table-header {
//           background: #0e1217;
//           color: #6e7784;
//           text-transform: uppercase;
//           letter-spacing: .08em;
//           font-size: 10px;
//           font-weight: 800;
//           border-bottom: 1px solid #1c232c;
//         }

//         .match-row {
//           min-height: 86px;
//           border-bottom: 1px solid #181e26;
//           transition: background .18s ease;
//         }

//         .match-row:last-child {
//           border-bottom: 0;
//         }

//         .match-row:hover {
//           background: rgba(255,255,255,.018);
//         }

//         .match-info strong {
//           display: block;
//           font-size: 13px;
//           margin-bottom: 7px;
//         }

//         .teams {
//           display: flex;
//           align-items: center;
//           gap: 7px;
//           color: #aab1bb;
//           font-size: 12px;
//         }

//         .teams b {
//           color: #59616d;
//           font-size: 9px;
//         }

//         .tournament-name,
//         .venue {
//           display: flex;
//           align-items: center;
//           gap: 7px;
//           color: #a7afb9;
//           font-size: 12px;
//         }

//         .tournament-name svg {
//           color: #a3e635;
//         }

//         .venue svg {
//           color: #6f7885;
//           flex-shrink: 0;
//         }

//         .date-info strong {
//           display: block;
//           font-size: 12px;
//         }

//         .date-info span {
//           display: flex;
//           align-items: center;
//           gap: 5px;
//           color: #727b87;
//           margin-top: 4px;
//           font-size: 11px;
//         }

//         /* STATUS */

//         .status {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           padding: 5px 9px;
//           border-radius: 999px;
//           font-size: 9px;
//           font-weight: 850;
//           letter-spacing: .05em;
//           text-transform: uppercase;
//           background: #171c22;
//           color: #9da5b0;
//         }

//         .status.scheduled {
//           background: rgba(59,130,246,.1);
//           color: #93c5fd;
//         }

//         .status.live {
//           background: rgba(239,68,68,.1);
//           color: #fca5a5;
//         }

//         .status.completed {
//           background: rgba(34,197,94,.1);
//           color: #86efac;
//         }

//         .status.cancelled {
//           background: rgba(148,163,184,.1);
//           color: #94a3b8;
//         }

//         /* ACTIONS */

//         .row-actions {
//           display: flex;
//           justify-content: flex-end;
//           gap: 6px;
//         }

//         .icon-btn {
//           width: 33px;
//           height: 33px;
//           display: grid;
//           place-items: center;
//           border-radius: 9px;
//           border: 1px solid #242b34;
//           background: #11161c;
//           color: #aeb5bf;
//           cursor: pointer;
//         }

//         .icon-btn:hover {
//           background: #1a2027;
//           color: #fff;
//         }

//         .icon-btn.danger:hover {
//           color: #f87171;
//           border-color: rgba(248,113,113,.25);
//         }

//         /* EMPTY */

//         .empty-state {
//           padding: 70px 20px;
//           text-align: center;
//           color: #78818d;
//         }

//         .empty-icon {
//           width: 62px;
//           height: 62px;
//           margin: auto;
//           display: grid;
//           place-items: center;
//           border-radius: 18px;
//           color: #a3e635;
//           background: rgba(163,230,53,.08);
//         }

//         .empty-state h3 {
//           margin: 16px 0 7px;
//           color: #fff;
//         }

//         .empty-state p {
//           margin: 0 0 18px;
//           font-size: 13px;
//         }

//         /* MODAL */

//         .modal-overlay {
//           position: fixed;
//           inset: 0;
//           z-index: 1000;
//           display: flex;
//           justify-content: center;
//           align-items: center;
//           padding: 20px;

//           background:
//             rgba(0,0,0,.72);

//           backdrop-filter:
//             blur(10px);
//         }

//         .modal {
//           width: min(760px, 100%);
//           max-height: 92vh;
//           overflow-y: auto;

//           border-radius: 20px;

//           background:
//             linear-gradient(
//               145deg,
//               #10151b,
//               #090c10
//             );

//           border: 1px solid #252d37;

//           box-shadow:
//             0 30px 100px
//             rgba(0,0,0,.55);
//         }

//         .modal-header {
//           display: flex;
//           justify-content: space-between;
//           gap: 20px;
//           padding: 23px 24px;
//           border-bottom: 1px solid #202731;
//         }

//         .modal-header h2 {
//           margin: 0;
//           font-size: 22px;
//         }

//         .modal-header p {
//           margin: 6px 0 0;
//           color: #727b87;
//           font-size: 12px;
//           line-height: 1.5;
//         }

//         .close-btn {
//           width: 36px;
//           height: 36px;
//           flex-shrink: 0;
//           display: grid;
//           place-items: center;
//           border: 1px solid #252c35;
//           border-radius: 10px;
//           background: #11161c;
//           color: #9aa2ad;
//           cursor: pointer;
//         }

//         .close-btn:hover {
//           color: #fff;
//           background: #181d23;
//         }

//         /* MODAL ALERTS */

//         .modal-error,
//         .modal-success {
//           margin: 16px 24px 0;
//           padding: 11px 13px;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           border-radius: 10px;
//           font-size: 12px;
//         }

//         .modal-error {
//           color: #fca5a5;
//           background: rgba(239,68,68,.08);
//           border: 1px solid rgba(239,68,68,.18);
//         }

//         .modal-success {
//           color: #86efac;
//           background: rgba(34,197,94,.08);
//           border: 1px solid rgba(34,197,94,.18);
//         }

//         /* FORM */

//         .match-form {
//           padding: 22px 24px 24px;
//           display: grid;
//           grid-template-columns:
//             repeat(2, minmax(0, 1fr));
//           gap: 17px;
//         }

//         .form-group {
//           min-width: 0;
//         }

//         .form-group.full {
//           grid-column: 1 / -1;
//         }

//         .form-group label,
//         .team-box label {
//           display: block;
//           margin-bottom: 7px;
//           color: #aab2bd;
//           font-size: 11px;
//           font-weight: 750;
//         }

//         .form-group label span,
//         .team-box label span {
//           color: #a3e635;
//           margin-left: 3px;
//         }

//         .form-group input,
//         .form-group select,
//         .team-box select {
//           width: 100%;
//           height: 43px;
//           padding: 0 12px;
//           border-radius: 10px;
//           border: 1px solid #252d37;
//           outline: none;
//           background: #0c1015;
//           color: #f2f4f7;
//           font-size: 12px;
//           transition:
//             border-color .18s ease,
//             box-shadow .18s ease;
//         }

//         .form-group input:focus,
//         .form-group select:focus,
//         .team-box select:focus {
//           border-color: rgba(163,230,53,.5);
//           box-shadow:
//             0 0 0 3px
//             rgba(163,230,53,.07);
//         }

//         .form-group input::placeholder {
//           color: #525b67;
//         }

//         /* TEAM SELECTION */

//         .team-selection {
//           grid-column: 1 / -1;
//           display: grid;
//           grid-template-columns:
//             minmax(0, 1fr)
//             48px
//             minmax(0, 1fr);
//           align-items: end;
//           gap: 10px;
//           padding: 15px;
//           border-radius: 14px;
//           border: 1px solid #202832;
//           background: rgba(255,255,255,.018);
//         }

//         .team-box {
//           min-width: 0;
//         }

//         .select-wrapper {
//           position: relative;
//         }

//         .select-wrapper svg {
//           position: absolute;
//           left: 12px;
//           top: 50%;
//           transform: translateY(-50%);
//           color: #727b87;
//           pointer-events: none;
//           z-index: 1;
//         }

//         .team-box select {
//           padding-left: 38px;
//         }

//         .vs-box {
//           width: 42px;
//           height: 42px;
//           display: grid;
//           place-items: center;
//           border-radius: 50%;
//           background: rgba(163,230,53,.08);
//           border: 1px solid rgba(163,230,53,.18);
//           color: #a3e635;
//           font-size: 10px;
//           font-weight: 900;
//           margin-bottom: 1px;
//         }

//         .team-status {
//           grid-column: 1 / -1;
//           display: flex;
//           align-items: center;
//           gap: 7px;
//           margin-top: -4px;
//           color: #77818d;
//           font-size: 11px;
//         }

//         .team-status svg {
//           color: #a3e635;
//         }

//         /* FOOTER */

//         .modal-footer {
//           grid-column: 1 / -1;
//           display: flex;
//           justify-content: flex-end;
//           gap: 9px;
//           padding-top: 7px;
//           border-top: 1px solid #202731;
//           margin-top: 3px;
//         }

//         .save-btn {
//           min-width: 145px;
//         }

//         /* SCROLLBAR */

//         .modal::-webkit-scrollbar {
//           width: 7px;
//         }

//         .modal::-webkit-scrollbar-track {
//           background: #090c10;
//         }

//         .modal::-webkit-scrollbar-thumb {
//           background: #252d37;
//           border-radius: 10px;
//         }

//         /* SPIN */

//         .spin {
//           animation:
//             spin 1s linear infinite;
//         }

//         @keyframes spin {
//           to {
//             transform: rotate(360deg);
//           }
//         }

//         /* RESPONSIVE */

//         @media (max-width: 1100px) {

//           .stats-grid {
//             grid-template-columns:
//               repeat(2, 1fr);
//           }

//           .table-header {
//             display: none;
//           }

//           .match-row {
//             grid-template-columns:
//               1fr 1fr;
//             gap: 13px;
//           }

//           .row-actions {
//             justify-content: flex-start;
//           }

//         }

//         @media (max-width: 700px) {

//           .matches-page {
//             padding: 18px;
//           }

//           .page-header {
//             align-items: flex-start;
//             flex-direction: column;
//           }

//           .header-actions {
//             width: 100%;
//           }

//           .header-actions button {
//             flex: 1;
//           }

//           .stats-grid {
//             grid-template-columns: 1fr;
//           }

//           .filter-card {
//             flex-direction: column;
//           }

//           .filter-card select {
//             width: 100%;
//           }

//           .match-row {
//             grid-template-columns: 1fr;
//           }

//           .team-selection {
//             grid-template-columns: 1fr;
//           }

//           .vs-box {
//             margin: auto;
//           }

//           .match-form {
//             grid-template-columns: 1fr;
//           }

//           .form-group.full,
//           .team-selection,
//           .modal-footer {
//             grid-column: 1;
//           }

//         }

//       `}</style>
//     </div>
//   );
// }
