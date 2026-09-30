import React, { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  UserPlus,
  MapPin,
  CalendarDays,
  Shield,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  RefreshCw,
  User,
  Crown,
  ClipboardList,
} from "lucide-react";

import { tournamentAPI, teamAPI, playerAPI } from "../services/api";

const STEPS = [
  { id: 1, title: "Tournament", icon: Trophy },
  { id: 2, title: "Teams", icon: Shield },
  { id: 3, title: "Players", icon: UserPlus },
  { id: 4, title: "Review", icon: CheckCircle2 },
];

const EMPTY_TOURNAMENT = {
  name: "",
  shortName: "",
  format: "T20",
  location: "",
  startDate: "",
  endDate: "",
  organizer: "",
};

const createTeam = () => ({
  id: `temp-team-${Date.now()}-${Math.random()}`,
  name: "",
  captain: "",
  coach: "",
  players: [],
});

const createPlayer = () => ({
  id: `temp-player-${Date.now()}-${Math.random()}`,
  name: "",
  role: "BATSMAN",
});

const normalizeTournament = (item) => ({
  ...item,
  id: item.id,
  name: item.name ?? item.tournamentName ?? "",
  shortName: item.shortName ?? "",
  format: item.format ?? "T20",
  location: item.location ?? "",
  startDate: item.startDate ?? "",
  endDate: item.endDate ?? "",
  organizer: item.organizer ?? "",
  teams: item.teams ?? [],
});

const normalizeTeam = (item) => ({
  ...item,
  id: item.id,
  name: item.name ?? item.teamName ?? "",
  captain: item.captain ?? "",
  coach: item.coach ?? "",
  tournamentId: item.tournamentId ? Number(item.tournamentId) : null,
  players: item.players ?? [],
});

const formatDate = (date) => {
  if (!date) return "-";

  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
};

