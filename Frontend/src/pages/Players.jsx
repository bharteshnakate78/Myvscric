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

  if (data?.data && typeof data.data === "object") return data.data;

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

  return {
    ...player,
    id: player.id ?? player.playerId,
    name: player.name || player.playerName || player.fullName || "",
    team,
    teamId: player.teamId || player.team?.id || "",
    role: String(player.role || player.playerRole || "Batter").trim(),
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

  if (normalized === "bowler") return "role-bowler";

  return "role-batter";
}

function getRoleIcon(role) {
  const normalized = String(role || "").toLowerCase();

  if (normalized.includes("bowler")) return <Target size={14} />;
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

function getErrorMessage(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    (typeof err?.response?.data === "string" ? err.response.data : null) ||
    fallback
  );
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

  const [form, setForm] = useState({ ...EMPTY_FORM });

  const loadPlayers = async () => {
    try {
      const response = await playerAPI.getAll();
      setPlayers(getRecords(response).map(normalizePlayer).filter(Boolean));
    } catch (err) {
      console.error("Failed to load players:", err);
      throw new Error(
        getErrorMessage(err, "Unable to load players from server."),
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
      setTeams(normalizeTeams(getRecords(response)));
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
    const handleClickOutside = () => setMenuOpen(null);

    if (menuOpen !== null) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return players.filter((player) => {
      const matchesSearch =
        !query ||
        String(player.name || "")
          .toLowerCase()
          .includes(query) ||
        String(player.team || "")
          .toLowerCase()
          .includes(query) ||
        String(player.city || "")
          .toLowerCase()
          .includes(query) ||
        String(player.role || "")
          .toLowerCase()
          .includes(query);

      const matchesTeam =
        teamFilter === "ALL" ||
        String(player.team || "").toLowerCase() === teamFilter.toLowerCase();

      const matchesRole =
        roleFilter === "ALL" ||
        String(player.role || "").toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesTeam && matchesRole;
    });
  }, [players, search, teamFilter, roleFilter]);

  // Group filtered players by team, keeping API team order.
  const teamWisePlayers = useMemo(() => {
    const grouped = {};

    filteredPlayers.forEach((player) => {
      const teamName = player.team || "Unassigned Players";

      if (!grouped[teamName]) grouped[teamName] = [];
      grouped[teamName].push(player);
    });

    const orderedGroups = teams
      .filter((team) => grouped[team.name]?.length)
      .map((team) => ({
        teamName: team.name,
        players: grouped[team.name],
      }));

    Object.entries(grouped).forEach(([teamName, teamPlayers]) => {
      if (!orderedGroups.some((group) => group.teamName === teamName)) {
        orderedGroups.push({ teamName, players: teamPlayers });
      }
    });

    return orderedGroups;
  }, [filteredPlayers, teams]);

  const openCreateModal = () => {
    if (!canCreate) {
      setError("You do not have permission to add players.");
      return;
    }

    setEditingPlayer(null);
    setForm({ ...EMPTY_FORM });
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

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingPlayer(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Player name is required.";
    if (!form.team.trim()) return "Please select a team.";
    if (!form.role) return "Please select player role.";
    if (!form.city.trim()) return "City is required.";

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
        await playerAPI.update(editingPlayer.id, payload);
        setSuccess("Player updated successfully.");
      } else {
        await playerAPI.create(payload);
        setSuccess("Player added successfully.");
      }

      await Promise.all([loadPlayers(), loadStats(), loadTeams()]);

      setModalOpen(false);
      setEditingPlayer(null);
      setForm({ ...EMPTY_FORM });
    } catch (err) {
      console.error("Player save failed:", err);
      setError(getErrorMessage(err, "Failed to save player."));
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

    if (
      !window.confirm(
        `Delete "${player.name}"?\n\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

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
      setError(getErrorMessage(err, "Failed to delete player."));
    }
  };

  const handleView = (player) => {
    setMenuOpen(null);

    window.alert(
      `PLAYER PROFILE\n\n` +
        `Name: ${player.name || "-"}\n` +
        `Team: ${player.team || "-"}\n` +
        `Role: ${player.role || "-"}\n` +
        `City: ${player.city || "-"}\n` +
        `Matches: ${player.matches || 0}\n` +
        `Runs: ${player.runs || 0}\n` +
        `Wickets: ${player.wickets || 0}`,
    );
  };

  const clearFilters = () => {
    setSearch("");
    setTeamFilter("ALL");
    setRoleFilter("ALL");
  };

  const hasFilters =
    Boolean(search) || teamFilter !== "ALL" || roleFilter !== "ALL";

  return (
    <div className="players-page">
      <style>{`
        .players-page {
          --p-bg: #0b1016;
          --p-surface: #111923;
          --p-card: #141e29;
          --p-border: rgba(255,255,255,.09);
          --p-muted: #94a3b8;
          --p-text: #edf2f7;
          --p-accent: #a3e635;
          color: var(--p-text);
          min-height: 100%;
          padding: 30px;
          background: var(--p-bg);
        }
        .players-page * { box-sizing: border-box; }
        .page-header { margin-bottom: 28px; }
        .header-content {
          display:flex; align-items:center; justify-content:space-between;
          gap:20px; flex-wrap:wrap;
        }
        .page-eyebrow {
          display:flex; align-items:center; gap:9px; color:var(--p-accent);
          font-size:11px; font-weight:800; letter-spacing:2px;
        }
        .eyebrow-line { width:24px; height:2px; background:var(--p-accent); }
        .page-header h1 { margin:12px 0 8px; font-size:clamp(27px,4vw,38px); letter-spacing:-1px; }
        .page-header h1 span { color:var(--p-accent); }
        .page-header p { margin:0; color:var(--p-muted); font-size:14px; }
        .header-actions { display:flex; gap:10px; flex-wrap:wrap; }
        .players-page button, .players-page input, .players-page select { font:inherit; }
        .players-page button { cursor:pointer; }
        .primary-btn,.secondary-btn,.save-btn,.cancel-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:9px;
          border-radius:10px; padding:11px 15px; font-size:13px; font-weight:700;
          transition: .2s ease;
        }
        .primary-btn,.save-btn {
          color:#10150a; background:var(--p-accent); border:1px solid var(--p-accent);
        }
        .primary-btn:hover,.save-btn:hover { filter:brightness(1.08); transform:translateY(-1px); }
        .secondary-btn,.cancel-btn {
          color:var(--p-text); background:#151e28; border:1px solid var(--p-border);
        }
        .secondary-btn:hover,.cancel-btn:hover { border-color:var(--p-accent); }
        .players-page button:disabled { opacity:.55; cursor:not-allowed; }
        .players-alert {
          display:flex; align-items:center; gap:10px; padding:13px 15px;
          border-radius:11px; margin-bottom:22px; font-size:13px;
        }
        .players-alert span { flex:1; }
        .players-alert button { display:grid; place-items:center; color:inherit; background:none; border:0; }
        .alert-error { color:#fecaca; background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.25); }
        .alert-success { color:#d9f99d; background:rgba(163,230,53,.08); border:1px solid rgba(163,230,53,.22); }
        .player-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:15px; margin-bottom:25px; }
        .player-stat-card {
          display:flex; align-items:center; gap:14px; min-width:0; padding:19px;
          border:1px solid var(--p-border); border-radius:15px;
          background:linear-gradient(145deg,#141e29,#101720);
        }
        .player-stat-icon {
          display:grid; place-items:center; width:45px; height:45px; flex-shrink:0;
          color:var(--p-accent); border-radius:12px; background:rgba(163,230,53,.09);
        }
        .player-stat-info { display:flex; flex-direction:column; gap:4px; min-width:0; }
        .player-stat-info span { color:var(--p-muted); font-size:12px; }
        .player-stat-info strong { font-size:25px; letter-spacing:-.6px; }
        .player-stat-info small { color:#718096; font-size:11px; }
        .players-toolbar {
          display:flex; justify-content:space-between; gap:14px; flex-wrap:wrap;
          padding:15px; margin-bottom:25px; border:1px solid var(--p-border);
          border-radius:14px; background:#101720;
        }
        .search-box {
          display:flex; align-items:center; gap:10px; flex:1; min-width:220px;
          max-width:450px; padding:0 12px; color:var(--p-muted);
          border:1px solid var(--p-border); border-radius:10px; background:#0b1118;
        }
        .search-box input {
          width:100%; min-width:0; padding:12px 0; color:var(--p-text);
          border:0; outline:0; background:transparent; font-size:13px;
        }
        .search-box input::placeholder { color:#657386; }
        .clear-search { display:grid; place-items:center; color:var(--p-muted); background:none; border:0; }
        .player-filters { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .select-wrapper,.form-select { position:relative; display:flex; align-items:center; }
        .select-wrapper select {
          appearance:none; min-width:130px; padding:11px 33px 11px 12px;
          color:var(--p-text); border:1px solid var(--p-border); border-radius:10px;
          background:#151e28; outline:0; font-size:12px;
        }
        .select-wrapper svg,.form-select svg {
          position:absolute; right:11px; pointer-events:none; color:var(--p-muted);
        }
        .players-page select option { background:#111923; color:#edf2f7; }
        .reset-filter {
          display:flex; align-items:center; gap:5px; color:var(--p-muted);
          border:0; background:transparent; font-size:12px;
        }
        .result-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:17px; }
        .result-title { display:flex; align-items:center; gap:10px; font-size:18px; font-weight:750; }
        .result-count { padding:3px 9px; border-radius:20px; color:var(--p-accent); background:rgba(163,230,53,.1); font-size:12px; }
        .result-header p { margin:5px 0 0; color:var(--p-muted); font-size:12px; }
        .team-wise-player-list { display:flex; flex-direction:column; gap:30px; }
        .team-player-section { min-width:0; }
        .team-player-heading {
          display:flex; align-items:center; justify-content:space-between; gap:16px;
          margin-bottom:16px; padding:17px 19px; border:1px solid var(--p-border);
          border-radius:15px; background:linear-gradient(110deg,#17222d,#101720);
        }
        .team-player-title { display:flex; align-items:center; gap:13px; min-width:0; }
        .team-player-icon {
          display:grid; place-items:center; width:44px; height:44px; flex-shrink:0;
          border-radius:12px; color:var(--p-accent); background:rgba(163,230,53,.09);
        }
        .team-player-title h2 { margin:0; font-size:17px; font-weight:750; }
        .team-player-title p { margin:5px 0 0; color:var(--p-muted); font-size:12px; }
        .team-player-count {
          display:inline-flex; align-items:center; gap:7px; flex-shrink:0;
          padding:8px 11px; border:1px solid rgba(163,230,53,.2);
          border-radius:30px; color:var(--p-accent); background:rgba(163,230,53,.06);
          font-size:12px; font-weight:700;
        }
        .players-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
        .player-card {
          position:relative; min-width:0; overflow:visible; padding:18px;
          border:1px solid var(--p-border); border-radius:16px;
          background:linear-gradient(150deg,#151f2b,#101720);
          transition:transform .2s ease,border-color .2s ease;
        }
        .player-card:hover { transform:translateY(-3px); border-color:rgba(163,230,53,.3); }
        .player-card-glow { position:absolute; top:0; right:20px; width:70px; height:2px; background:var(--p-accent); opacity:.45; }
        .player-card-top,.player-identity,.player-role-row,.player-card-footer {
          display:flex; align-items:center; justify-content:space-between; gap:12px;
        }
        .player-identity { justify-content:flex-start; min-width:0; }
        .player-avatar {
          display:grid; place-items:center; width:47px; height:47px; flex-shrink:0;
          border:1px solid rgba(163,230,53,.2); border-radius:14px;
          color:var(--p-accent); background:rgba(163,230,53,.09); font-weight:800;
        }
        .player-info { min-width:0; }
        .player-info h3 { overflow:hidden; margin:0 0 6px; font-size:14px; text-overflow:ellipsis; white-space:nowrap; }
        .player-team,.player-location { display:flex; align-items:center; gap:5px; color:var(--p-muted); font-size:11px; }
        .player-menu-wrapper { position:relative; flex-shrink:0; }
        .icon-btn {
          display:grid; place-items:center; width:34px; height:34px;
          color:var(--p-muted); border:1px solid transparent; border-radius:9px; background:transparent;
        }
        .icon-btn:hover { color:var(--p-accent); border-color:var(--p-border); background:rgba(255,255,255,.04); }
        .dropdown-menu {
          position:absolute; top:38px; right:0; z-index:20; min-width:170px; padding:6px;
          border:1px solid var(--p-border); border-radius:11px; background:#182330;
          box-shadow:0 14px 40px rgba(0,0,0,.4);
        }
        .dropdown-menu button {
          display:flex; align-items:center; gap:9px; width:100%; padding:10px;
          color:var(--p-text); border:0; border-radius:7px; background:transparent;
          text-align:left; font-size:12px;
        }
        .dropdown-menu button:hover { background:rgba(255,255,255,.06); }
        .dropdown-menu .danger-action { color:#fca5a5; }
        .player-role-row { margin:19px 0; flex-wrap:wrap; }
        .player-role { display:inline-flex; align-items:center; gap:6px; padding:6px 9px; border-radius:8px; font-size:11px; font-weight:700; }
        .role-batter { color:#93c5fd; background:rgba(59,130,246,.1); }
        .role-bowler { color:#fca5a5; background:rgba(239,68,68,.1); }
        .role-all-rounder { color:#d8b4fe; background:rgba(168,85,247,.1); }
        .role-wicket-keeper { color:#fcd34d; background:rgba(245,158,11,.1); }
        .playing-style { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px; padding:13px 0; border-top:1px solid var(--p-border); border-bottom:1px solid var(--p-border); }
        .style-item { display:flex; flex-direction:column; gap:6px; min-width:0; }
        .style-item span,.performance-item span { color:var(--p-muted); font-size:10px; }
        .style-item strong { overflow:hidden; font-size:11px; text-overflow:ellipsis; white-space:nowrap; }
        .style-divider { width:1px; height:28px; background:var(--p-border); }
        .player-performance { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:17px 0; }
        .performance-item { display:flex; flex-direction:column; gap:6px; }
        .performance-item strong { font-size:17px; }
        .runs-value { color:var(--p-accent); }
        .wickets-value { color:#93c5fd; }
        .player-card-footer { padding-top:13px; border-top:1px solid var(--p-border); }
        .team-status { display:flex; align-items:center; gap:7px; color:var(--p-muted); font-size:11px; }
        .status-dot { width:7px; height:7px; border-radius:50%; }
        .status-active { background:#a3e635; box-shadow:0 0 9px rgba(163,230,53,.35); }
        .status-inactive { background:#64748b; }
        .view-btn { display:flex; align-items:center; gap:6px; padding:7px 10px; color:var(--p-accent); border:1px solid rgba(163,230,53,.2); border-radius:8px; background:rgba(163,230,53,.06); font-size:11px; font-weight:700; }
        .view-btn:hover { background:rgba(163,230,53,.13); }
        .loading-state,.empty-state {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          padding:65px 20px; text-align:center; border:1px dashed var(--p-border);
          border-radius:16px; background:rgba(255,255,255,.015);
        }
        .loading-spinner,.empty-icon { display:grid; place-items:center; width:60px; height:60px; margin-bottom:14px; color:var(--p-accent); border-radius:18px; background:rgba(163,230,53,.08); }
        .loading-state h3,.empty-state h3 { margin:0 0 8px; font-size:17px; }
        .loading-state p,.empty-state p { margin:0 0 18px; color:var(--p-muted); font-size:13px; }
        .spin-icon { animation:p-spin 1s linear infinite; }
        @keyframes p-spin { to { transform:rotate(360deg); } }
        .modal-backdrop {
          position:fixed; inset:0; z-index:1000; display:flex; align-items:center;
          justify-content:center; overflow-y:auto; padding:22px;
          background:rgba(2,6,12,.78); backdrop-filter:blur(8px);
        }
        .tournament-modal {
          width:100%; max-width:650px; max-height:calc(100vh - 44px); overflow-y:auto;
          border:1px solid rgba(255,255,255,.12); border-radius:19px;
          background:#111923; box-shadow:0 30px 100px rgba(0,0,0,.5);
        }
        .modal-header { display:flex; align-items:flex-start; justify-content:space-between; gap:15px; padding:24px 25px; border-bottom:1px solid var(--p-border); }
        .modal-eyebrow { display:flex; align-items:center; gap:7px; color:var(--p-accent); font-size:10px; font-weight:800; letter-spacing:1.5px; }
        .modal-header h2 { margin:10px 0 7px; font-size:23px; }
        .modal-header p { margin:0; color:var(--p-muted); font-size:12px; line-height:1.5; }
        .modal-close { display:grid; place-items:center; width:36px; height:36px; flex-shrink:0; color:var(--p-muted); border:1px solid var(--p-border); border-radius:10px; background:#17212c; }
        .modal-close:hover { color:var(--p-text); }
        .modal-error { display:flex; align-items:center; gap:8px; margin:18px 24px 0; padding:11px; color:#fecaca; border:1px solid rgba(239,68,68,.2); border-radius:9px; background:rgba(239,68,68,.08); font-size:12px; }
        .player-form { padding:23px 25px 25px; }
        .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
        .form-field { display:flex; flex-direction:column; gap:8px; min-width:0; }
        .form-field.full-width { grid-column:1/-1; }
        .form-field label { color:#cbd5e1; font-size:12px; font-weight:650; }
        .form-field label span { margin-left:4px; color:#fb7185; }
        .form-field input,.form-select select {
          width:100%; min-width:0; padding:12px; color:var(--p-text);
          border:1px solid var(--p-border); border-radius:9px; outline:0;
          background:#0b1118; font-size:12px;
        }
        .form-field input:focus,.form-select select:focus { border-color:rgba(163,230,53,.6); box-shadow:0 0 0 3px rgba(163,230,53,.06); }
        .form-select select { appearance:none; padding-right:36px; }
        .form-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:25px; padding-top:18px; border-top:1px solid var(--p-border); }
        @media(max-width:1100px) { .players-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .player-stats { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media(max-width:650px) {
          .players-page { padding:18px 13px; }
          .players-grid { grid-template-columns:1fr; }
          .player-stats { grid-template-columns:1fr 1fr; gap:9px; }
          .player-stat-card { padding:13px; gap:10px; }
          .player-stat-icon { width:37px; height:37px; }
          .player-stat-info strong { font-size:21px; }
          .players-toolbar { padding:11px; }
          .search-box { max-width:none; }
          .player-filters { width:100%; }
          .select-wrapper { flex:1; min-width:0; }
          .select-wrapper select { width:100%; min-width:0; }
          .team-player-heading { align-items:flex-start; flex-direction:column; }
          .team-player-count { margin-left:57px; }
          .modal-backdrop { padding:10px; }
          .modal-header,.player-form { padding:18px; }
          .form-grid { grid-template-columns:1fr; }
          .form-field.full-width { grid-column:auto; }
        }
      `}</style>

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

      {(error || success) && (
        <div
          className={`players-alert ${error ? "alert-error" : "alert-success"}`}
        >
          {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{error || success}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => {
              setError("");
              setSuccess("");
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

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
              <X size={15} /> Clear
            </button>
          )}
        </div>
      </section>

      <div className="result-header">
        <div>
          <div className="result-title">
            Players{" "}
            <span className="result-count">{filteredPlayers.length}</span>
          </div>
          <p>
            {hasFilters
              ? "Showing filtered player results"
              : "All registered cricket players, grouped by team"}
          </p>
        </div>
      </div>

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
          ) : canCreate ? (
            <button
              type="button"
              className="primary-btn"
              onClick={openCreateModal}
            >
              <Plus size={17} /> Add First Player
            </button>
          ) : null}
        </div>
      ) : (
        <div className="team-wise-player-list">
          {teamWisePlayers.map(({ teamName, players: teamPlayers }) => (
            <section className="team-player-section" key={teamName}>
              <div className="team-player-heading">
                <div className="team-player-title">
                  <div className="team-player-icon">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h2>{teamName}</h2>
                    <p>Registered squad members</p>
                  </div>
                </div>
                <span className="team-player-count">
                  <Users size={15} />
                  {teamPlayers.length}{" "}
                  {teamPlayers.length === 1 ? "Player" : "Players"}
                </span>
              </div>

              <div className="players-grid">
                {teamPlayers.map((player) => (
                  <article
                    className="player-card"
                    key={player.id ?? player.name}
                  >
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
                          aria-label={`Actions for ${player.name}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setMenuOpen(
                              menuOpen === player.id ? null : player.id,
                            );
                          }}
                        >
                          <MoreVertical size={19} />
                        </button>

                        {menuOpen === player.id && (
                          <div
                            className="dropdown-menu"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleView(player)}
                            >
                              <Eye size={16} /> View Profile
                            </button>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => openEditModal(player)}
                              >
                                <Pencil size={16} /> Edit Player
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                className="danger-action"
                                onClick={() => handleDelete(player.id)}
                              >
                                <Trash2 size={16} /> Delete Player
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="player-role-row">
                      <span
                        className={`player-role ${getRoleClass(player.role)}`}
                      >
                        {getRoleIcon(player.role)} {player.role || "Batter"}
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
                        <strong className="wickets-value">
                          {player.wickets}
                        </strong>
                      </div>
                    </div>

                    <div className="player-card-footer">
                      <div className="team-status">
                        <span
                          className={`status-dot ${player.status === "ACTIVE" ? "status-active" : "status-inactive"}`}
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
                        View <Eye size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="tournament-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="player-modal-title"
          >
            <div className="modal-header">
              <div>
                <div className="modal-eyebrow">
                  <UserRound size={14} /> PLAYER MANAGEMENT
                </div>
                <h2 id="player-modal-title">
                  {editingPlayer ? "Edit Player" : "Add New Player"}
                </h2>
                <p>
                  {editingPlayer
                    ? "Update player profile and playing information."
                    : "Create a new player profile for your squad."}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
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
                    Player Name <span>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Virat Kohli"
                    disabled={saving}
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>
                    Team <span>*</span>
                  </label>
                  <div className="form-select">
                    <select
                      name="team"
                      value={form.team}
                      onChange={handleChange}
                      disabled={saving}
                      required
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
                    Player Role <span>*</span>
                  </label>
                  <div className="form-select">
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      disabled={saving}
                      required
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
                    City <span>*</span>
                  </label>
                  <div className="form-select">
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai"
                      disabled={saving}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw size={17} className="spin-icon" /> Saving...
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
//     const refreshOnFocus = () => loadAllData();
//     window.addEventListener("focus", refreshOnFocus);
//     return () => window.removeEventListener("focus", refreshOnFocus);
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
