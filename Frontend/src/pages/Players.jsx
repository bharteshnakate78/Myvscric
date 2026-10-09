import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Users,
  Target,
  Activity,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  X,
  ChevronDown,
  MapPin,
  Shield,
  RefreshCw,
  UserRound,
  Trophy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { playerAPI } from "../services/api";
import { ROLES, canManageCricket, getStoredRole } from "../constants/roles";

const EMPTY_FORM = {
  name: "",
  team: "",
  role: "",
  battingStyle: "Right Hand",
  bowlingStyle: "",
  city: "",
};

const PLAYER_ROLES = ["Batter", "Bowler", "All-Rounder", "Wicket-Keeper"];

const BOWLING_STYLES = [
  "Right Arm Fast",
  "Left Arm Fast",
  "Right Arm Medium",
  "Left Arm Medium",
  "Right Arm Spin",
  "Left Arm Spin",
];

function getRecords(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(response)) return response;

  return [];
}

function getStatsData(response) {
  const data = response?.data;

  if (data?.data && typeof data.data === "object") {
    return data.data;
  }

  return data || {};
}

function getTeamName(team) {
  if (!team) return "";

  if (typeof team === "string") return team;

  return team.teamName || team.name || team.shortName || team.team_name || "";
}

function getTeamId(team) {
  if (!team || typeof team !== "object") return "";

  return team.id || team.teamId || "";
}

function normalizeTeams(records) {
  return records
    .map((team, index) => {
      if (typeof team === "string") {
        return {
          id: team,
          name: team,
          shortName: team.substring(0, 3).toUpperCase(),
        };
      }

      const name = getTeamName(team);

      if (!name) return null;

      return {
        id: getTeamId(team) || name || index,
        name,
        shortName: team.shortName || name.substring(0, 3).toUpperCase(),
      };
    })
    .filter(Boolean);
}

function normalizePlayer(player) {
  if (!player) return null;

  const team =
    getTeamName(player.team) || player.teamName || player.team_name || "";

  const role = String(player.role || player.playerRole || "Batter").trim();

  return {
    ...player,

    id: player.id,

    name: player.name || player.playerName || player.fullName || "",

    team,

    teamId: player.teamId || player.team?.id || "",

    role,

    battingStyle: player.battingStyle || player.batting_style || "Right Hand",

    bowlingStyle: player.bowlingStyle || player.bowling_style || "",

    city: player.city || player.location || "",

    matches: Number(
      player.matches ?? player.matchesPlayed ?? player.matchCount ?? 0,
    ),

    runs: Number(player.runs ?? player.totalRuns ?? 0),

    wickets: Number(player.wickets ?? player.totalWickets ?? 0),

    status: String(player.status || "ACTIVE").toUpperCase(),
  };
}

