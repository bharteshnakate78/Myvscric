import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Users,
  Trophy,
  MapPin,
  UserRound,
  X,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import { teamAPI, tournamentAPI } from "../services/api";
import { ROLES, canManageCricket, getStoredRole } from "../constants/roles";

const EMPTY_FORM = {
  name: "",
  shortName: "",
  tournamentId: "",
  captain: "",
  coach: "",
  city: "",
};

function normalizeTeam(team) {
  if (!team) return null;

  const tournament =
    team.tournament?.tournamentName ||
    team.tournament?.name ||
    team.tournamentName ||
    team.tournament ||
    "";

  return {
    ...team,

    // IMPORTANT:
    // Backend returns teamName, frontend uses name
    id: team.id,
    name: team.teamName || team.name || team.team_name || "",

    shortName:
      team.shortName ||
      team.short_name ||
      (team.teamName ? team.teamName.substring(0, 3).toUpperCase() : "TM"),

    tournament,

    tournamentId: team.tournament?.id || team.tournamentId || "",

    captain: team.captain || "",
    coach: team.coach || "",
    city: team.city || "",

    players: Number(team.playersCount ?? team.playerCount ?? team.players ?? 0),

    matches: Number(team.matches ?? team.matchesPlayed ?? 0),

    wins: Number(team.wins ?? 0),

    losses: Number(team.losses ?? 0),

    status: String(team.status || "ACTIVE").toUpperCase(),
  };
}

function getRecords(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  return [];
}