function Tournaments() {
  const [tournaments, setTournaments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);

  const [step, setStep] = useState(1);

  const [form, setForm] = useState(EMPTY_TOURNAMENT);

  const [teams, setTeams] = useState([createTeam(), createTeam()]);

  const [activeTeam, setActiveTeam] = useState(0);

  // --------------------------------------------------
  // LOAD TOURNAMENTS
  // --------------------------------------------------

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await tournamentAPI.getAll();

      const tournamentData = Array.isArray(response.data) ? response.data : [];

      const normalized = await Promise.all(
        tournamentData.map(async (item) => {
          const tournament = normalizeTournament(item);

          try {
            const teamResponse = await teamAPI.getByTournament(tournament.id);

            return {
              ...tournament,
              teams: Array.isArray(teamResponse.data)
                ? teamResponse.data.map(normalizeTeam)
                : [],
            };
          } catch {
            return {
              ...tournament,
              teams: [],
            };
          }
        }),
      );

      setTournaments(normalized);
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Unable to load tournaments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  // --------------------------------------------------
  // FILTER
  // --------------------------------------------------

  const filteredTournaments = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return tournaments;

    return tournaments.filter((tournament) =>
      [
        tournament.name,
        tournament.shortName,
        tournament.location,
        tournament.format,
        tournament.organizer,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [tournaments, search]);

  // --------------------------------------------------
  // MODAL
  // --------------------------------------------------

  const resetModal = () => {
    setForm(EMPTY_TOURNAMENT);
    setTeams([createTeam(), createTeam()]);
    setActiveTeam(0);
    setStep(1);
    setEditingTournament(null);
    setError("");
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetModal();
  };

  const openCreate = () => {
    resetModal();
    setShowModal(true);
  };

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  const openEdit = async (tournament) => {
    try {
      setError("");
      setSuccess("");

      const teamResponse = await teamAPI.getByTournament(tournament.id);

      const loadedTeams = Array.isArray(teamResponse.data)
        ? teamResponse.data.map(normalizeTeam)
        : [];

      setEditingTournament(tournament);

      setForm({
        name: tournament.name || "",
        shortName: tournament.shortName || "",
        format: tournament.format || "T20",
        location: tournament.location || "",
        startDate: tournament.startDate || "",
        endDate: tournament.endDate || "",
        organizer: tournament.organizer || "",
      });

      setTeams(loadedTeams.length ? loadedTeams : [createTeam(), createTeam()]);

      setActiveTeam(0);
      setStep(1);
      setShowModal(true);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message || "Unable to load tournament teams.",
      );
    }
  };

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateTeam = (index, field, value) => {
    setTeams((previous) =>
      previous.map((team, teamIndex) =>
        teamIndex === index
          ? {
              ...team,
              [field]: value,
            }
          : team,
      ),
    );
  };

  const addTeam = () => {
    const newIndex = teams.length;

    setTeams((previous) => [...previous, createTeam()]);

    setActiveTeam(newIndex);
  };

  const removeTeam = (index) => {
    if (teams.length <= 2) {
      setError("A tournament must have at least 2 teams.");
      return;
    }

    setTeams((previous) =>
      previous.filter((_, teamIndex) => teamIndex !== index),
    );

    setActiveTeam((previous) =>
      Math.max(0, Math.min(previous, teams.length - 2)),
    );
  };

  // --------------------------------------------------
  // PLAYERS
  // --------------------------------------------------

  const addPlayer = (teamIndex) => {
    setTeams((previous) =>
      previous.map((team, index) =>
        index === teamIndex
          ? {
              ...team,
              players: [...(team.players || []), createPlayer()],
            }
          : team,
      ),
    );
  };

  const updatePlayer = (teamIndex, playerIndex, field, value) => {
    setTeams((previous) =>
      previous.map((team, index) => {
        if (index !== teamIndex) return team;

        return {
          ...team,
          players: (team.players || []).map((player, pIndex) =>
            pIndex === playerIndex
              ? {
                  ...player,
                  [field]: value,
                }
              : player,
          ),
        };
      }),
    );
  };

  const removePlayer = (teamIndex, playerIndex) => {
    setTeams((previous) =>
      previous.map((team, index) =>
        index === teamIndex
          ? {
              ...team,
              players: team.players.filter(
                (_, pIndex) => pIndex !== playerIndex,
              ),
            }
          : team,
      ),
    );
  };

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

  const validateStep = () => {
    setError("");

    if (step === 1) {
      if (!form.name.trim()) {
        setError("Tournament name is required.");
        return false;
      }

      if (!form.shortName.trim()) {
        setError("Short name is required.");
        return false;
      }

      if (!form.location.trim()) {
        setError("Location is required.");
        return false;
      }

      if (!form.startDate) {
        setError("Start date is required.");
        return false;
      }

      return true;
    }

    if (step === 2) {
      if (teams.length < 2) {
        setError("Add at least 2 teams.");
        return false;
      }

      for (let i = 0; i < teams.length; i++) {
        if (!teams[i].name.trim()) {
          setError(`Team ${i + 1} name is required.`);
          setActiveTeam(i);
          return false;
        }
      }

      return true;
    }

    if (step === 3) {
      for (let i = 0; i < teams.length; i++) {
        const players = teams[i].players || [];

        for (let j = 0; j < players.length; j++) {
          if (!players[j].name.trim()) {
            setError(`Player ${j + 1} in ${teams[i].name} needs a name.`);
            setActiveTeam(i);
            return false;
          }
        }
      }

      return true;
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;

    setStep((previous) => Math.min(4, previous + 1));
  };

  const previousStep = () => {
    setError("");

    setStep((previous) => Math.max(1, previous - 1));
  };

  // --------------------------------------------------
  // CREATE
  // --------------------------------------------------

  const handleCreate = async () => {
    if (!validateStep()) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // 1. CREATE TOURNAMENT

      // const tournamentPayload = {
      //   tournamentName: form.name.trim(),
      //   shortName: form.shortName.trim(),
      //   format: form.format,
      //   location: form.location.trim(),
      //   startDate: form.startDate,
      //   endDate: form.endDate || null,
      //   organizer: form.organizer.trim() || null,
      // };

      const tournamentPayload = {
        tournamentName: form.name.trim(),
        shortName: form.shortName.trim(),
        format: form.format,
        location: form.location.trim(),
        startDate: form.startDate,
        endDate: form.endDate || null,
        organizer: form.organizer.trim() || null,
      };

      console.log("CREATING TOURNAMENT:", tournamentPayload);

      const tournamentResponse = await tournamentAPI.create(tournamentPayload);

      const createdTournament = tournamentResponse.data;

      const tournamentId = Number(createdTournament.id);

      if (!tournamentId) {
        throw new Error("Tournament created but ID was not returned.");
      }

      // 2. CREATE TEAMS

      const createdTeams = [];

      for (const team of teams) {
        const teamPayload = {
          teamName: team.name.trim(),
          captain: team.captain?.trim() || null,
          coach: team.coach?.trim() || null,
          tournamentId: tournamentId,
        };

        console.log("CREATING TEAM:", teamPayload);

        const response = await teamAPI.create(teamPayload);

        const createdTeam = response.data;

        createdTeams.push(createdTeam);

        // 3. CREATE PLAYERS

        for (const player of team.players || []) {
          if (!player.name?.trim()) continue;

          const playerPayload = {
            name: player.name.trim(),
            role: player.role,
            teamId: Number(createdTeam.id),
          };

          console.log("CREATING PLAYER:", playerPayload);

          await playerAPI.create(playerPayload);
        }
      }

      // 4. VERIFY TEAMS

      const verification = await teamAPI.getByTournament(tournamentId);

      console.log("VERIFIED TEAMS:", verification.data);

      await loadTournaments();

      setSuccess("Tournament, teams and players created successfully.");

      setShowModal(false);
      resetModal();
    } catch (err) {
      console.error("CREATE TOURNAMENT ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Unable to create tournament.",
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // UPDATE
  // --------------------------------------------------

  const handleUpdate = async () => {
    if (!validateStep()) return;

    try {
      setSaving(true);
      setError("");

      const tournamentId = Number(editingTournament.id);

      const tournamentPayload = {
        tournamentName: form.name.trim(),
        shortName: form.shortName.trim(),
        format: form.format,
        location: form.location.trim(),
        startDate: form.startDate,
        endDate: form.endDate || null,
        organizer: form.organizer.trim() || null,
      };

      await tournamentAPI.update(tournamentId, tournamentPayload);

      for (const team of teams) {
        let teamId;

        if (
          typeof team.id === "number" ||
          !String(team.id).startsWith("temp-team")
        ) {
          teamId = Number(team.id);

          await teamAPI.update(teamId, {
            teamName: team.name.trim(),
            captain: team.captain?.trim() || null,
            coach: team.coach?.trim() || null,
            tournamentId,
          });
        } else {
          const response = await teamAPI.create({
            teamName: team.name.trim(),
            captain: team.captain?.trim() || null,
            coach: team.coach?.trim() || null,
            tournamentId,
          });

          teamId = Number(response.data.id);
        }

        for (const player of team.players || []) {
          if (!player.name?.trim()) continue;

          const playerPayload = {
            name: player.name.trim(),
            role: player.role,
            teamId,
          };

          const isExistingPlayer =
            typeof player.id === "number" ||
            !String(player.id).startsWith("temp-player");

          if (isExistingPlayer) {
            await playerAPI.update(Number(player.id), playerPayload);
          } else {
            await playerAPI.create(playerPayload);
          }
        }
      }

      await loadTournaments();

      setSuccess("Tournament updated successfully.");

      setShowModal(false);
      resetModal();
    } catch (err) {
      console.error("UPDATE TOURNAMENT ERROR:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Unable to update tournament.",
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // SAVE
  // --------------------------------------------------

  const handleSave = async () => {
    if (step !== 4) {
      if (!validateStep()) return;

      setStep(4);
      return;
    }

    if (editingTournament) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this tournament?",
    );

    if (!confirmed) return;

    try {
      setDeleting(id);
      setError("");

      await tournamentAPI.delete(id);

      setTournaments((previous) =>
        previous.filter((tournament) => tournament.id !== id),
      );

      setSuccess("Tournament deleted successfully.");
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Unable to delete tournament.");
    } finally {
      setDeleting(null);
    }
  };

  // --------------------------------------------------
  // STATS
  // --------------------------------------------------

  const totalTeams = tournaments.reduce(
    (sum, tournament) => sum + (tournament.teams?.length || 0),
    0,
  );

  const totalPlayers = tournaments.reduce(
    (sum, tournament) =>
      sum +
      (tournament.teams || []).reduce(
        (teamSum, team) => teamSum + (team.players?.length || 0),
        0,
      ),
    0,
  );

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="tournaments-page">
      {/* HEADER */}

      <div className="tournaments-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            CRICKET MANAGEMENT
          </div>

          <h1>
            Tournaments
            <span>.</span>
          </h1>

          <p>Create, manage and organize your cricket tournaments.</p>
        </div>

        <button className="create-tournament-btn" onClick={openCreate}>
          <Plus size={19} />
          Create Tournament
        </button>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="alert-box error">
          <AlertCircle size={19} />
          <span>{String(error)}</span>

          <button onClick={() => setError("")}>
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert-box success">
          <CheckCircle2 size={19} />
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
            <Trophy size={22} />
          </div>

          <div>
            <span>Total Tournaments</span>
            <strong>{tournaments.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Shield size={22} />
          </div>

          <div>
            <span>Total Teams</span>
            <strong>{totalTeams}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Total Players</span>
            <strong>{totalPlayers}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ClipboardList size={22} />
          </div>

          <div>
            <span>Formats</span>
            <strong>{new Set(tournaments.map((t) => t.format)).size}</strong>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}

      <div className="tournament-toolbar">
        <div className="search-box">
          <Search size={19} />

          <input
            type="text"
            placeholder="Search tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button onClick={() => setSearch("")}>
              <X size={16} />
            </button>
          )}
        </div>

        <button
          className="refresh-btn"
          onClick={loadTournaments}
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      {/* CONTENT */}

      {loading ? (
        <div className="loading-state">
          <Loader2 size={38} className="spin" />

          <p>Loading tournaments...</p>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Trophy size={34} />
          </div>

          <h2>{search ? "No tournaments found" : "No tournaments yet"}</h2>

          <p>
            {search
              ? "Try another search term."
              : "Create your first tournament to get started."}
          </p>

          {!search && (
            <button className="create-tournament-btn" onClick={openCreate}>
              <Plus size={18} />
              Create Tournament
            </button>
          )}
        </div>
      ) : (
        <div className="tournament-grid">
          {filteredTournaments.map((tournament) => (
            <div className="tournament-card" key={tournament.id}>
              <div className="card-glow" />

              <div className="card-top">
                <div className="trophy-box">
                  <Trophy size={23} />
                </div>

                <div className="card-actions">
                  <button onClick={() => openEdit(tournament)} title="Edit">
                    <Pencil size={17} />
                  </button>

                  <button
                    className="delete-action"
                    onClick={() => handleDelete(tournament.id)}
                    disabled={deleting === tournament.id}
                    title="Delete"
                  >
                    {deleting === tournament.id ? (
                      <Loader2 size={17} className="spin" />
                    ) : (
                      <Trash2 size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div className="tournament-title">
                <h2>{tournament.name}</h2>

                <span>{tournament.shortName}</span>
              </div>

              <div className="tournament-meta">
                <div>
                  <MapPin size={16} />
                  {tournament.location || "Location not set"}
                </div>

                <div>
                  <CalendarDays size={16} />
                  {formatDate(tournament.startDate)}
                </div>
              </div>

              <div className="card-divider" />

              <div className="card-footer">
                <div className="format-pill">{tournament.format}</div>

                <div className="team-count">
                  <Users size={16} />
                  <strong>{tournament.teams?.length || 0}</strong>
                  <span>Teams</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="tournament-modal">
            {/* MODAL HEADER */}

            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  {editingTournament ? "EDIT TOURNAMENT" : "NEW TOURNAMENT"}
                </div>

                <h2>
                  {editingTournament
                    ? "Update Tournament"
                    : "Create Tournament"}
                </h2>

                <p>Build your tournament, teams and players.</p>
              </div>

              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            {/* STEPPER */}

            <div className="stepper">
              {STEPS.map((item, index) => {
                const Icon = item.icon;

                const active = step === item.id;

                const completed = step > item.id;

                return (
                  <React.Fragment key={item.id}>
                    <button
                      className={`step-item ${active ? "active" : ""} ${
                        completed ? "completed" : ""
                      }`}
                      onClick={() => {
                        if (item.id < step) {
                          setStep(item.id);
                        }
                      }}
                    >
                      <div className="step-circle">
                        {completed ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <Icon size={18} />
                        )}
                      </div>

                      <span>{item.title}</span>
                    </button>

                    {index < STEPS.length - 1 && (
                      <div
                        className={`step-line ${
                          step > item.id ? "filled" : ""
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* MODAL ALERT */}

            {error && (
              <div className="modal-error">
                <AlertCircle size={18} />
                {String(error)}
              </div>
            )}

            {/* CONTENT */}

            <div className="modal-content">
              {/* STEP 1 */}

              {step === 1 && (
                <div className="form-section">
                  <div className="section-heading">
                    <div className="section-icon">
                      <Trophy size={20} />
                    </div>

                    <div>
                      <h3>Tournament Details</h3>
                      <p>Enter the basic tournament information.</p>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="field full">
                      <label>Tournament Name</label>

                      <input
                        value={form.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                        placeholder="e.g. Nashik Premier League"
                      />
                    </div>

                    <div className="field">
                      <label>Short Name</label>

                      <input
                        value={form.shortName}
                        onChange={(e) =>
                          updateForm("shortName", e.target.value)
                        }
                        placeholder="e.g. NPL"
                      />
                    </div>

                    <div className="field">
                      <label>Format</label>

                      <select
                        value={form.format}
                        onChange={(e) => updateForm("format", e.target.value)}
                      >
                        <option value="T5">T5</option>
                        <option value="T10">T10</option>
                        <option value="T20">T20</option>
                        <option value="T25">T25</option>
                        <option value="T50">T50</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Location</label>

                      <input
                        value={form.location}
                        onChange={(e) => updateForm("location", e.target.value)}
                        placeholder="e.g. Nashik"
                      />
                    </div>

                    <div className="field">
                      <label>Organizer</label>

                      <input
                        value={form.organizer}
                        onChange={(e) =>
                          updateForm("organizer", e.target.value)
                        }
                        placeholder="Organizer name"
                      />
                    </div>

                    <div className="field">
                      <label>Start Date</label>

                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) =>
                          updateForm("startDate", e.target.value)
                        }
                      />
                    </div>

                    <div className="field">
                      <label>End Date</label>

                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => updateForm("endDate", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}

              {step === 2 && (
                <div className="form-section">
                  <div className="section-heading-row">
                    <div className="section-heading">
                      <div className="section-icon">
                        <Shield size={20} />
                      </div>

                      <div>
                        <h3>Tournament Teams</h3>
                        <p>Add all teams participating.</p>
                      </div>
                    </div>

                    <button className="small-add-btn" onClick={addTeam}>
                      <Plus size={17} />
                      Add Team
                    </button>
                  </div>

                  <div className="team-tabs">
                    {teams.map((team, index) => (
                      <button
                        key={team.id}
                        className={activeTeam === index ? "selected" : ""}
                        onClick={() => setActiveTeam(index)}
                      >
                        <span>{index + 1}</span>

                        {team.name || `Team ${index + 1}`}
                      </button>
                    ))}
                  </div>

                  {teams[activeTeam] && (
                    <div className="team-editor">
                      <div className="team-editor-header">
                        <div className="team-avatar">
                          <Shield size={25} />
                        </div>

                        <div>
                          <span>TEAM {activeTeam + 1}</span>

                          <h3>{teams[activeTeam].name || "New Team"}</h3>
                        </div>

                        {teams.length > 2 && (
                          <button
                            className="remove-team-btn"
                            onClick={() => removeTeam(activeTeam)}
                          >
                            <Trash2 size={17} />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="form-grid">
                        <div className="field full">
                          <label>Team Name</label>

                          <input
                            value={teams[activeTeam].name}
                            onChange={(e) =>
                              updateTeam(activeTeam, "name", e.target.value)
                            }
                            placeholder="e.g. Mumbai Warriors"
                          />
                        </div>

                        <div className="field">
                          <label>Captain</label>

                          <div className="input-icon">
                            <Crown size={17} />

                            <input
                              value={teams[activeTeam].captain}
                              onChange={(e) =>
                                updateTeam(
                                  activeTeam,
                                  "captain",
                                  e.target.value,
                                )
                              }
                              placeholder="Captain name"
                            />
                          </div>
                        </div>

                        <div className="field">
                          <label>Coach</label>

                          <div className="input-icon">
                            <User size={17} />

                            <input
                              value={teams[activeTeam].coach}
                              onChange={(e) =>
                                updateTeam(activeTeam, "coach", e.target.value)
                              }
                              placeholder="Coach name"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 */}

              {step === 3 && (
                <div className="form-section">
                  <div className="section-heading-row">
                    <div className="section-heading">
                      <div className="section-icon">
                        <Users size={20} />
                      </div>

                      <div>
                        <h3>Players</h3>
                        <p>Add players to each tournament team.</p>
                      </div>
                    </div>
                  </div>

                  <div className="player-team-list">
                    {teams.map((team, teamIndex) => (
                      <div className="player-team-card" key={team.id}>
                        <div className="player-team-header">
                          <div className="player-team-info">
                            <div className="mini-team-icon">
                              <Shield size={18} />
                            </div>

                            <div>
                              <h3>{team.name || `Team ${teamIndex + 1}`}</h3>

                              <span>{team.players?.length || 0} players</span>
                            </div>
                          </div>

                          <button
                            className="small-add-btn"
                            onClick={() => addPlayer(teamIndex)}
                          >
                            <Plus size={16} />
                            Add Player
                          </button>
                        </div>

                        {team.players?.length > 0 ? (
                          <div className="players-list">
                            {team.players.map((player, playerIndex) => (
                              <div className="player-row" key={player.id}>
                                <div className="player-number">
                                  {playerIndex + 1}
                                </div>

                                <input
                                  value={player.name}
                                  onChange={(e) =>
                                    updatePlayer(
                                      teamIndex,
                                      playerIndex,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Player name"
                                />

                                <select
                                  value={player.role}
                                  onChange={(e) =>
                                    updatePlayer(
                                      teamIndex,
                                      playerIndex,
                                      "role",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="BATSMAN">Batsman</option>
                                  <option value="BOWLER">Bowler</option>
                                  <option value="ALL_ROUNDER">
                                    All Rounder
                                  </option>
                                  <option value="WICKET_KEEPER">
                                    Wicket Keeper
                                  </option>
                                </select>

                                <button
                                  onClick={() =>
                                    removePlayer(teamIndex, playerIndex)
                                  }
                                >
                                  <X size={17} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="no-players">
                            <UserPlus size={25} />

                            <span>No players added yet</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4 */}

              {step === 4 && (
                <div className="form-section">
                  <div className="review-hero">
                    <div className="review-icon">
                      <CheckCircle2 size={34} />
                    </div>

                    <div>
                      <h3>
                        Ready to {editingTournament ? "update" : "create"}
                      </h3>

                      <p>Review everything before saving.</p>
                    </div>
                  </div>

                  <div className="review-card">
                    <div className="review-title">
                      <Trophy size={19} />

                      <span>Tournament</span>
                    </div>

                    <h2>{form.name}</h2>

                    <div className="review-meta">
                      <span>{form.shortName}</span>

                      <span>{form.format}</span>

                      <span>{form.location}</span>
                    </div>
                  </div>

                  <div className="review-stats">
                    <div>
                      <Shield size={20} />

                      <strong>{teams.length}</strong>

                      <span>Teams</span>
                    </div>

                    <div>
                      <Users size={20} />

                      <strong>
                        {teams.reduce(
                          (sum, team) => sum + (team.players || []).length,
                          0,
                        )}
                      </strong>

                      <span>Players</span>
                    </div>
                  </div>

                  <div className="review-teams">
                    {teams.map((team, index) => (
                      <div className="review-team" key={team.id}>
                        <div className="review-team-number">{index + 1}</div>

                        <div>
                          <strong>{team.name || "Unnamed Team"}</strong>

                          <span>{team.captain || "Captain not set"}</span>
                        </div>

                        <small>{team.players?.length || 0} players</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER */}

            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={step === 1 ? closeModal : previousStep}
                disabled={saving}
              >
                <ChevronLeft size={18} />

                {step === 1 ? "Cancel" : "Back"}
              </button>

              {step < 4 ? (
                <button
                  className="primary-btn"
                  onClick={nextStep}
                  disabled={saving}
                >
                  Continue
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  className="primary-btn save-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      {editingTournament
                        ? "Update Tournament"
                        : "Create Tournament"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tournaments;