function getRoleClass(role) {
  const normalized = String(role || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (normalized === "allrounder" || normalized === "allround") {
    return "role-all-rounder";
  }

  if (
    normalized === "wicketkeeper" ||
    normalized === "keeper" ||
    normalized === "wk"
  ) {
    return "role-wicket-keeper";
  }

  if (normalized === "bowler") {
    return "role-bowler";
  }

  return "role-batter";
}

function getRoleIcon(role) {
  const normalized = String(role || "").toLowerCase();

  if (normalized.includes("bowler")) {
    return <Target size={14} />;
  }

  if (normalized.includes("all") || normalized.includes("round")) {
    return <Activity size={14} />;
  }

  if (normalized.includes("keeper") || normalized.includes("wicket")) {
    return <Shield size={14} />;
  }

  return <Trophy size={14} />;
}

function getInitials(name) {
  if (!name) return "PL";

  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Players() {
  const role = getStoredRole();

  const canCreate = canManageCricket(role);
  const canEdit = canManageCricket(role);
  const canDelete = role === ROLES.ADMIN;

  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);

  const [stats, setStats] = useState({
    players: 0,
    runs: 0,
    wickets: 0,
    active: 0,
  });

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const [form, setForm] = useState({
    ...EMPTY_FORM,
  });

  const loadPlayers = async () => {
    try {
      const response = await playerAPI.getAll();

      const records = getRecords(response);

      setPlayers(records.map(normalizePlayer).filter(Boolean));
    } catch (err) {
      console.error("Failed to load players:", err);

      throw new Error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load players from server.",
      );
    }
  };

  const loadStats = async () => {
    try {
      const response = await playerAPI.getStats();

      const data = getStatsData(response);

      setStats({
        players: Number(data.players ?? data.totalPlayers ?? 0),

        runs: Number(data.runs ?? data.totalRuns ?? 0),

        wickets: Number(data.wickets ?? data.totalWickets ?? 0),

        active: Number(data.active ?? data.activePlayers ?? 0),
      });
    } catch (err) {
      console.error("Failed to load player statistics:", err);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await playerAPI.getTeams();

      const records = getRecords(response);

      setTeams(normalizeTeams(records));
    } catch (err) {
      console.error("Failed to load teams:", err);

      setTeams([]);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([loadPlayers(), loadStats(), loadTeams()]);
    } catch (err) {
      console.error("Failed to load player data:", err);

      setError(err?.message || "Unable to load player data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const refreshOnFocus = () => loadAllData();
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpen(null);
    };

    if (menuOpen !== null) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuOpen]);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return players.filter((player) => {
      const playerName = String(player.name || "").toLowerCase();

      const playerTeam = String(player.team || "").toLowerCase();

      const playerCity = String(player.city || "").toLowerCase();

      const playerRole = String(player.role || "").toLowerCase();

      const matchesSearch =
        !query ||
        playerName.includes(query) ||
        playerTeam.includes(query) ||
        playerCity.includes(query) ||
        playerRole.includes(query);

      const matchesTeam =
        teamFilter === "ALL" ||
        String(player.team || "").toLowerCase() ===
          String(teamFilter || "").toLowerCase();

      const matchesRole =
        roleFilter === "ALL" ||
        String(player.role || "").toLowerCase() ===
          String(roleFilter || "").toLowerCase();

      return matchesSearch && matchesTeam && matchesRole;
    });
  }, [players, search, teamFilter, roleFilter]);

  const openCreateModal = () => {
    if (!canCreate) {
      setError("You do not have permission to add players.");
      return;
    }

    setEditingPlayer(null);
    setForm({
      ...EMPTY_FORM,
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (player) => {
    if (!canEdit) {
      setError("You do not have permission to edit players.");
      return;
    }

    setEditingPlayer(player);

    setForm({
      name: player.name || "",
      team: player.team || "",
      role: player.role || "",
      battingStyle: player.battingStyle || "Right Hand",
      bowlingStyle: player.bowlingStyle || "",
      city: player.city || "",
    });

    setError("");
    setSuccess("");
    setMenuOpen(null);
    setModalOpen(true);
  };

  const closeModal = (force = false) => {
    if (saving && !force) return;

    setModalOpen(false);
    setEditingPlayer(null);
    setForm({
      ...EMPTY_FORM,
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Player name is required.";
    }

    if (!form.team.trim()) {
      return "Please select a team.";
    }

    if (!form.role) {
      return "Please select player role.";
    }

    if (!form.city.trim()) {
      return "City is required.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (editingPlayer && !canEdit) {
      setError("You do not have permission to edit players.");
      return;
    }

    if (!editingPlayer && !canCreate) {
      setError("You do not have permission to add players.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        team: form.team.trim(),
        role: form.role,
        battingStyle: form.battingStyle.trim(),
        bowlingStyle: form.bowlingStyle.trim(),
        city: form.city.trim(),
      };

      if (editingPlayer) {
        const response = await playerAPI.update(editingPlayer.id, payload);

        const updatedPlayer = normalizePlayer(
          response?.data?.data || response?.data,
        );

        if (updatedPlayer) {
          setPlayers((previous) =>
            previous.map((player) =>
              player.id === editingPlayer.id ? updatedPlayer : player,
            ),
          );
        }

        setSuccess("Player updated successfully.");
      } else {
        const response = await playerAPI.create(payload);

        const newPlayer = normalizePlayer(
          response?.data?.data || response?.data,
        );

        if (newPlayer) {
          setPlayers((previous) => [newPlayer, ...previous]);
        } else {
          await loadPlayers();
        }

        setSuccess("Player added successfully.");
      }

      await Promise.all([loadStats(), loadTeams()]);

      setModalOpen(false);
      setEditingPlayer(null);
      setForm({
        ...EMPTY_FORM,
      });
    } catch (err) {
      console.error("Player save failed:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          (typeof err?.response?.data === "string"
            ? err.response.data
            : "Failed to save player."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      setError("Only ADMIN can delete players.");
      return;
    }

    const player = players.find((item) => item.id === id);

    if (!player) return;

    const confirmed = window.confirm(
      `Delete "${player.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await playerAPI.delete(id);

      setPlayers((previous) => previous.filter((item) => item.id !== id));

      setMenuOpen(null);

      await loadStats();

      setSuccess("Player deleted successfully.");
    } catch (err) {
      console.error("Player delete failed:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to delete player.",
      );
    }
  };

  const handleView = (player) => {
    setMenuOpen(null);

    const message =
      `PLAYER PROFILE\n\n` +
      `Name: ${player.name || "-"}\n` +
      `Team: ${player.team || "-"}\n` +
      `Role: ${player.role || "-"}\n` +
      `City: ${player.city || "-"}\n` +
      `Matches: ${player.matches || 0}\n` +
      `Runs: ${player.runs || 0}\n` +
      `Wickets: ${player.wickets || 0}`;

    window.alert(message);
  };

  const clearFilters = () => {
    setSearch("");
    setTeamFilter("ALL");
    setRoleFilter("ALL");
  };

  const hasFilters = search || teamFilter !== "ALL" || roleFilter !== "ALL";

  return (
    <div className="players-page">
      {/* HEADER */}
      <header className="page-header">
        <div className="header-content">
          <div>
            <div className="page-eyebrow">
              <span className="eyebrow-line" />
              PLAYER MANAGEMENT
            </div>

            <h1>
              Cricket <span>Players</span>
            </h1>

            <p>Manage your cricket squad, player profiles and performance.</p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={loadAllData}
              disabled={loading}
            >
              <RefreshCw size={17} className={loading ? "spin-icon" : ""} />
              Refresh
            </button>

            {canCreate && (
              <button
                type="button"
                className="primary-btn"
                onClick={openCreateModal}
              >
                <Plus size={18} />
                Add Player
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ALERTS */}
      {(error || success) && (
        <div
          className={`players-alert ${error ? "alert-error" : "alert-success"}`}
        >
          {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}

          <span>{error || success}</span>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* STATS */}
      <section className="player-stats">
        <PlayerStat
          icon={<Users size={22} />}
          label="Total Players"
          value={stats.players}
          detail="Registered players"
        />

        <PlayerStat
          icon={<Activity size={22} />}
          label="Total Runs"
          value={stats.runs}
          detail="Career runs"
        />

        <PlayerStat
          icon={<Target size={22} />}
          label="Total Wickets"
          value={stats.wickets}
          detail="Career wickets"
        />

        <PlayerStat
          icon={<CheckCircle2 size={22} />}
          label="Active Players"
          value={stats.active}
          detail="Currently active"
        />
      </section>

      {/* TOOLBAR */}
      <section className="players-toolbar">
        <div className="search-box">
          <Search size={19} />

          <input
            type="text"
            placeholder="Search players, teams, cities..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setSearch("")}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="player-filters">
          <div className="select-wrapper">
            <select
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
            >
              <option value="ALL">All Teams</option>

              {teams.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>

            <ChevronDown size={16} />
          </div>

          <div className="select-wrapper">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="ALL">All Roles</option>

              {PLAYER_ROLES.map((playerRole) => (
                <option key={playerRole} value={playerRole}>
                  {playerRole}
                </option>
              ))}
            </select>

            <ChevronDown size={16} />
          </div>

          {hasFilters && (
            <button
              type="button"
              className="reset-filter"
              onClick={clearFilters}
            >
              <X size={15} />
              Clear
            </button>
          )}
        </div>
      </section>

      {/* RESULT HEADER */}
      <div className="result-header">
        <div>
          <div className="result-title">
            Players
            <span className="result-count">{filteredPlayers.length}</span>
          </div>

          <p>
            {hasFilters
              ? "Showing filtered player results"
              : "All registered cricket players"}
          </p>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">
            <RefreshCw size={26} className="spin-icon" />
          </div>

          <h3>Loading players</h3>
          <p>Fetching player information...</p>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Users size={34} />
          </div>

          <h3>{hasFilters ? "No players found" : "No players yet"}</h3>

          <p>
            {hasFilters
              ? "Try changing your search or filters."
              : "Start building your squad by adding the first player."}
          </p>

          {hasFilters ? (
            <button
              type="button"
              className="secondary-btn"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          ) : (
            canCreate && (
              <button
                type="button"
                className="primary-btn"
                onClick={openCreateModal}
              >
                <Plus size={17} />
                Add First Player
              </button>
            )
          )}
        </div>
      ) : (
        <div className="players-grid">
          {filteredPlayers.map((player) => (
            <article className="player-card" key={player.id}>
              <div className="player-card-glow" />

              <div className="player-card-top">
                <div className="player-identity">
                  <div className="player-avatar">
                    <span>{getInitials(player.name)}</span>
                  </div>

                  <div className="player-info">
                    <h3>{player.name || "Unnamed Player"}</h3>

                    <div className="player-team">
                      <Shield size={13} />
                      <span>{player.team || "No Team"}</span>
                    </div>
                  </div>
                </div>

                <div className="player-menu-wrapper">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={(event) => {
                      event.stopPropagation();

                      setMenuOpen(menuOpen === player.id ? null : player.id);
                    }}
                  >
                    <MoreVertical size={19} />
                  </button>

                  {menuOpen === player.id && (
                    <div
                      className="dropdown-menu"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button type="button" onClick={() => handleView(player)}>
                        <Eye size={16} />
                        View Profile
                      </button>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditModal(player)}
                        >
                          <Pencil size={16} />
                          Edit Player
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          className="danger-action"
                          onClick={() => handleDelete(player.id)}
                        >
                          <Trash2 size={16} />
                          Delete Player
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="player-role-row">
                <span className={`player-role ${getRoleClass(player.role)}`}>
                  {getRoleIcon(player.role)}
                  {player.role || "Batter"}
                </span>

                <span className="player-location">
                  <MapPin size={13} />
                  {player.city || "Unknown"}
                </span>
              </div>

              <div className="playing-style">
                <div className="style-item">
                  <span>Batting</span>
                  <strong>{player.battingStyle || "Right Hand"}</strong>
                </div>

                <div className="style-divider" />

                <div className="style-item">
                  <span>Bowling</span>
                  <strong>{player.bowlingStyle || "—"}</strong>
                </div>
              </div>

              <div className="player-performance">
                <div className="performance-item">
                  <span>Matches</span>
                  <strong>{player.matches}</strong>
                </div>

                <div className="performance-item">
                  <span>Runs</span>
                  <strong className="runs-value">
                    {player.runs.toLocaleString()}
                  </strong>
                </div>

                <div className="performance-item">
                  <span>Wickets</span>
                  <strong className="wickets-value">{player.wickets}</strong>
                </div>
              </div>

              <div className="player-card-footer">
                <div className="team-status">
                  <span
                    className={`status-dot ${
                      player.status === "ACTIVE"
                        ? "status-active"
                        : "status-inactive"
                    }`}
                  />

                  <span>
                    {player.status === "ACTIVE" ? "Active" : "Inactive"}
                  </span>
                </div>

                <button
                  type="button"
                  className="view-btn"
                  onClick={() => handleView(player)}
                >
                  View
                  <Eye size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="tournament-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <div className="modal-eyebrow">
                  <UserRound size={14} />
                  PLAYER MANAGEMENT
                </div>

                <h2>{editingPlayer ? "Edit Player" : "Add New Player"}</h2>

                <p>
                  {editingPlayer
                    ? "Update player profile and playing information."
                    : "Create a new player profile for your squad."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => closeModal()}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="modal-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="player-form">
              <div className="form-grid">
                <div className="form-field full-width">
                  <label>
                    Player Name
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Virat Kohli"
                    disabled={saving}
                    autoComplete="off"
                  />
                </div>

                <div className="form-field">
                  <label>
                    Team
                    <span>*</span>
                  </label>

                  <div className="form-select">
                    <select
                      name="team"
                      value={form.team}
                      onChange={handleChange}
                      disabled={saving}
                    >
                      <option value="">Select Team</option>

                      {teams.map((team) => (
                        <option key={team.id} value={team.name}>
                          {team.name}
                        </option>
                      ))}
                    </select>

                    <ChevronDown size={17} />
                  </div>
                </div>

                <div className="form-field">
                  <label>
                    Player Role
                    <span>*</span>
                  </label>

                  <div className="form-select">
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      disabled={saving}
                    >
                      <option value="">Select Role</option>

                      {PLAYER_ROLES.map((playerRole) => (
                        <option key={playerRole} value={playerRole}>
                          {playerRole}
                        </option>
                      ))}
                    </select>

                    <ChevronDown size={17} />
                  </div>
                </div>

                <div className="form-field">
                  <label>Batting Style</label>

                  <div className="form-select">
                    <select
                      name="battingStyle"
                      value={form.battingStyle}
                      onChange={handleChange}
                      disabled={saving}
                    >
                      <option value="Right Hand">Right Hand</option>

                      <option value="Left Hand">Left Hand</option>
                    </select>

                    <ChevronDown size={17} />
                  </div>
                </div>

                <div className="form-field">
                  <label>Bowling Style</label>

                  <div className="form-select">
                    <select
                      name="bowlingStyle"
                      value={form.bowlingStyle}
                      onChange={handleChange}
                      disabled={saving}
                    >
                      <option value="">Select Style</option>

                      {BOWLING_STYLES.map((style) => (
                        <option key={style} value={style}>
                          {style}
                        </option>
                      ))}
                    </select>

                    <ChevronDown size={17} />
                  </div>
                </div>

                <div className="form-field full-width">
                  <label>
                    City
                    <span>*</span>
                  </label>

                  <div className="input-with-icon">
                    <MapPin size={17} />

                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => closeModal()}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw size={17} className="spin-icon" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingPlayer ? (
                        <Pencil size={17} />
                      ) : (
                        <Plus size={18} />
                      )}

                      {editingPlayer ? "Update Player" : "Create Player"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerStat({ icon, label, value, detail }) {
  return (
    <div className="player-stat-card">
      <div className="player-stat-icon">{icon}</div>

      <div className="player-stat-info">
        <span>{label}</span>

        <strong>{Number(value || 0).toLocaleString()}</strong>

        <small>{detail}</small>
      </div>
    </div>
  );
}

export default Players;

// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Search,
//   Plus,
//   Users,
//   Target,
//   Activity,
//   MoreVertical,
//   Pencil,
//   Trash2,
//   Eye,
//   X,
//   ChevronDown,
//   MapPin,
//   Shield,
//   RefreshCw,
//   UserRound,
//   Trophy,
//   CheckCircle2,
//   AlertCircle,
// } from "lucide-react";

// import { playerAPI } from "../services/api";
// import { ROLES, canManageCricket, getStoredRole } from "../constants/roles";

// const EMPTY_FORM = {
//   name: "",
//   team: "",
//   role: "",
//   battingStyle: "Right Hand",
//   bowlingStyle: "",
//   city: "",
// };

// const PLAYER_ROLES = ["Batter", "Bowler", "All-Rounder", "Wicket-Keeper"];

// const BOWLING_STYLES = [
//   "Right Arm Fast",
//   "Left Arm Fast",
//   "Right Arm Medium",
//   "Left Arm Medium",
//   "Right Arm Spin",
//   "Left Arm Spin",
// ];

// function getRecords(response) {
//   const data = response?.data;

//   if (Array.isArray(data)) return data;
//   if (Array.isArray(data?.data)) return data.data;
//   if (Array.isArray(data?.content)) return data.content;
//   if (Array.isArray(response)) return response;

//   return [];
// }

// function getStatsData(response) {
//   const data = response?.data;

//   if (data?.data && typeof data.data === "object") {
//     return data.data;
//   }

//   return data || {};
// }

// function getTeamName(team) {
//   if (!team) return "";

//   if (typeof team === "string") return team;

//   return team.teamName || team.name || team.shortName || team.team_name || "";
// }

// function getTeamId(team) {
//   if (!team || typeof team !== "object") return "";

//   return team.id || team.teamId || "";
// }

// function normalizeTeams(records) {
//   return records
//     .map((team, index) => {
//       if (typeof team === "string") {
//         return {
//           id: team,
//           name: team,
//           shortName: team.substring(0, 3).toUpperCase(),
//         };
//       }

//       const name = getTeamName(team);

//       if (!name) return null;

//       return {
//         id: getTeamId(team) || name || index,
//         name,
//         shortName: team.shortName || name.substring(0, 3).toUpperCase(),
//       };
//     })
//     .filter(Boolean);
// }

// function normalizePlayer(player) {
//   if (!player) return null;

//   const team =
//     getTeamName(player.team) || player.teamName || player.team_name || "";

//   const role = String(player.role || player.playerRole || "Batter").trim();

//   return {
//     ...player,

//     id: player.id,

//     name: player.name || player.playerName || player.fullName || "",

//     team,

//     teamId: player.teamId || player.team?.id || "",

//     role,

//     battingStyle: player.battingStyle || player.batting_style || "Right Hand",

//     bowlingStyle: player.bowlingStyle || player.bowling_style || "",

//     city: player.city || player.location || "",

//     matches: Number(
//       player.matches ?? player.matchesPlayed ?? player.matchCount ?? 0,
//     ),

//     runs: Number(player.runs ?? player.totalRuns ?? 0),

//     wickets: Number(player.wickets ?? player.totalWickets ?? 0),

//     status: String(player.status || "ACTIVE").toUpperCase(),
//   };
// }

// function getRoleClass(role) {
//   const normalized = String(role || "")
//     .toLowerCase()
//     .replace(/[\s_-]/g, "");

//   if (normalized === "allrounder" || normalized === "allround") {
//     return "role-all-rounder";
//   }

//   if (
//     normalized === "wicketkeeper" ||
//     normalized === "keeper" ||
//     normalized === "wk"
//   ) {
//     return "role-wicket-keeper";
//   }

//   if (normalized === "bowler") {
//     return "role-bowler";
//   }

//   return "role-batter";
// }

// function getRoleIcon(role) {
//   const normalized = String(role || "").toLowerCase();

//   if (normalized.includes("bowler")) {
//     return <Target size={14} />;
//   }

//   if (normalized.includes("all") || normalized.includes("round")) {
//     return <Activity size={14} />;
//   }

//   if (normalized.includes("keeper") || normalized.includes("wicket")) {
//     return <Shield size={14} />;
//   }

//   return <Trophy size={14} />;
// }

// function getInitials(name) {
//   if (!name) return "PL";

//   return name
//     .trim()
//     .split(/\s+/)
//     .map((word) => word[0])
//     .join("")
//     .slice(0, 2)
//     .toUpperCase();
// }

// function Players() {
//   const role = getStoredRole();

//   const canCreate = canManageCricket(role);
//   const canEdit = canManageCricket(role);
//   const canDelete = role === ROLES.ADMIN;

//   const [players, setPlayers] = useState([]);
//   const [teams, setTeams] = useState([]);

//   const [stats, setStats] = useState({
//     players: 0,
//     runs: 0,
//     wickets: 0,
//     active: 0,
//   });

//   const [search, setSearch] = useState("");
//   const [teamFilter, setTeamFilter] = useState("ALL");
//   const [roleFilter, setRoleFilter] = useState("ALL");

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [modalOpen, setModalOpen] = useState(false);
//   const [editingPlayer, setEditingPlayer] = useState(null);
//   const [menuOpen, setMenuOpen] = useState(null);

//   const [form, setForm] = useState({
//     ...EMPTY_FORM,
//   });

//   const loadPlayers = async () => {
//     try {
//       const response = await playerAPI.getAll();

//       const records = getRecords(response);

//       setPlayers(records.map(normalizePlayer).filter(Boolean));
//     } catch (err) {
//       console.error("Failed to load players:", err);

//       throw new Error(
//         err?.response?.data?.message ||
//           err?.response?.data?.error ||
//           "Unable to load players from server.",
//       );
//     }
//   };

//   const loadStats = async () => {
//     try {
//       const response = await playerAPI.getStats();

//       const data = getStatsData(response);

//       setStats({
//         players: Number(data.players ?? data.totalPlayers ?? 0),

//         runs: Number(data.runs ?? data.totalRuns ?? 0),

//         wickets: Number(data.wickets ?? data.totalWickets ?? 0),

//         active: Number(data.active ?? data.activePlayers ?? 0),
//       });
//     } catch (err) {
//       console.error("Failed to load player statistics:", err);
//     }
//   };

//   const loadTeams = async () => {
//     try {
//       const response = await playerAPI.getTeams();

//       const records = getRecords(response);

//       setTeams(normalizeTeams(records));
//     } catch (err) {
//       console.error("Failed to load teams:", err);

//       setTeams([]);
//     }
//   };

//   const loadAllData = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       await Promise.all([loadPlayers(), loadStats(), loadTeams()]);
//     } catch (err) {
//       console.error("Failed to load player data:", err);

//       setError(err?.message || "Unable to load player data.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadAllData();
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = () => {
//       setMenuOpen(null);
//     };

//     if (menuOpen !== null) {
//       document.addEventListener("click", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("click", handleClickOutside);
//     };
//   }, [menuOpen]);

//   const filteredPlayers = useMemo(() => {
//     const query = search.trim().toLowerCase();

//     return players.filter((player) => {
//       const playerName = String(player.name || "").toLowerCase();

//       const playerTeam = String(player.team || "").toLowerCase();

//       const playerCity = String(player.city || "").toLowerCase();

//       const playerRole = String(player.role || "").toLowerCase();

//       const matchesSearch =
//         !query ||
//         playerName.includes(query) ||
//         playerTeam.includes(query) ||
//         playerCity.includes(query) ||
//         playerRole.includes(query);

//       const matchesTeam =
//         teamFilter === "ALL" ||
//         String(player.team || "").toLowerCase() ===
//           String(teamFilter || "").toLowerCase();

//       const matchesRole =
//         roleFilter === "ALL" ||
//         String(player.role || "").toLowerCase() ===
//           String(roleFilter || "").toLowerCase();

//       return matchesSearch && matchesTeam && matchesRole;
//     });
//   }, [players, search, teamFilter, roleFilter]);

//   const openCreateModal = () => {
//     if (!canCreate) {
//       setError("You do not have permission to add players.");
//       return;
//     }

//     setEditingPlayer(null);
//     setForm({
//       ...EMPTY_FORM,
//     });
//     setError("");
//     setSuccess("");
//     setModalOpen(true);
//   };

//   const openEditModal = (player) => {
//     if (!canEdit) {
//       setError("You do not have permission to edit players.");
//       return;
//     }

//     setEditingPlayer(player);

//     setForm({
//       name: player.name || "",
//       team: player.team || "",
//       role: player.role || "",
//       battingStyle: player.battingStyle || "Right Hand",
//       bowlingStyle: player.bowlingStyle || "",
//       city: player.city || "",
//     });

//     setError("");
//     setSuccess("");
//     setMenuOpen(null);
//     setModalOpen(true);
//   };

//   const closeModal = (force = false) => {
//     if (saving && !force) return;

//     setModalOpen(false);
//     setEditingPlayer(null);
//     setForm({
//       ...EMPTY_FORM,
//     });
//   };

//   const handleChange = (event) => {
//     const { name, value } = event.target;

//     setForm((previous) => ({
//       ...previous,
//       [name]: value,
//     }));
//   };

//   const validateForm = () => {
//     if (!form.name.trim()) {
//       return "Player name is required.";
//     }

//     if (!form.team.trim()) {
//       return "Please select a team.";
//     }

//     if (!form.role) {
//       return "Please select player role.";
//     }

//     if (!form.city.trim()) {
//       return "City is required.";
//     }

//     return "";
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     const validationError = validateForm();

//     if (validationError) {
//       setError(validationError);
//       return;
//     }

//     if (editingPlayer && !canEdit) {
//       setError("You do not have permission to edit players.");
//       return;
//     }

//     if (!editingPlayer && !canCreate) {
//       setError("You do not have permission to add players.");
//       return;
//     }

//     try {
//       setSaving(true);
//       setError("");
//       setSuccess("");

//       const payload = {
//         name: form.name.trim(),
//         team: form.team.trim(),
//         role: form.role,
//         battingStyle: form.battingStyle.trim(),
//         bowlingStyle: form.bowlingStyle.trim(),
//         city: form.city.trim(),
//       };

//       if (editingPlayer) {
//         const response = await playerAPI.update(editingPlayer.id, payload);

//         const updatedPlayer = normalizePlayer(
//           response?.data?.data || response?.data,
//         );

//         if (updatedPlayer) {
//           setPlayers((previous) =>
//             previous.map((player) =>
//               player.id === editingPlayer.id ? updatedPlayer : player,
//             ),
//           );
//         }

//         setSuccess("Player updated successfully.");
//       } else {
//         const response = await playerAPI.create(payload);

//         const newPlayer = normalizePlayer(
//           response?.data?.data || response?.data,
//         );

//         if (newPlayer) {
//           setPlayers((previous) => [newPlayer, ...previous]);
//         } else {
//           await loadPlayers();
//         }

//         setSuccess("Player added successfully.");
//       }

//       await Promise.all([loadStats(), loadTeams()]);

//       setModalOpen(false);
//       setEditingPlayer(null);
//       setForm({
//         ...EMPTY_FORM,
//       });
//     } catch (err) {
//       console.error("Player save failed:", err);

//       setError(
//         err?.response?.data?.message ||
//           err?.response?.data?.error ||
//           (typeof err?.response?.data === "string"
//             ? err.response.data
//             : "Failed to save player."),
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!canDelete) {
//       setError("Only ADMIN can delete players.");
//       return;
//     }

//     const player = players.find((item) => item.id === id);

//     if (!player) return;

//     const confirmed = window.confirm(
//       `Delete "${player.name}"?\n\nThis action cannot be undone.`,
//     );

//     if (!confirmed) return;

//     try {
//       setError("");
//       setSuccess("");

//       await playerAPI.delete(id);

//       setPlayers((previous) => previous.filter((item) => item.id !== id));

//       setMenuOpen(null);

//       await loadStats();

//       setSuccess("Player deleted successfully.");
//     } catch (err) {
//       console.error("Player delete failed:", err);

//       setError(
//         err?.response?.data?.message ||
//           err?.response?.data?.error ||
//           "Failed to delete player.",
//       );
//     }
//   };

//   const handleView = (player) => {
//     setMenuOpen(null);

//     const message =
//       `PLAYER PROFILE\n\n` +
//       `Name: ${player.name || "-"}\n` +
//       `Team: ${player.team || "-"}\n` +
//       `Role: ${player.role || "-"}\n` +
//       `City: ${player.city || "-"}\n` +
//       `Matches: ${player.matches || 0}\n` +
//       `Runs: ${player.runs || 0}\n` +
//       `Wickets: ${player.wickets || 0}`;

//     window.alert(message);
//   };

//   const clearFilters = () => {
//     setSearch("");
//     setTeamFilter("ALL");
//     setRoleFilter("ALL");
//   };

//   const hasFilters = search || teamFilter !== "ALL" || roleFilter !== "ALL";

//   return (
//     <div className="players-page">
//       {/* HEADER */}
//       <header className="page-header">
//         <div className="header-content">
//           <div>
//             <div className="page-eyebrow">
//               <span className="eyebrow-line" />
//               PLAYER MANAGEMENT
//             </div>

//             <h1>
//               Cricket <span>Players</span>
//             </h1>

//             <p>Manage your cricket squad, player profiles and performance.</p>
//           </div>

//           <div className="header-actions">
//             <button
//               type="button"
//               className="secondary-btn"
//               onClick={loadAllData}
//               disabled={loading}
//             >
//               <RefreshCw size={17} className={loading ? "spin-icon" : ""} />
//               Refresh
//             </button>

//             {canCreate && (
//               <button
//                 type="button"
//                 className="primary-btn"
//                 onClick={openCreateModal}
//               >
//                 <Plus size={18} />
//                 Add Player
//               </button>
//             )}
//           </div>
//         </div>
//       </header>

//       {/* ALERTS */}
//       {(error || success) && (
//         <div
//           className={`players-alert ${error ? "alert-error" : "alert-success"}`}
//         >
//           {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}

//           <span>{error || success}</span>

//           <button
//             type="button"
//             onClick={() => {
//               setError("");
//               setSuccess("");
//             }}
//           >
//             <X size={16} />
//           </button>
//         </div>
//       )}

//       {/* STATS */}
//       <section className="player-stats">
//         <PlayerStat
//           icon={<Users size={22} />}
//           label="Total Players"
//           value={stats.players}
//           detail="Registered players"
//         />

//         <PlayerStat
//           icon={<Activity size={22} />}
//           label="Total Runs"
//           value={stats.runs}
//           detail="Career runs"
//         />

//         <PlayerStat
//           icon={<Target size={22} />}
//           label="Total Wickets"
//           value={stats.wickets}
//           detail="Career wickets"
//         />

//         <PlayerStat
//           icon={<CheckCircle2 size={22} />}
//           label="Active Players"
//           value={stats.active}
//           detail="Currently active"
//         />
//       </section>

//       {/* TOOLBAR */}
//       <section className="players-toolbar">
//         <div className="search-box">
//           <Search size={19} />

//           <input
//             type="text"
//             placeholder="Search players, teams, cities..."
//             value={search}
//             onChange={(event) => setSearch(event.target.value)}
//           />

//           {search && (
//             <button
//               type="button"
//               className="clear-search"
//               onClick={() => setSearch("")}
//             >
//               <X size={15} />
//             </button>
//           )}
//         </div>

//         <div className="player-filters">
//           <div className="select-wrapper">
//             <select
//               value={teamFilter}
//               onChange={(event) => setTeamFilter(event.target.value)}
//             >
//               <option value="ALL">All Teams</option>

//               {teams.map((team) => (
//                 <option key={team.id} value={team.name}>
//                   {team.name}
//                 </option>
//               ))}
//             </select>

//             <ChevronDown size={16} />
//           </div>

//           <div className="select-wrapper">
//             <select
//               value={roleFilter}
//               onChange={(event) => setRoleFilter(event.target.value)}
//             >
//               <option value="ALL">All Roles</option>

//               {PLAYER_ROLES.map((playerRole) => (
//                 <option key={playerRole} value={playerRole}>
//                   {playerRole}
//                 </option>
//               ))}
//             </select>

//             <ChevronDown size={16} />
//           </div>

//           {hasFilters && (
//             <button
//               type="button"
//               className="reset-filter"
//               onClick={clearFilters}
//             >
//               <X size={15} />
//               Clear
//             </button>
//           )}
//         </div>
//       </section>

//       {/* RESULT HEADER */}
//       <div className="result-header">
//         <div>
//           <div className="result-title">
//             Players
//             <span className="result-count">{filteredPlayers.length}</span>
//           </div>

//           <p>
//             {hasFilters
//               ? "Showing filtered player results"
//               : "All registered cricket players"}
//           </p>
//         </div>
//       </div>

//       {/* CONTENT */}
//       {loading ? (
//         <div className="loading-state">
//           <div className="loading-spinner">
//             <RefreshCw size={26} className="spin-icon" />
//           </div>

//           <h3>Loading players</h3>
//           <p>Fetching player information...</p>
//         </div>
//       ) : filteredPlayers.length === 0 ? (
//         <div className="empty-state">
//           <div className="empty-icon">
//             <Users size={34} />
//           </div>

//           <h3>{hasFilters ? "No players found" : "No players yet"}</h3>

//           <p>
//             {hasFilters
//               ? "Try changing your search or filters."
//               : "Start building your squad by adding the first player."}
//           </p>

//           {hasFilters ? (
//             <button
//               type="button"
//               className="secondary-btn"
//               onClick={clearFilters}
//             >
//               Clear Filters
//             </button>
//           ) : (
//             canCreate && (
//               <button
//                 type="button"
//                 className="primary-btn"
//                 onClick={openCreateModal}
//               >
//                 <Plus size={17} />
//                 Add First Player
//               </button>
//             )
//           )}
//         </div>
//       ) : (
//         <div className="players-grid">
//           {filteredPlayers.map((player) => (
//             <article className="player-card" key={player.id}>
//               <div className="player-card-glow" />

//               <div className="player-card-top">
//                 <div className="player-identity">
//                   <div className="player-avatar">
//                     <span>{getInitials(player.name)}</span>
//                   </div>

//                   <div className="player-info">
//                     <h3>{player.name || "Unnamed Player"}</h3>

//                     <div className="player-team">
//                       <Shield size={13} />
//                       <span>{player.team || "No Team"}</span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="player-menu-wrapper">
//                   <button
//                     type="button"
//                     className="icon-btn"
//                     onClick={(event) => {
//                       event.stopPropagation();

//                       setMenuOpen(menuOpen === player.id ? null : player.id);
//                     }}
//                   >
//                     <MoreVertical size={19} />
//                   </button>

//                   {menuOpen === player.id && (
//                     <div
//                       className="dropdown-menu"
//                       onClick={(event) => event.stopPropagation()}
//                     >
//                       <button type="button" onClick={() => handleView(player)}>
//                         <Eye size={16} />
//                         View Profile
//                       </button>

//                       {canEdit && (
//                         <button
//                           type="button"
//                           onClick={() => openEditModal(player)}
//                         >
//                           <Pencil size={16} />
//                           Edit Player
//                         </button>
//                       )}

//                       {canDelete && (
//                         <button
//                           type="button"
//                           className="danger-action"
//                           onClick={() => handleDelete(player.id)}
//                         >
//                           <Trash2 size={16} />
//                           Delete Player
//                         </button>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div className="player-role-row">
//                 <span className={`player-role ${getRoleClass(player.role)}`}>
//                   {getRoleIcon(player.role)}
//                   {player.role || "Batter"}
//                 </span>

//                 <span className="player-location">
//                   <MapPin size={13} />
//                   {player.city || "Unknown"}
//                 </span>
//               </div>

//               <div className="playing-style">
//                 <div className="style-item">
//                   <span>Batting</span>
//                   <strong>{player.battingStyle || "Right Hand"}</strong>
//                 </div>

//                 <div className="style-divider" />

//                 <div className="style-item">
//                   <span>Bowling</span>
//                   <strong>{player.bowlingStyle || "—"}</strong>
//                 </div>
//               </div>

//               <div className="player-performance">
//                 <div className="performance-item">
//                   <span>Matches</span>
//                   <strong>{player.matches}</strong>
//                 </div>

//                 <div className="performance-item">
//                   <span>Runs</span>
//                   <strong className="runs-value">
//                     {player.runs.toLocaleString()}
//                   </strong>
//                 </div>

//                 <div className="performance-item">
//                   <span>Wickets</span>
//                   <strong className="wickets-value">{player.wickets}</strong>
//                 </div>
//               </div>

//               <div className="player-card-footer">
//                 <div className="team-status">
//                   <span
//                     className={`status-dot ${
//                       player.status === "ACTIVE"
//                         ? "status-active"
//                         : "status-inactive"
//                     }`}
//                   />

//                   <span>
//                     {player.status === "ACTIVE" ? "Active" : "Inactive"}
//                   </span>
//                 </div>

//                 <button
//                   type="button"
//                   className="view-btn"
//                   onClick={() => handleView(player)}
//                 >
//                   View
//                   <Eye size={14} />
//                 </button>
//               </div>
//             </article>
//           ))}
//         </div>
//       )}

//       {/* MODAL */}
//       {modalOpen && (
//         <div
//           className="modal-backdrop"
//           onMouseDown={(event) => {
//             if (event.target === event.currentTarget) {
//               closeModal();
//             }
//           }}
//         >
//           <div className="tournament-modal" role="dialog" aria-modal="true">
//             <div className="modal-header">
//               <div>
//                 <div className="modal-eyebrow">
//                   <UserRound size={14} />
//                   PLAYER MANAGEMENT
//                 </div>

//                 <h2>{editingPlayer ? "Edit Player" : "Add New Player"}</h2>

//                 <p>
//                   {editingPlayer
//                     ? "Update player profile and playing information."
//                     : "Create a new player profile for your squad."}
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 className="modal-close"
//                 onClick={() => closeModal()}
//                 disabled={saving}
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             {error && (
//               <div className="modal-error">
//                 <AlertCircle size={16} />
//                 {error}
//               </div>
//             )}

//             <form onSubmit={handleSubmit} className="player-form">
//               <div className="form-grid">
//                 <div className="form-field full-width">
//                   <label>
//                     Player Name
//                     <span>*</span>
//                   </label>

//                   <input
//                     type="text"
//                     name="name"
//                     value={form.name}
//                     onChange={handleChange}
//                     placeholder="e.g. Virat Kohli"
//                     disabled={saving}
//                     autoComplete="off"
//                   />
//                 </div>

//                 <div className="form-field">
//                   <label>
//                     Team
//                     <span>*</span>
//                   </label>

//                   <div className="form-select">
//                     <select
//                       name="team"
//                       value={form.team}
//                       onChange={handleChange}
//                       disabled={saving}
//                     >
//                       <option value="">Select Team</option>

//                       {teams.map((team) => (
//                         <option key={team.id} value={team.name}>
//                           {team.name}
//                         </option>
//                       ))}
//                     </select>

//                     <ChevronDown size={17} />
//                   </div>
//                 </div>

//                 <div className="form-field">
//                   <label>
//                     Player Role
//                     <span>*</span>
//                   </label>

//                   <div className="form-select">
//                     <select
//                       name="role"
//                       value={form.role}
//                       onChange={handleChange}
//                       disabled={saving}
//                     >
//                       <option value="">Select Role</option>

//                       {PLAYER_ROLES.map((playerRole) => (
//                         <option key={playerRole} value={playerRole}>
//                           {playerRole}
//                         </option>
//                       ))}
//                     </select>

//                     <ChevronDown size={17} />
//                   </div>
//                 </div>

//                 <div className="form-field">
//                   <label>Batting Style</label>

//                   <div className="form-select">
//                     <select
//                       name="battingStyle"
//                       value={form.battingStyle}
//                       onChange={handleChange}
//                       disabled={saving}
//                     >
//                       <option value="Right Hand">Right Hand</option>

//                       <option value="Left Hand">Left Hand</option>
//                     </select>

//                     <ChevronDown size={17} />
//                   </div>
//                 </div>

//                 <div className="form-field">
//                   <label>Bowling Style</label>

//                   <div className="form-select">
//                     <select
//                       name="bowlingStyle"
//                       value={form.bowlingStyle}
//                       onChange={handleChange}
//                       disabled={saving}
//                     >
//                       <option value="">Select Style</option>

//                       {BOWLING_STYLES.map((style) => (
//                         <option key={style} value={style}>
//                           {style}
//                         </option>
//                       ))}
//                     </select>

//                     <ChevronDown size={17} />
//                   </div>
//                 </div>

//                 <div className="form-field full-width">
//                   <label>
//                     City
//                     <span>*</span>
//                   </label>

//                   <div className="input-with-icon">
//                     <MapPin size={17} />

//                     <input
//                       type="text"
//                       name="city"
//                       value={form.city}
//                       onChange={handleChange}
//                       placeholder="e.g. Mumbai"
//                       disabled={saving}
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="modal-actions">
//                 <button
//                   type="button"
//                   className="cancel-btn"
//                   onClick={() => closeModal()}
//                   disabled={saving}
//                 >
//                   Cancel
//                 </button>

//                 <button type="submit" className="save-btn" disabled={saving}>
//                   {saving ? (
//                     <>
//                       <RefreshCw size={17} className="spin-icon" />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       {editingPlayer ? (
//                         <Pencil size={17} />
//                       ) : (
//                         <Plus size={18} />
//                       )}

//                       {editingPlayer ? "Update Player" : "Create Player"}
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function PlayerStat({ icon, label, value, detail }) {
//   return (
//     <div className="player-stat-card">
//       <div className="player-stat-icon">{icon}</div>

//       <div className="player-stat-info">
//         <span>{label}</span>

//         <strong>{Number(value || 0).toLocaleString()}</strong>

//         <small>{detail}</small>
//       </div>
//     </div>
//   );
// }

// export default Players;

// // import { ROLES, canManageCricket, getStoredRole } from "../constants/roles";
// // import React, { useEffect, useMemo, useState } from "react";
// // import {
// //   Search,
// //   Plus,
// //   Users,
// //   Target,
// //   Activity,
// //   MoreVertical,
// //   Pencil,
// //   Trash2,
// //   Eye,
// //   X,
// //   ChevronDown,
// //   MapPin,
// //   Shield,
// //   RefreshCw,
// // } from "lucide-react";

// // import { playerAPI } from "../services/api";

// // const emptyForm = {
// //   name: "",
// //   team: "",
// //   role: "",
// //   battingStyle: "Right Hand",
// //   bowlingStyle: "",
// //   city: "",
// // };

// // function Players() {
// //   const [players, setPlayers] = useState([]);
// //   const [teams, setTeams] = useState([]);

// //   const [stats, setStats] = useState({
// //     players: 0,
// //     runs: 0,
// //     wickets: 0,
// //     active: 0,
// //   });

// //   const [search, setSearch] = useState("");
// //   const [teamFilter, setTeamFilter] = useState("ALL");
// //   const [roleFilter, setRoleFilter] = useState("ALL");

// //   const [loading, setLoading] = useState(true);
// //   const [saving, setSaving] = useState(false);
// //   const [error, setError] = useState("");

// //   const [modalOpen, setModalOpen] = useState(false);
// //   const [editingPlayer, setEditingPlayer] = useState(null);
// //   const [menuOpen, setMenuOpen] = useState(null);

// //   const [form, setForm] = useState(emptyForm);

// //   const user = JSON.parse(localStorage.getItem("user") || "{}");

// //   const role = getStoredRole();

// //   const canCreate = canManageCricket(role);
// //   const canEdit = canManageCricket(role);
// //   const canDelete = role === ROLES.ADMIN;

// //   // =========================================================
// //   // LOAD DATA
// //   // =========================================================

// //   const loadPlayers = async () => {
// //     try {
// //       setLoading(true);
// //       setError("");

// //       const response = await playerAPI.getAll();

// //       setPlayers(response.data?.data || response.data || []);
// //     } catch (err) {
// //       console.error("Failed to load players:", err);

// //       setError(
// //         err.response?.data?.message || "Unable to load players from server.",
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const loadStats = async () => {
// //     try {
// //       const response = await playerAPI.getStats();

// //       setStats({
// //         players: response.data?.players ?? 0,
// //         runs: response.data?.runs ?? 0,
// //         wickets: response.data?.wickets ?? 0,
// //         active: response.data?.active ?? 0,
// //       });
// //     } catch (err) {
// //       console.error("Failed to load player statistics:", err);
// //     }
// //   };

// //   const loadTeams = async () => {
// //     try {
// //       const response = await playerAPI.getTeams();

// //       setTeams(response.data || []);
// //     } catch (err) {
// //       console.error("Failed to load teams:", err);
// //     }
// //   };

// //   const loadAllData = async () => {
// //     await Promise.all([loadPlayers(), loadStats(), loadTeams()]);
// //   };

// //   useEffect(() => {
// //     loadAllData();
// //   }, []);

// //   // =========================================================
// //   // CLIENT-SIDE FILTERING
// //   // =========================================================

// //   const filteredPlayers = useMemo(() => {
// //     const query = search.trim().toLowerCase();

// //     return players.filter((player) => {
// //       const matchesSearch =
// //         !query ||
// //         player.name?.toLowerCase().includes(query) ||
// //         player.team?.toLowerCase().includes(query) ||
// //         player.city?.toLowerCase().includes(query);

// //       const matchesTeam = teamFilter === "ALL" || player.team === teamFilter;

// //       const matchesRole = roleFilter === "ALL" || player.role === roleFilter;

// //       return matchesSearch && matchesTeam && matchesRole;
// //     });
// //   }, [players, search, teamFilter, roleFilter]);

// //   // =========================================================
// //   // CREATE
// //   // =========================================================

// //   const openCreateModal = () => {
// //     setEditingPlayer(null);
// //     setForm(emptyForm);
// //     setModalOpen(true);
// //   };

// //   // =========================================================
// //   // EDIT
// //   // =========================================================

// //   const openEditModal = (player) => {
// //     setEditingPlayer(player);

// //     setForm({
// //       name: player.name || "",
// //       team: player.team || "",
// //       role: player.role || "",
// //       battingStyle: player.battingStyle || "Right Hand",
// //       bowlingStyle: player.bowlingStyle || "",
// //       city: player.city || "",
// //     });

// //     setMenuOpen(null);
// //     setModalOpen(true);
// //   };

// //   // =========================================================
// //   // CLOSE MODAL
// //   // =========================================================

// //   const closeModal = () => {
// //     if (saving) return;

// //     setModalOpen(false);
// //     setEditingPlayer(null);
// //     setForm(emptyForm);
// //   };

// //   // =========================================================
// //   // FORM CHANGE
// //   // =========================================================

// //   const handleChange = (event) => {
// //     const { name, value } = event.target;

// //     setForm((previous) => ({
// //       ...previous,
// //       [name]: value,
// //     }));
// //   };

// //   // =========================================================
// //   // CREATE / UPDATE
// //   // =========================================================

// //   const handleSubmit = async (event) => {
// //     event.preventDefault();

// //     if (
// //       !form.name.trim() ||
// //       !form.team.trim() ||
// //       !form.role ||
// //       !form.city.trim()
// //     ) {
// //       alert("Please fill all required fields.");
// //       return;
// //     }

// //     try {
// //       setSaving(true);

// //       if (editingPlayer) {
// //         const response = await playerAPI.update(editingPlayer.id, form);

// //         setPlayers((previous) =>
// //           previous.map((player) =>
// //             player.id === editingPlayer.id ? response.data : player,
// //           ),
// //         );

// //         alert("Player updated successfully.");
// //       } else {
// //         const response = await playerAPI.create(form);

// //         setPlayers((previous) => [response.data, ...previous]);

// //         alert("Player added successfully.");
// //       }

// //       await Promise.all([loadStats(), loadTeams()]);

// //       closeModal();
// //     } catch (err) {
// //       console.error("Player save failed:", err);

// //       alert(
// //         err.response?.data?.message ||
// //           err.response?.data ||
// //           "Failed to save player.",
// //       );
// //     } finally {
// //       setSaving(false);
// //     }
// //   };

// //   // =========================================================
// //   // DELETE
// //   // =========================================================

// //   const handleDelete = async (id) => {
// //     const player = players.find((item) => item.id === id);

// //     if (!player) return;

// //     const confirmed = window.confirm(`Delete "${player.name}"?`);

// //     if (!confirmed) return;

// //     try {
// //       await playerAPI.delete(id);

// //       setPlayers((previous) => previous.filter((item) => item.id !== id));

// //       setMenuOpen(null);

// //       await Promise.all([loadStats(), loadTeams()]);

// //       alert("Player deleted successfully.");
// //     } catch (err) {
// //       console.error("Player delete failed:", err);

// //       alert(err.response?.data?.message || "Failed to delete player.");
// //     }
// //   };

// //   // =========================================================
// //   // VIEW
// //   // =========================================================

// //   const handleView = (player) => {
// //     setMenuOpen(null);

// //     alert(
// //       `Player Profile\n\n` +
// //         `Name: ${player.name}\n` +
// //         `Team: ${player.team}\n` +
// //         `Role: ${player.role}\n` +
// //         `City: ${player.city}\n` +
// //         `Matches: ${player.matches}\n` +
// //         `Runs: ${player.runs}\n` +
// //         `Wickets: ${player.wickets}`,
// //     );
// //   };

// //   // =========================================================
// //   // RESET FILTERS
// //   // =========================================================

// //   const clearFilters = () => {
// //     setSearch("");
// //     setTeamFilter("ALL");
// //     setRoleFilter("ALL");
// //   };

// //   // =========================================================
// //   // UI
// //   // =========================================================

// //   return (
// //     <div className="players-page">
// //       {/* =====================================================
// //           HEADER
// //       ===================================================== */}

// //       <div className="page-header">
// //         <div>
// //           <div className="page-eyebrow">
// //             <Users size={15} />
// //             PLAYER MANAGEMENT
// //           </div>

// //           <h1>Players</h1>

// //           <p>
// //             Manage player profiles, teams, roles and performance statistics.
// //           </p>
// //         </div>

// //         <div
// //           style={{
// //             display: "flex",
// //             gap: "10px",
// //             alignItems: "center",
// //           }}
// //         >
// //           <button
// //             className="secondary-btn"
// //             onClick={loadAllData}
// //             disabled={loading}
// //           >
// //             <RefreshCw size={17} className={loading ? "spin-animation" : ""} />
// //             Refresh
// //           </button>

// //           {canCreate && (
// //             <button className="primary-btn" onClick={openCreateModal}>
// //               <Plus size={18} />
// //               Add Player
// //             </button>
// //           )}
// //         </div>
// //       </div>

// //       {/* =====================================================
// //           STATS
// //       ===================================================== */}

// //       <div className="player-stats">
// //         <PlayerStat
// //           icon={<Users size={20} />}
// //           label="Total Players"
// //           value={stats.players}
// //           detail="Registered players"
// //         />

// //         <PlayerStat
// //           icon={<Activity size={20} />}
// //           label="Total Runs"
// //           value={stats.runs}
// //           detail="Combined batting runs"
// //         />

// //         <PlayerStat
// //           icon={<Target size={20} />}
// //           label="Total Wickets"
// //           value={stats.wickets}
// //           detail="Combined wickets"
// //         />

// //         <PlayerStat
// //           icon={<Shield size={20} />}
// //           label="Active Players"
// //           value={stats.active}
// //           detail="Currently playing"
// //         />
// //       </div>

// //       {/* =====================================================
// //           TOOLBAR
// //       ===================================================== */}

// //       <div className="players-toolbar">
// //         <div className="search-box">
// //           <Search size={18} />

// //           <input
// //             placeholder="Search player, team or city..."
// //             value={search}
// //             onChange={(e) => setSearch(e.target.value)}
// //           />

// //           {search && (
// //             <button className="clear-search" onClick={() => setSearch("")}>
// //               <X size={15} />
// //             </button>
// //           )}
// //         </div>

// //         <div className="player-filters">
// //           {/* TEAM */}

// //           <div className="select-wrapper">
// //             <select
// //               value={teamFilter}
// //               onChange={(e) => setTeamFilter(e.target.value)}
// //             >
// //               <option value="ALL">All Teams</option>

// //               {teams.map((team) => (
// //                 <option key={team} value={team}>
// //                   {team}
// //                 </option>
// //               ))}
// //             </select>

// //             <ChevronDown size={15} />
// //           </div>

// //           {/* ROLE */}

// //           <div className="select-wrapper">
// //             <select
// //               value={roleFilter}
// //               onChange={(e) => setRoleFilter(e.target.value)}
// //             >
// //               <option value="ALL">All Roles</option>

// //               <option value="BATTER">Batter</option>

// //               <option value="BOWLER">Bowler</option>

// //               <option value="ALL ROUNDER">All Rounder</option>

// //               <option value="WICKET KEEPER">Wicket Keeper</option>
// //             </select>

// //             <ChevronDown size={15} />
// //           </div>
// //         </div>
// //       </div>

// //       {/* =====================================================
// //           RESULT HEADER
// //       ===================================================== */}

// //       <div className="result-header">
// //         <div>
// //           <span className="result-title">Player Squad</span>

// //           <span className="result-count">{filteredPlayers.length} players</span>
// //         </div>

// //         {(search || teamFilter !== "ALL" || roleFilter !== "ALL") && (
// //           <button className="reset-filter" onClick={clearFilters}>
// //             Clear filters
// //           </button>
// //         )}
// //       </div>

// //       {/* =====================================================
// //           LOADING
// //       ===================================================== */}

// //       {loading ? (
// //         <div className="empty-state">
// //           <div className="empty-icon">
// //             <Activity size={30} />
// //           </div>

// //           <h3>Loading players...</h3>

// //           <p>Fetching player data from the server.</p>
// //         </div>
// //       ) : error ? (
// //         /* ===================================================
// //            ERROR
// //         =================================================== */

// //         <div className="empty-state">
// //           <div className="empty-icon">
// //             <X size={30} />
// //           </div>

// //           <h3>Unable to load players</h3>

// //           <p>{error}</p>

// //           <button className="primary-btn" onClick={loadAllData}>
// //             <RefreshCw size={17} />
// //             Retry
// //           </button>
// //         </div>
// //       ) : filteredPlayers.length > 0 ? (
// //         /* ===================================================
// //            PLAYER GRID
// //         =================================================== */

// //         <div className="players-grid">
// //           {filteredPlayers.map((player) => (
// //             <div className="player-card" key={player.id}>
// //               {/* TOP */}

// //               <div className="player-card-top">
// //                 <div className="player-avatar">
// //                   {player.shortName || getInitials(player.name)}
// //                 </div>

// //                 <div className="player-info">
// //                   <span className="player-team">{player.team}</span>

// //                   <h2>{player.name}</h2>
// //                 </div>

// //                 {(canEdit || canDelete) && (
// //                   <div className="player-menu">
// //                     <button
// //                       className="icon-btn"
// //                       onClick={() =>
// //                         setMenuOpen(menuOpen === player.id ? null : player.id)
// //                       }
// //                     >
// //                       <MoreVertical size={18} />
// //                     </button>

// //                     {menuOpen === player.id && (
// //                       <div className="dropdown-menu">
// //                         <button onClick={() => handleView(player)}>
// //                           <Eye size={15} />
// //                           View
// //                         </button>

// //                         {canEdit && (
// //                           <button onClick={() => openEditModal(player)}>
// //                             <Pencil size={15} />
// //                             Edit
// //                           </button>
// //                         )}

// //                         {canDelete && (
// //                           <button
// //                             className="danger-action"
// //                             onClick={() => handleDelete(player.id)}
// //                           >
// //                             <Trash2 size={15} />
// //                             Delete
// //                           </button>
// //                         )}
// //                       </div>
// //                     )}
// //                   </div>
// //                 )}
// //               </div>

// //               {/* ROLE */}

// //               <div className="player-role-row">
// //                 <span
// //                   className={`player-role role-${String(player.role || "")
// //                     .toLowerCase()
// //                     .replaceAll(" ", "-")}`}
// //                 >
// //                   {player.role}
// //                 </span>

// //                 <span className="player-location">
// //                   <MapPin size={12} />

// //                   {player.city}
// //                 </span>
// //               </div>

// //               {/* PLAYING STYLE */}

// //               <div className="playing-style">
// //                 <div>
// //                   <small>BATTING</small>

// //                   <strong>{player.battingStyle || "Not specified"}</strong>
// //                 </div>

// //                 <div>
// //                   <small>BOWLING</small>

// //                   <strong>{player.bowlingStyle || "Not specified"}</strong>
// //                 </div>
// //               </div>

// //               {/* PERFORMANCE */}

// //               <div className="player-performance">
// //                 <div>
// //                   <span>Matches</span>

// //                   <strong>{player.matches ?? 0}</strong>
// //                 </div>

// //                 <div>
// //                   <span>Runs</span>

// //                   <strong className="runs-value">{player.runs ?? 0}</strong>
// //                 </div>

// //                 <div>
// //                   <span>Wickets</span>

// //                   <strong className="wickets-value">
// //                     {player.wickets ?? 0}
// //                   </strong>
// //                 </div>
// //               </div>

// //               {/* FOOTER */}

// //               <div className="player-card-footer">
// //                 <span
// //                   className={`team-status status-${String(
// //                     player.status || "",
// //                   ).toLowerCase()}`}
// //                 >
// //                   <span />
// //                   {player.status}
// //                 </span>

// //                 <button className="view-btn" onClick={() => handleView(player)}>
// //                   Profile
// //                   <Eye size={14} />
// //                 </button>
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       ) : (
// //         /* ===================================================
// //            EMPTY
// //         =================================================== */

// //         <div className="empty-state">
// //           <div className="empty-icon">
// //             <Users size={30} />
// //           </div>

// //           <h3>
// //             {players.length === 0
// //               ? "No players registered"
// //               : "No players found"}
// //           </h3>

// //           <p>
// //             {players.length === 0
// //               ? "Add your first player to get started."
// //               : "Try changing your search or filters."}
// //           </p>

// //           {players.length === 0 && canCreate ? (
// //             <button className="primary-btn" onClick={openCreateModal}>
// //               <Plus size={18} />
// //               Add Player
// //             </button>
// //           ) : (
// //             (search || teamFilter !== "ALL" || roleFilter !== "ALL") && (
// //               <button className="secondary-btn" onClick={clearFilters}>
// //                 Clear filters
// //               </button>
// //             )
// //           )}
// //         </div>
// //       )}

// //       {/* =====================================================
// //           MODAL
// //       ===================================================== */}

// //       {modalOpen && (
// //         <div className="modal-backdrop" onClick={closeModal}>
// //           <div
// //             className="tournament-modal"
// //             onClick={(e) => e.stopPropagation()}
// //           >
// //             {/* MODAL HEADER */}

// //             <div className="modal-header">
// //               <div>
// //                 <span className="modal-eyebrow">
// //                   {editingPlayer ? "EDIT PLAYER" : "NEW PLAYER"}
// //                 </span>

// //                 <h2>{editingPlayer ? "Edit Player" : "Add Player"}</h2>

// //                 <p>Enter player registration and playing information.</p>
// //               </div>

// //               <button
// //                 className="modal-close"
// //                 onClick={closeModal}
// //                 disabled={saving}
// //               >
// //                 <X size={20} />
// //               </button>
// //             </div>

// //             {/* FORM */}

// //             <form onSubmit={handleSubmit}>
// //               <div className="form-grid">
// //                 {/* NAME */}

// //                 <div className="form-field full">
// //                   <label>Player Name *</label>

// //                   <input
// //                     name="name"
// //                     value={form.name}
// //                     onChange={handleChange}
// //                     placeholder="e.g. Rahul Patil"
// //                     disabled={saving}
// //                   />
// //                 </div>

// //                 {/* TEAM */}

// //                 <div className="form-field">
// //                   <label>Team *</label>

// //                   <select
// //                     name="team"
// //                     value={form.team}
// //                     onChange={handleChange}
// //                     disabled={saving}
// //                   >
// //                     <option value="">Select team</option>

// //                     {teams.map((team) => (
// //                       <option key={team} value={team}>
// //                         {team}
// //                       </option>
// //                     ))}
// //                   </select>

// //                   {teams.length === 0 && (
// //                     <small>No teams available. Create a team first.</small>
// //                   )}
// //                 </div>

// //                 {/* ROLE */}

// //                 <div className="form-field">
// //                   <label>Player Role *</label>

// //                   <select
// //                     name="role"
// //                     value={form.role}
// //                     onChange={handleChange}
// //                     disabled={saving}
// //                   >
// //                     <option value="">Select role</option>

// //                     <option value="BATTER">Batter</option>

// //                     <option value="BOWLER">Bowler</option>

// //                     <option value="ALL ROUNDER">All Rounder</option>

// //                     <option value="WICKET KEEPER">Wicket Keeper</option>
// //                   </select>
// //                 </div>

// //                 {/* BATTING STYLE */}

// //                 <div className="form-field">
// //                   <label>Batting Style</label>

// //                   <select
// //                     name="battingStyle"
// //                     value={form.battingStyle}
// //                     onChange={handleChange}
// //                     disabled={saving}
// //                   >
// //                     <option value="Right Hand">Right Hand</option>

// //                     <option value="Left Hand">Left Hand</option>
// //                   </select>
// //                 </div>

// //                 {/* BOWLING STYLE */}

// //                 <div className="form-field">
// //                   <label>Bowling Style</label>

// //                   <input
// //                     name="bowlingStyle"
// //                     value={form.bowlingStyle}
// //                     onChange={handleChange}
// //                     placeholder="e.g. Right Arm Fast"
// //                     disabled={saving}
// //                   />
// //                 </div>

// //                 {/* CITY */}

// //                 <div className="form-field">
// //                   <label>City *</label>

// //                   <input
// //                     name="city"
// //                     value={form.city}
// //                     onChange={handleChange}
// //                     placeholder="e.g. Aurangabad"
// //                     disabled={saving}
// //                   />
// //                 </div>
// //               </div>

// //               {/* ACTIONS */}

// //               <div className="modal-actions">
// //                 <button
// //                   type="button"
// //                   className="secondary-btn"
// //                   onClick={closeModal}
// //                   disabled={saving}
// //                 >
// //                   Cancel
// //                 </button>

// //                 <button type="submit" className="primary-btn" disabled={saving}>
// //                   {saving ? (
// //                     <>
// //                       <Activity size={17} className="spin-animation" />
// //                       Saving...
// //                     </>
// //                   ) : editingPlayer ? (
// //                     <>
// //                       <Pencil size={17} />
// //                       Save Changes
// //                     </>
// //                   ) : (
// //                     <>
// //                       <Plus size={17} />
// //                       Add Player
// //                     </>
// //                   )}
// //                 </button>
// //               </div>
// //             </form>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // // ===========================================================
// // // STAT CARD
// // // ===========================================================

// // function PlayerStat({ icon, label, value, detail }) {
// //   return (
// //     <div className="player-stat-card">
// //       <div className="player-stat-icon">{icon}</div>

// //       <div className="player-stat-info">
// //         <span>{label}</span>

// //         <strong>{Number(value || 0).toLocaleString()}</strong>

// //         <small>{detail}</small>
// //       </div>
// //     </div>
// //   );
// // }

// // // ===========================================================
// // // INITIALS
// // // ===========================================================

// // function getInitials(name) {
// //   if (!name) return "PL";

// //   return name
// //     .trim()
// //     .split(/\s+/)
// //     .map((word) => word[0])
// //     .join("")
// //     .slice(0, 2)
// //     .toUpperCase();
// // }

// // export default Players;