export default function Teams() {
  const role = getStoredRole();

  const canCreate = canManageCricket(role);
  const canEdit = canManageCricket(role);
  const canDelete = role === ROLES.ADMIN;

  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [selectedTournament, setSelectedTournament] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  // ---------------------------------------------------------
  // LOAD TEAMS + TOURNAMENTS
  // ---------------------------------------------------------

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [teamsResponse, tournamentsResponse] = await Promise.all([
        teamAPI.getAll(),
        tournamentAPI.getAll(),
      ]);

      const teamRecords = getRecords(teamsResponse);
      const tournamentRecords = getRecords(tournamentsResponse);

      setTeams(teamRecords.map(normalizeTeam).filter(Boolean));

      setTournaments(tournamentRecords);
    } catch (err) {
      console.error("Failed to load teams:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load teams and tournaments.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---------------------------------------------------------
  // SEARCH / FILTER
  // ---------------------------------------------------------

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();

    return teams.filter((team) => {
      const matchesSearch =
        !query ||
        String(team.name || "")
          .toLowerCase()
          .includes(query) ||
        String(team.shortName || "")
          .toLowerCase()
          .includes(query) ||
        String(team.city || "")
          .toLowerCase()
          .includes(query) ||
        String(team.captain || "")
          .toLowerCase()
          .includes(query) ||
        String(team.coach || "")
          .toLowerCase()
          .includes(query) ||
        String(team.tournament || "")
          .toLowerCase()
          .includes(query);

      const matchesTournament =
        selectedTournament === "ALL" ||
        String(team.tournamentId) === String(selectedTournament) ||
        String(team.tournament) === String(selectedTournament);

      return matchesSearch && matchesTournament;
    });
  }, [teams, search, selectedTournament]);

  // ---------------------------------------------------------
  // FORM
  // ---------------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingTeam(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (team) => {
    setEditingTeam(team);

    setForm({
      name: team.name || "",
      shortName: team.shortName || "",
      tournamentId: team.tournamentId || findTournamentId(team.tournament),
      captain: team.captain || "",
      coach: team.coach || "",
      city: team.city || "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingTeam(null);
    setForm(EMPTY_FORM);
  };

  const findTournamentId = (tournamentName) => {
    if (!tournamentName) return "";

    const found = tournaments.find(
      (tournament) =>
        String(
          tournament.tournamentName || tournament.name || "",
        ).toLowerCase() === String(tournamentName).toLowerCase(),
    );

    return found?.id || "";
  };

  // ---------------------------------------------------------
  // SAVE TEAM
  // ---------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Team name is required.");
      return;
    }

    if (!canCreate && !editingTeam) {
      setError("You do not have permission to create teams.");
      return;
    }

    if (editingTeam && !canEdit) {
      setError("You do not have permission to edit teams.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /*
       * IMPORTANT:
       * Backend Team entity uses teamName.
       *
       * We send teamName instead of name.
       */

      const selectedTournamentObject = tournaments.find(
        (tournament) => String(tournament.id) === String(form.tournamentId),
      );

      const payload = {
        teamName: form.name.trim(),
        shortName: form.shortName.trim(),
        captain: form.captain.trim(),
        coach: form.coach.trim(),
        city: form.city.trim(),
        tournamentId: form.tournamentId ? Number(form.tournamentId) : null,
      };

      console.log("TEAM PAYLOAD:", payload);

      // const payload = {
      //   teamName: form.name.trim(),

      //   captain: form.captain.trim(),
      //   coach: form.coach.trim(),

      //   /*
      //    * If your Team entity has a Tournament relationship,
      //    * this is the correct structure.
      //    */
      //   tournament: form.tournamentId
      //     ? {
      //         id: Number(form.tournamentId),
      //       }
      //     : null,

      //   /*
      //    * These are included only if your Team entity has
      //    * these fields. If your entity doesn't have them,
      //    * remove these three lines.
      //    */
      //   shortName: form.shortName.trim(),
      //   city: form.city.trim(),
      // };

      // console.log("TEAM PAYLOAD:", payload);

      if (editingTeam) {
        await teamAPI.update(editingTeam.id, payload);
        setSuccess("Team updated successfully.");
      } else {
        await teamAPI.create(payload);
        setSuccess("Team created successfully.");
      }

      await loadData();

      setShowModal(false);
      setEditingTeam(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error("Team save error:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Failed to save team.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------

  const handleDelete = async (team) => {
    if (!canDelete) {
      setError("Only ADMIN can delete teams.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${team.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await teamAPI.delete(team.id);

      setTeams((previous) => previous.filter((item) => item.id !== team.id));

      setSuccess("Team deleted successfully.");
    } catch (err) {
      console.error("Delete team error:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to delete team.",
      );
    }
  };

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  const getTournamentName = (tournament) => {
    return (
      tournament?.tournamentName ||
      tournament?.name ||
      tournament?.shortName ||
      "Tournament"
    );
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div className="teams-page">
      {/* HEADER */}
      <div className="teams-header">
        <div>
          <div className="eyebrow">
            <ShieldCheck size={15} />
            CRICKET MANAGEMENT
          </div>

          <h1>Teams</h1>

          <p>
            Manage tournament teams, captains, coaches and team information.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={loadData}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>

          {canCreate && (
            <button className="primary-btn" onClick={openCreateModal}>
              <Plus size={19} />
              Create Team
            </button>
          )}
        </div>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="alert error">
          <AlertCircle size={19} />
          <span>{error}</span>

          <button onClick={() => setError("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert success">
          <ShieldCheck size={19} />
          <span>{success}</span>

          <button onClick={() => setSuccess("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {/* STATS */}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Total Teams</span>
            <strong>{teams.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Trophy size={22} />
          </div>

          <div>
            <span>Tournaments</span>
            <strong>{tournaments.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <UserRound size={22} />
          </div>

          <div>
            <span>Captains</span>
            <strong>{teams.filter((team) => team.captain).length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <MapPin size={22} />
          </div>

          <div>
            <span>Cities</span>
            <strong>
              {new Set(teams.map((team) => team.city).filter(Boolean)).size}
            </strong>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}

      <div className="filter-bar">
        <div className="search-box">
          <Search size={19} />

          <input
            type="text"
            placeholder="Search teams, captain, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button onClick={() => setSearch("")}>
              <X size={16} />
            </button>
          )}
        </div>

        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
        >
          <option value="ALL">All Tournaments</option>

          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {getTournamentName(tournament)}
            </option>
          ))}
        </select>
      </div>

      {/* TEAM LIST */}

      <div className="teams-section">
        <div className="section-heading">
          <div>
            <h2>Registered Teams</h2>
            <span>
              {filteredTeams.length} team
              {filteredTeams.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="loading-box">
            <RefreshCw className="spin" size={30} />
            <p>Loading teams...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="empty-box">
            <Users size={45} />

            <h3>No teams found</h3>

            <p>
              {teams.length === 0
                ? "Create your first team to get started."
                : "Try changing your search or tournament filter."}
            </p>

            {teams.length === 0 && canCreate && (
              <button className="primary-btn" onClick={openCreateModal}>
                <Plus size={18} />
                Create First Team
              </button>
            )}
          </div>
        ) : (
          <div className="team-grid">
            {filteredTeams.map((team) => (
              <div className="team-card" key={team.id}>
                <div className="team-card-top">
                  <div className="team-logo">
                    {team.shortName?.slice(0, 3).toUpperCase()}
                  </div>

                  <div className="team-title">
                    <h3>{team.name}</h3>

                    <span>{team.shortName}</span>
                  </div>

                  <div className="team-actions">
                    {canEdit && (
                      <button
                        className="icon-btn"
                        onClick={() => openEditModal(team)}
                        title="Edit"
                      >
                        <Edit3 size={17} />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        className="icon-btn danger"
                        onClick={() => handleDelete(team)}
                        title="Delete"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="tournament-tag">
                  <Trophy size={14} />

                  {team.tournament || "No tournament assigned"}
                </div>

                <div className="team-details">
                  <div>
                    <span>Captain</span>
                    <strong>{team.captain || "Not assigned"}</strong>
                  </div>

                  <div>
                    <span>Coach</span>
                    <strong>{team.coach || "Not assigned"}</strong>
                  </div>

                  <div>
                    <span>City</span>
                    <strong>{team.city || "Not specified"}</strong>
                  </div>
                </div>

                <div className="team-stats">
                  <div>
                    <strong>{team.players}</strong>
                    <span>Players</span>
                  </div>

                  <div>
                    <strong>{team.matches}</strong>
                    <span>Matches</span>
                  </div>

                  <div>
                    <strong>{team.wins}</strong>
                    <span>Wins</span>
                  </div>

                  <div>
                    <strong>{team.losses}</strong>
                    <span>Losses</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) {
              closeModal();
            }
          }}
        >
          <div className="team-modal">
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">TEAM MANAGEMENT</span>

                <h2>{editingTeam ? "Edit Team" : "Create Team"}</h2>

                <p>Enter the team information below.</p>
              </div>

              <button
                className="close-btn"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full">
                  <label>Team Name *</label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai Warriors"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Short Name</label>

                  <input
                    name="shortName"
                    value={form.shortName}
                    onChange={handleChange}
                    placeholder="e.g. MW"
                    maxLength={5}
                  />
                </div>

                <div className="form-group">
                  <label>City</label>

                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Nashik"
                  />
                </div>

                <div className="form-group full">
                  <label>Tournament</label>

                  <select
                    name="tournamentId"
                    value={form.tournamentId}
                    onChange={handleChange}
                  >
                    <option value="">Select Tournament</option>

                    {tournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {getTournamentName(tournament)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Captain</label>

                  <input
                    name="captain"
                    value={form.captain}
                    onChange={handleChange}
                    placeholder="Captain name"
                  />
                </div>

                <div className="form-group">
                  <label>Coach</label>

                  <input
                    name="coach"
                    value={form.coach}
                    onChange={handleChange}
                    placeholder="Coach name"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw size={17} className="spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingTeam ? <Edit3 size={17} /> : <Plus size={17} />}

                      {editingTeam ? "Update Team" : "Create Team"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`

/* ============================================================
   MYCRIC — PREMIUM TEAMS MANAGEMENT
   Matches the supplied Teams.jsx exactly
   ============================================================ */

:root {
  --teams-bg: #07090c;
  --teams-surface: #0c1015;
  --teams-surface-2: #10151b;
  --teams-border: rgba(255, 255, 255, 0.08);
  --teams-border-hover: rgba(200, 255, 56, 0.28);

  --teams-text: #f7f8fa;
  --teams-muted: #7f8995;
  --teams-muted-2: #5d6873;

  --teams-accent: #c8ff38;
  --teams-accent-soft: rgba(200, 255, 56, 0.08);
  --teams-accent-border: rgba(200, 255, 56, 0.20);

  --teams-danger: #ff7070;
  --teams-danger-soft: rgba(255, 90, 90, 0.08);

  --teams-radius: 18px;
}

/* ============================================================
   PAGE
   ============================================================ */

.teams-page {
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;

  padding: 32px;

  color: var(--teams-text);

  background:
    radial-gradient(
      circle at 88% 0%,
      rgba(200, 255, 56, 0.09),
      transparent 25%
    ),
    radial-gradient(
      circle at 5% 45%,
      rgba(80, 110, 255, 0.06),
      transparent 25%
    ),
    linear-gradient(
      180deg,
      #080b0f 0%,
      #07090c 100%
    );

  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

/* ============================================================
   HEADER
   ============================================================ */

.teams-header {
  position: relative;

  display: flex;
  align-items: flex-end;
  justify-content: space-between;

  gap: 25px;

  margin-bottom: 28px;
  padding-bottom: 25px;

  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.teams-header::after {
  content: "";

  position: absolute;
  left: 0;
  bottom: -1px;

  width: 90px;
  height: 2px;

  background: var(--teams-accent);

  box-shadow:
    0 0 18px rgba(200, 255, 56, 0.55);
}

.teams-header > div:first-child {
  min-width: 0;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  margin-bottom: 9px;

  color: var(--teams-accent);

  font-size: 10px;
  font-weight: 900;

  letter-spacing: 1.6px;
}

.eyebrow svg {
  width: 14px;
  height: 14px;
}

.teams-header h1 {
  margin: 0;

  color: #ffffff;

  font-size: clamp(30px, 3vw, 42px);
  line-height: 1;

  font-weight: 900;

  letter-spacing: -1.8px;
}

.teams-header p {
  margin: 10px 0 0;

  max-width: 600px;

  color: var(--teams-muted);

  font-size: 13px;
  line-height: 1.6;
}

/* ============================================================
   HEADER ACTIONS
   ============================================================ */

.header-actions {
  display: flex;
  align-items: center;
  gap: 9px;

  flex-shrink: 0;
}

.refresh-btn,
.primary-btn,
.secondary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  gap: 8px;

  height: 44px;

  border-radius: 12px;

  font-family: inherit;
  font-size: 12px;
  font-weight: 800;

  cursor: pointer;

  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.refresh-btn {
  width: 44px;

  color: #8c97a2;

  background: rgba(255, 255, 255, 0.035);

  border: 1px solid var(--teams-border);
}

.refresh-btn:hover {
  color: var(--teams-accent);

  background: rgba(200, 255, 56, 0.06);

  border-color: var(--teams-accent-border);

  transform: translateY(-2px);
}

.primary-btn {
  padding: 0 17px;

  color: #080b0d;

  background: var(--teams-accent);

  border: 1px solid var(--teams-accent);

  box-shadow:
    0 8px 25px rgba(200, 255, 56, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.primary-btn:hover {
  background: #d5ff62;

  transform: translateY(-2px);

  box-shadow:
    0 13px 35px rgba(200, 255, 56, 0.20),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.secondary-btn {
  padding: 0 17px;

  color: #b6bec7;

  background: rgba(255, 255, 255, 0.035);

  border: 1px solid #252e36;
}

.secondary-btn:hover {
  color: #ffffff;

  background: rgba(255, 255, 255, 0.07);

  border-color: #3a4651;
}

.primary-btn:disabled,
.secondary-btn:disabled,
.refresh-btn:disabled {
  opacity: 0.45;

  cursor: not-allowed;

  transform: none;
}

/* ============================================================
   ALERTS
   ============================================================ */

.alert {
  display: flex;
  align-items: center;
  gap: 10px;

  min-height: 46px;

  padding: 10px 13px;

  margin-bottom: 18px;

  border-radius: 12px;

  font-size: 12px;
  font-weight: 650;

  animation: teams-alert-in 0.25s ease;
}

.alert span {
  flex: 1;
}

.alert > button {
  width: 30px;
  height: 30px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: inherit;

  background: transparent;

  border: 0;

  border-radius: 8px;

  cursor: pointer;
}

.alert > button:hover {
  background: rgba(255, 255, 255, 0.07);
}

.alert.error {
  color: #ff9696;

  background:
    linear-gradient(
      90deg,
      rgba(255, 80, 80, 0.09),
      rgba(255, 80, 80, 0.025)
    );

  border: 1px solid rgba(255, 80, 80, 0.18);
}

.alert.success {
  color: var(--teams-accent);

  background:
    linear-gradient(
      90deg,
      rgba(200, 255, 56, 0.08),
      rgba(200, 255, 56, 0.02)
    );

  border: 1px solid rgba(200, 255, 56, 0.15);
}

@keyframes teams-alert-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================================
   STATS
   ============================================================ */

.stats-grid {
  display: grid;

  grid-template-columns: repeat(4, minmax(0, 1fr));

  gap: 14px;

  margin-bottom: 20px;
}

.stat-card {
  position: relative;

  display: flex;
  align-items: center;

  gap: 14px;

  min-height: 100px;

  padding: 17px;

  overflow: hidden;

  border-radius: 16px;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.045),
      rgba(255, 255, 255, 0.012)
    ),
    var(--teams-surface);

  border: 1px solid var(--teams-border);

  box-shadow:
    0 12px 35px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.025);

  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.stat-card::before {
  content: "";

  position: absolute;

  width: 120px;
  height: 120px;

  right: -70px;
  top: -70px;

  border-radius: 50%;

  background: rgba(200, 255, 56, 0.045);
}

.stat-card:hover {
  transform: translateY(-4px);

  border-color: var(--teams-accent-border);

  box-shadow:
    0 20px 45px rgba(0, 0, 0, 0.25),
    0 0 25px rgba(200, 255, 56, 0.025);
}

.stat-icon {
  position: relative;
  z-index: 1;

  width: 43px;
  height: 43px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  color: var(--teams-accent);

  background:
    linear-gradient(
      145deg,
      rgba(200, 255, 56, 0.13),
      rgba(200, 255, 56, 0.035)
    );

  border: 1px solid rgba(200, 255, 56, 0.14);

  border-radius: 13px;
}

.stat-icon svg {
  width: 20px;
  height: 20px;
}

.stat-card > div:last-child {
  position: relative;
  z-index: 1;

  min-width: 0;
}

.stat-card span {
  display: block;

  color: var(--teams-muted);

  font-size: 10px;
  font-weight: 800;

  text-transform: uppercase;

  letter-spacing: 0.8px;
}

.stat-card strong {
  display: block;

  margin-top: 5px;

  color: #ffffff;

  font-size: 27px;
  line-height: 1;

  font-weight: 900;

  letter-spacing: -0.7px;
}

/* ============================================================
   FILTER BAR
   ============================================================ */

.filter-bar {
  display: flex;

  align-items: center;

  gap: 10px;

  margin-bottom: 27px;

  padding: 10px;

  border-radius: 15px;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.04),
      rgba(255, 255, 255, 0.015)
    );

  border: 1px solid var(--teams-border);

  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.14);
}

.search-box {
  position: relative;

  flex: 1;

  min-width: 0;
}

.search-box > svg {
  position: absolute;

  left: 14px;
  top: 50%;

  color: #68737e;

  transform: translateY(-50%);

  pointer-events: none;
}

.search-box input,
.filter-bar > select {
  width: 100%;
  height: 44px;

  box-sizing: border-box;

  outline: none;

  color: #edf0f2;

  background: #080b0f;

  border: 1px solid #252e37;

  border-radius: 11px;

  font-family: inherit;

  font-size: 12px;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.search-box input {
  padding: 0 42px 0 43px;
}

.search-box input::placeholder {
  color: #58636e;
}

.search-box input:focus,
.filter-bar > select:focus {
  background: #0a0e12;

  border-color: rgba(200, 255, 56, 0.42);

  box-shadow:
    0 0 0 3px rgba(200, 255, 56, 0.055);
}

.search-box > button {
  position: absolute;

  right: 8px;
  top: 50%;

  width: 28px;
  height: 28px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #75808a;

  background: transparent;

  border: 0;

  border-radius: 7px;

  cursor: pointer;

  transform: translateY(-50%);
}

.search-box > button:hover {
  color: #ffffff;

  background: rgba(255, 255, 255, 0.07);
}

.filter-bar > select {
  width: 230px;

  padding: 0 13px;

  cursor: pointer;
}

.filter-bar > select option {
  color: #ffffff;

  background: #0a0e12;
}

/* ============================================================
   SECTION
   ============================================================ */

.teams-section {
  width: 100%;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 15px;
}

.section-heading > div {
  display: flex;
  align-items: baseline;

  gap: 10px;
}

.section-heading h2 {
  margin: 0;

  color: #ffffff;

  font-size: 17px;
  font-weight: 850;

  letter-spacing: -0.3px;
}

.section-heading span {
  color: #59636e;

  font-size: 11px;
  font-weight: 700;
}

/* ============================================================
   TEAM GRID
   ============================================================ */

.team-grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 17px;
}

/* ============================================================
   TEAM CARD
   ============================================================ */

.team-card {
  position: relative;

  min-width: 0;

  padding: 20px;

  overflow: hidden;

  border-radius: 19px;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.045),
      rgba(255, 255, 255, 0.01)
    ),
    #0b0f13;

  border: 1px solid #1c252d;

  box-shadow:
    0 16px 45px rgba(0, 0, 0, 0.20),
    inset 0 1px 0 rgba(255, 255, 255, 0.025);

  transition:
    transform 0.28s ease,
    border-color 0.28s ease,
    box-shadow 0.28s ease;
}

.team-card::before {
  content: "";

  position: absolute;

  left: 0;
  top: 0;

  width: 3px;
  height: 0;

  border-radius: 0 0 5px 0;

  background: var(--teams-accent);

  box-shadow:
    0 0 18px rgba(200, 255, 56, 0.55);

  transition: height 0.3s ease;
}

.team-card::after {
  content: "";

  position: absolute;

  width: 220px;
  height: 220px;

  right: -145px;
  top: -145px;

  border-radius: 50%;

  background: rgba(200, 255, 56, 0.035);

  pointer-events: none;

  transition: background 0.3s ease;
}

.team-card:hover {
  transform: translateY(-6px);

  border-color: var(--teams-accent-border);

  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.31),
    0 0 30px rgba(200, 255, 56, 0.025);
}

.team-card:hover::before {
  height: 100%;
}

.team-card:hover::after {
  background: rgba(200, 255, 56, 0.06);
}

/* ============================================================
   TEAM TOP
   ============================================================ */

.team-card-top {
  position: relative;
  z-index: 2;

  display: flex;

  align-items: center;

  gap: 13px;
}

.team-logo {
  position: relative;

  width: 58px;
  height: 58px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  color: var(--teams-accent);

  background:
    linear-gradient(
      145deg,
      rgba(200, 255, 56, 0.19),
      rgba(200, 255, 56, 0.035)
    );

  border: 1px solid rgba(200, 255, 56, 0.20);

  border-radius: 17px;

  font-size: 14px;
  font-weight: 950;

  letter-spacing: 0.6px;

  box-shadow:
    0 8px 25px rgba(200, 255, 56, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.09);
}

.team-logo::before {
  content: "";

  position: absolute;

  inset: 5px;

  border-radius: 13px;

  border: 1px solid rgba(200, 255, 56, 0.08);
}

.team-logo::after {
  content: "";

  position: absolute;

  width: 6px;
  height: 6px;

  right: 6px;
  top: 6px;

  border-radius: 50%;

  background: var(--teams-accent);

  box-shadow:
    0 0 9px rgba(200, 255, 56, 0.8);
}

.team-title {
  flex: 1;

  min-width: 0;
}

.team-title h3 {
  margin: 0;

  overflow: hidden;

  color: #ffffff;

  font-size: 16px;
  font-weight: 850;

  white-space: nowrap;
  text-overflow: ellipsis;

  letter-spacing: -0.2px;
}

.team-title span {
  display: block;

  margin-top: 5px;

  color: #69747f;

  font-size: 10px;
  font-weight: 850;

  letter-spacing: 1.3px;
}

/* ============================================================
   TEAM ACTIONS
   ============================================================ */

.team-actions {
  display: flex;

  gap: 5px;

  flex-shrink: 0;
}

.icon-btn {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #707b86;

  background: rgba(255, 255, 255, 0.025);

  border: 1px solid #252e36;

  border-radius: 9px;

  cursor: pointer;

  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.icon-btn:hover {
  color: #ffffff;

  background: rgba(255, 255, 255, 0.07);

  border-color: #3a4651;

  transform: translateY(-1px);
}

.icon-btn.danger:hover {
  color: var(--teams-danger);

  background: var(--teams-danger-soft);

  border-color: rgba(255, 90, 90, 0.25);
}

/* ============================================================
   TOURNAMENT TAG
   ============================================================ */

.tournament-tag {
  position: relative;
  z-index: 2;

  display: inline-flex;
  align-items: center;

  gap: 6px;

  max-width: 100%;

  margin-top: 17px;

  padding: 7px 10px;

  overflow: hidden;

  color: var(--teams-accent);

  background:
    linear-gradient(
      90deg,
      rgba(200, 255, 56, 0.075),
      rgba(200, 255, 56, 0.025)
    );

  border: 1px solid rgba(200, 255, 56, 0.12);

  border-radius: 8px;

  font-size: 9px;
  font-weight: 850;

  text-transform: uppercase;

  letter-spacing: 0.65px;

  white-space: nowrap;
  text-overflow: ellipsis;
}

.tournament-tag svg {
  flex-shrink: 0;
}

/* ============================================================
   DETAILS
   ============================================================ */

.team-details {
  position: relative;
  z-index: 2;

  display: grid;

  gap: 0;

  margin-top: 18px;

  border-top: 1px solid rgba(255, 255, 255, 0.065);
}

.team-details > div {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 15px;

  min-width: 0;

  padding: 11px 0;

  border-bottom: 1px solid rgba(255, 255, 255, 0.045);
}

.team-details > div:last-child {
  border-bottom: 0;
}

.team-details span {
  flex-shrink: 0;

  color: #626d78;

  font-size: 10px;
  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.5px;
}

.team-details strong {
  min-width: 0;

  overflow: hidden;

  color: #e3e7ea;

  font-size: 11px;
  font-weight: 750;

  white-space: nowrap;
  text-overflow: ellipsis;

  text-align: right;
}

/* ============================================================
   TEAM STATS
   ============================================================ */

.team-stats {
  position: relative;
  z-index: 2;

  display: grid;

  grid-template-columns:
    repeat(4, minmax(0, 1fr));

  gap: 6px;

  margin-top: 16px;
}

.team-stats > div {
  min-width: 0;

  padding: 10px 4px;

  text-align: center;

  background: #080b0e;

  border: 1px solid #171f26;

  border-radius: 10px;

  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.team-stats > div:hover {
  background: #0d1217;

  border-color: #2a343e;
}

.team-stats strong {
  display: block;

  color: #ffffff;

  font-size: 15px;
  font-weight: 900;

  line-height: 1;
}

.team-stats span {
  display: block;

  margin-top: 5px;

  color: #59636d;

  font-size: 8px;
  font-weight: 850;

  text-transform: uppercase;

  letter-spacing: 0.5px;
}

/* ============================================================
   LOADING
   ============================================================ */

.loading-box {
  min-height: 350px;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  color: #66717c;

  border: 1px dashed #242d35;

  border-radius: 18px;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.018),
      rgba(255, 255, 255, 0.006)
    );
}

.loading-box svg {
  color: var(--teams-accent);

  margin-bottom: 12px;
}

.loading-box p {
  margin: 0;

  font-size: 12px;
  font-weight: 650;
}

/* ============================================================
   EMPTY
   ============================================================ */

.empty-box {
  min-height: 350px;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  padding: 30px;

  text-align: center;

  border: 1px dashed #28323b;

  border-radius: 18px;

  background:
    radial-gradient(
      circle at 50% 20%,
      rgba(200, 255, 56, 0.045),
      transparent 30%
    ),
    rgba(255, 255, 255, 0.008);
}

.empty-box > svg {
  width: 55px;
  height: 55px;

  margin-bottom: 17px;

  padding: 15px;

  box-sizing: border-box;

  color: var(--teams-accent);

  background: rgba(200, 255, 56, 0.06);

  border: 1px solid rgba(200, 255, 56, 0.12);

  border-radius: 17px;
}

.empty-box h3 {
  margin: 0;

  color: #ffffff;

  font-size: 18px;
  font-weight: 850;
}

.empty-box p {
  max-width: 390px;

  margin: 8px 0 18px;

  color: #66717c;

  font-size: 12px;
  line-height: 1.6;
}

/* ============================================================
   MODAL BACKDROP
   ============================================================ */

.modal-backdrop {
  position: fixed;

  inset: 0;

  z-index: 9999;

  display: flex;

  align-items: center;
  justify-content: center;

  padding: 20px;

  box-sizing: border-box;

  background: rgba(0, 0, 0, 0.78);

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  animation: modal-bg-in 0.2s ease;
}

@keyframes modal-bg-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* ============================================================
   MODAL
   ============================================================ */

.team-modal {
  width: min(650px, 100%);

  max-height: calc(100vh - 40px);

  overflow-y: auto;

  border-radius: 21px;

  background:
    radial-gradient(
      circle at 100% 0%,
      rgba(200, 255, 56, 0.07),
      transparent 28%
    ),
    linear-gradient(
      180deg,
      #0e1318,
      #0a0e12
    );

  border: 1px solid #29323b;

  box-shadow:
    0 35px 100px rgba(0, 0, 0, 0.70),
    0 0 60px rgba(0, 0, 0, 0.30);

  animation: modal-in 0.25s ease;
}

@keyframes modal-in {
  from {
    opacity: 0;

    transform:
      translateY(18px)
      scale(0.97);
  }

  to {
    opacity: 1;

    transform:
      translateY(0)
      scale(1);
  }
}

.team-modal::-webkit-scrollbar {
  width: 5px;
}

.team-modal::-webkit-scrollbar-track {
  background: transparent;
}

.team-modal::-webkit-scrollbar-thumb {
  background: #303a44;

  border-radius: 20px;
}

/* ============================================================
   MODAL HEADER
   ============================================================ */

.modal-header {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  gap: 20px;

  padding: 23px 25px;

  border-bottom: 1px solid #1d252d;
}

.modal-eyebrow {
  display: block;

  margin-bottom: 7px;

  color: var(--teams-accent);

  font-size: 9px;
  font-weight: 900;

  letter-spacing: 1.4px;
}

.modal-header h2 {
  margin: 0;

  color: #ffffff;

  font-size: 22px;
  font-weight: 900;

  letter-spacing: -0.6px;
}

.modal-header p {
  margin: 6px 0 0;

  color: #68737e;

  font-size: 11px;
}

.close-btn {
  width: 37px;
  height: 37px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  color: #7b8691;

  background: rgba(255, 255, 255, 0.035);

  border: 1px solid #252e37;

  border-radius: 10px;

  cursor: pointer;

  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.close-btn:hover {
  color: #ffffff;

  background: rgba(255, 255, 255, 0.075);

  border-color: #38434e;
}

.close-btn:disabled {
  opacity: 0.4;

  cursor: not-allowed;
}

/* ============================================================
   FORM
   ============================================================ */

.team-modal form {
  display: block;
}

.form-grid {
  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 16px;

  padding: 24px 25px;
}

.form-group {
  display: flex;

  flex-direction: column;

  gap: 7px;

  min-width: 0;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  color: #aeb6be;

  font-size: 10px;
  font-weight: 850;

  text-transform: uppercase;

  letter-spacing: 0.65px;
}

.form-group input,
.form-group select {
  width: 100%;
  height: 46px;

  box-sizing: border-box;

  padding: 0 13px;

  outline: none;

  color: #f0f2f4;

  background: #080c10;

  border: 1px solid #252e37;

  border-radius: 11px;

  font-family: inherit;

  font-size: 12px;

  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.form-group input::placeholder {
  color: #56616c;
}

.form-group input:hover,
.form-group select:hover {
  border-color: #323d47;
}

.form-group input:focus,
.form-group select:focus {
  background: #0a0f13;

  border-color: rgba(200, 255, 56, 0.46);

  box-shadow:
    0 0 0 3px rgba(200, 255, 56, 0.055);
}

.form-group select {
  cursor: pointer;
}

.form-group select option {
  color: #ffffff;

  background: #0a0e12;
}

/* ============================================================
   MODAL FOOTER
   ============================================================ */

.modal-footer {
  display: flex;

  align-items: center;
  justify-content: flex-end;

  gap: 9px;

  padding: 17px 25px;

  border-top: 1px solid #1d252d;

  background: rgba(0, 0, 0, 0.08);
}

/* ============================================================
   SPIN
   ============================================================ */

.spin {
  animation: teams-spin 0.75s linear infinite;
}

@keyframes teams-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============================================================
   RESPONSIVE — 1200
   ============================================================ */

@media (max-width: 1200px) {
  .team-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .stats-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }
}

/* ============================================================
   RESPONSIVE — 850
   ============================================================ */

@media (max-width: 850px) {
  .teams-page {
    padding: 23px;
  }

  .teams-header {
    align-items: flex-start;

    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .primary-btn {
    flex: 1;
  }

  .filter-bar {
    flex-direction: column;

    align-items: stretch;
  }

  .filter-bar > select {
    width: 100%;
  }
}

/* ============================================================
   RESPONSIVE — 650
   ============================================================ */

@media (max-width: 650px) {
  .teams-page {
    padding: 16px;
  }

  .teams-header {
    margin-bottom: 22px;
    padding-bottom: 20px;
  }

  .teams-header h1 {
    font-size: 30px;
  }

  .teams-header p {
    font-size: 12px;
  }

  .stats-grid {
    gap: 9px;
  }

  .stat-card {
    min-height: 88px;

    padding: 13px;

    gap: 10px;
  }

  .stat-icon {
    width: 37px;
    height: 37px;

    border-radius: 11px;
  }

  .stat-icon svg {
    width: 17px;
    height: 17px;
  }

  .stat-card strong {
    font-size: 23px;
  }

  .stat-card span {
    font-size: 8px;
  }

  .team-grid {
    grid-template-columns: 1fr;
  }

  .team-card {
    padding: 17px;
  }

  .form-grid {
    grid-template-columns: 1fr;

    padding: 20px;
  }

  .form-group.full {
    grid-column: auto;
  }

  .modal-header {
    padding: 20px;
  }

  .modal-footer {
    padding: 15px 20px;
  }
}

/* ============================================================
   RESPONSIVE — 450
   ============================================================ */

@media (max-width: 450px) {
  .header-actions {
    display: grid;

    grid-template-columns: 44px 1fr;
  }

  .primary-btn {
    min-width: 0;
  }

  .team-card-top {
    gap: 9px;
  }

  .team-logo {
    width: 51px;
    height: 51px;

    border-radius: 15px;
  }

  .team-title h3 {
    font-size: 14px;
  }

  .team-actions {
    gap: 3px;
  }

  .icon-btn {
    width: 31px;
    height: 31px;
  }

  .team-stats {
    gap: 4px;
  }

  .team-stats > div {
    padding: 9px 2px;
  }

  .team-stats strong {
    font-size: 14px;
  }

  .team-stats span {
    font-size: 7px;
  }

  .modal-backdrop {
    padding: 10px;
  }

  .team-modal {
    max-height: calc(100vh - 20px);

    border-radius: 17px;
  }

  .modal-header {
    padding: 17px;
  }

  .modal-header h2 {
    font-size: 19px;
  }

  .form-grid {
    padding: 17px;

    gap: 13px;
  }

  .modal-footer {
    padding: 13px 17px;
  }

  .modal-footer .secondary-btn,
  .modal-footer .primary-btn {
    flex: 1;
  }
}

/* ============================================================
   ACCESSIBILITY
   ============================================================ */

button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid rgba(200, 255, 56, 0.55);
  outline-offset: 2px;
}

/* ============================================================
   REDUCED MOTION
   ============================================================ */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
   `}</style>
    </div>
  );
}
