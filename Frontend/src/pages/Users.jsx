import React, { useEffect, useMemo, useState } from "react";

import {
  Search,
  Plus,
  Users as UsersIcon,
  Shield,
  Trophy,
  UserCog,
  ClipboardCheck,
  Pencil,
  Trash2,
  Power,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mail,
  LockKeyhole,
  User,
  ShieldCheck,
  MoreVertical,
} from "lucide-react";

import { userAPI } from "../services/api";
import {
  ROLES,
  ROLE_OPTIONS,
  normalizeRole,
  roleLabel,
} from "../constants/roles";

// =============================================================
// ROLE CONFIG
// =============================================================

const ROLE_CONFIG = {
  ADMIN: {
    label: "Administrator",
    shortLabel: "Admin",
    icon: Shield,
    className: "role-admin",
  },

  ORGANIZER: {
    label: "Organizer",
    shortLabel: "Organizer",
    icon: Trophy,
    className: "role-organizer",
  },

  SCORER: {
    label: "Scorer",
    shortLabel: "Scorer",
    icon: ClipboardCheck,
    className: "role-scorer",
  },

  USER: {
    label: "User",
    shortLabel: "User",
    icon: UserCog,
    className: "role-user",
  },
};

// =============================================================
// STATUS HELPER
// =============================================================

const isActiveUser = (user) => {
  if (typeof user?.enabled === "boolean") {
    return user.enabled;
  }

  return String(user?.status || "ACTIVE").toUpperCase() === "ACTIVE";
};

// =============================================================
// EMPTY FORM
// =============================================================

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: ROLES.USER,
  status: "ACTIVE",
};

// =============================================================
// USERS PAGE
// =============================================================

const Users = () => {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");

  // Selected user
  const [selectedUser, setSelectedUser] = useState(null);

  // Form
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Mobile action menu
  const [openMenuId, setOpenMenuId] = useState(null);

  // ===========================================================
  // LOAD USERS
  // ===========================================================

  const loadUsers = async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await userAPI.getAll();

      const data = response?.data;

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD USERS ERROR:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Unable to load users.";

      setError(typeof message === "string" ? message : "Unable to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ===========================================================
  // CLEAR NOTIFICATIONS
  // ===========================================================

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  // ===========================================================
  // FORM CHANGE
  // ===========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ===========================================================
  // OPEN CREATE
  // ===========================================================

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedUser(null);

    setFormData({
      ...EMPTY_FORM,
    });

    setShowPassword(false);
    setError("");
    setShowModal(true);
  };

  // ===========================================================
  // OPEN EDIT
  // ===========================================================

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);

    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: normalizeRole(user?.role),
      status:
        String(user?.status || "ACTIVE").toUpperCase() === "ACTIVE"
          ? "ACTIVE"
          : "INACTIVE",
    });

    setShowPassword(false);
    setError("");
    setShowModal(true);
    setOpenMenuId(null);
  };

  // ===========================================================
  // CLOSE MODAL
  // ===========================================================

  const closeModal = () => {
    if (submitting) return;

    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      ...EMPTY_FORM,
    });
    setShowPassword(false);
  };

  // ===========================================================
  // VALIDATE FORM
  // ===========================================================

  const validateForm = () => {
    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name) {
      return "Please enter the user's name.";
    }

    if (name.length < 2) {
      return "Name must contain at least 2 characters.";
    }

    if (!email) {
      return "Please enter an email address.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }

    if (modalMode === "create") {
      if (!formData.password) {
        return "Please enter a password.";
      }

      if (formData.password.length < 6) {
        return "Password must contain at least 6 characters.";
      }
    }

    if (!Object.values(ROLES).includes(formData.role)) {
      return "Please select a valid role.";
    }

    if (!["ACTIVE", "INACTIVE"].includes(formData.status)) {
      return "Please select a valid status.";
    }

    return "";
  };

  // ===========================================================
  // CREATE / UPDATE USER
  // ===========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: normalizeRole(formData.role),
        status: formData.status,
      };

      // Password is only sent when creating a user or
      // when the administrator explicitly enters a new password.
      if (modalMode === "create" || formData.password.trim()) {
        payload.password = formData.password;
      }

      let response;

      if (modalMode === "create") {
        response = await userAPI.create(payload);

        setSuccess("User account created successfully.");
      } else {
        response = await userAPI.update(selectedUser.id, payload);

        setSuccess("User account updated successfully.");
      }

      console.log(
        modalMode === "create" ? "USER CREATED:" : "USER UPDATED:",
        response?.data,
      );

      closeModal();

      await loadUsers(true);
    } catch (err) {
      console.error(
        modalMode === "create" ? "CREATE USER ERROR:" : "UPDATE USER ERROR:",
        err,
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        `Unable to ${modalMode === "create" ? "create" : "update"} user.`;

      setError(typeof message === "string" ? message : "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ===========================================================
  // TOGGLE STATUS
  // ===========================================================

  const handleToggleStatus = async (user) => {
    if (!user?.id) {
      setError("User ID is missing.");
      return;
    }

    setError("");
    setSuccess("");
    setOpenMenuId(null);

    const currentlyActive = isActiveUser(user);

    const actionText = currentlyActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${user.name || "this user"}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await userAPI.toggleStatus(user.id);

      setSuccess(
        currentlyActive
          ? "User deactivated successfully."
          : "User activated successfully.",
      );

      await loadUsers(true);
    } catch (err) {
      console.error("TOGGLE USER STATUS ERROR:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Unable to change user status.";

      setError(
        typeof message === "string" ? message : "Unable to change user status.",
      );
    }
  };

  // ===========================================================
  // DELETE
  // ===========================================================

  const openDeleteModal = (user) => {
    setDeleteUser(user);
    setOpenMenuId(null);
    setError("");
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteUser(null);
  };

  const handleDelete = async () => {
    if (!deleteUser?.id) {
      setError("User ID is missing.");
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      await userAPI.delete(deleteUser.id);

      setSuccess(`${deleteUser.name || "User"} deleted successfully.`);

      setDeleteUser(null);

      await loadUsers(true);
    } catch (err) {
      console.error("DELETE USER ERROR:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Unable to delete user.";

      setError(
        typeof message === "string" ? message : "Unable to delete user.",
      );
    } finally {
      setDeleting(false);
    }
  };

  // ===========================================================
  // FILTER USERS
  // ===========================================================

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        String(user?.name || "")
          .toLowerCase()
          .includes(query) ||
        String(user?.email || "")
          .toLowerCase()
          .includes(query);

      const userRole = normalizeRole(user?.role);

      const matchesRole = roleFilter === "ALL" || userRole === roleFilter;

      const active = isActiveUser(user);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && active) ||
        (statusFilter === "INACTIVE" && !active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // ===========================================================
  // STATISTICS
  // ===========================================================

  const stats = useMemo(() => {
    const total = users.length;

    const active = users.filter((user) => isActiveUser(user)).length;

    const inactive = total - active;

    const admins = users.filter(
      (user) => normalizeRole(user?.role) === ROLES.ADMIN,
    ).length;

    const organizers = users.filter(
      (user) => normalizeRole(user?.role) === ROLES.ORGANIZER,
    ).length;

    const scorers = users.filter(
      (user) => normalizeRole(user?.role) === ROLES.SCORER,
    ).length;

    const normalUsers = users.filter(
      (user) => normalizeRole(user?.role) === ROLES.USER,
    ).length;

    return {
      total,
      active,
      inactive,
      admins,
      organizers,
      scorers,
      normalUsers,
    };
  }, [users]);

  // ===========================================================
  // ROLE ICON
  // ===========================================================

  const RoleIcon = ({ role, size = 15 }) => {
    const normalizedRole = normalizeRole(role);

    const config = ROLE_CONFIG[normalizedRole] || ROLE_CONFIG.USER;

    const Icon = config.icon;

    return <Icon size={size} />;
  };

  // ===========================================================
  // USER INITIALS
  // ===========================================================

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  // ===========================================================
  // RENDER
  // ===========================================================

  return (
    <>
      <style>{`

        /* =====================================================
           PAGE
        ===================================================== */

        .users-page {
          min-height: 100%;
          width: 100%;

          padding: 28px;

          color: #0f172a;
        }

        .users-container {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .users-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;

          gap: 20px;

          margin-bottom: 25px;
        }

        .users-heading {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .users-heading-icon {
          width: 48px;
          height: 48px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 15px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4f46e5
            );

          color: white;

          box-shadow:
            0 10px 25px
            rgba(37,99,235,0.25);
        }

        .users-heading h1 {
          margin: 0;

          font-size: 27px;
          font-weight: 850;

          letter-spacing: -0.7px;

          color: #0f172a;
        }

        .users-heading p {
          margin: 4px 0 0;

          color: #64748b;

          font-size: 13px;
        }

        .users-add-btn {
          height: 45px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;

          padding: 0 17px;

          border: none;
          border-radius: 11px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4f46e5
            );

          color: white;

          font-size: 12px;
          font-weight: 800;

          cursor: pointer;

          box-shadow:
            0 10px 22px
            rgba(37,99,235,0.22);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .users-add-btn:hover {
          transform: translateY(-2px);

          box-shadow:
            0 14px 28px
            rgba(37,99,235,0.3);
        }

        /* =====================================================
           NOTIFICATIONS
        ===================================================== */

        .users-alert {
          display: flex;
          align-items: flex-start;

          gap: 10px;

          margin-bottom: 18px;

          padding: 13px 15px;

          border-radius: 12px;

          font-size: 12px;
          font-weight: 650;
        }

        .users-alert.error {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #be123c;
        }

        .users-alert.success {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
        }

        .users-alert button {
          margin-left: auto;

          display: flex;
          align-items: center;
          justify-content: center;

          width: 24px;
          height: 24px;

          border: none;
          border-radius: 6px;

          background: transparent;

          cursor: pointer;

          color: currentColor;
        }

        /* =====================================================
           STATS
        ===================================================== */

        .users-stats {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 15px;

          margin-bottom: 22px;
        }

        .user-stat-card {
          position: relative;

          padding: 18px;

          overflow: hidden;

          border-radius: 17px;

          background: rgba(255,255,255,0.86);

          border:
            1px solid
            #e2e8f0;

          box-shadow:
            0 8px 25px
            rgba(15,23,42,0.05);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .user-stat-card:hover {
          transform: translateY(-2px);

          box-shadow:
            0 13px 30px
            rgba(15,23,42,0.08);
        }

        .user-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 14px;
        }

        .user-stat-icon {
          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;
        }

        .stat-blue {
          background: #eff6ff;
          color: #2563eb;
        }

        .stat-green {
          background: #ecfdf5;
          color: #059669;
        }

        .stat-orange {
          background: #fff7ed;
          color: #ea580c;
        }

        .stat-purple {
          background: #f5f3ff;
          color: #7c3aed;
        }

        .user-stat-label {
          color: #64748b;

          font-size: 10px;
          font-weight: 800;

          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .user-stat-value {
          margin-top: 3px;

          color: #0f172a;

          font-size: 25px;
          font-weight: 850;
        }

        .user-stat-decoration {
          position: absolute;

          width: 80px;
          height: 80px;

          right: -30px;
          bottom: -35px;

          border-radius: 50%;

          background:
            rgba(59,130,246,0.06);
        }

        /* =====================================================
           MAIN CARD
        ===================================================== */

        .users-card {
          overflow: hidden;

          border-radius: 19px;

          background:
            rgba(255,255,255,0.92);

          border:
            1px solid
            #e2e8f0;

          box-shadow:
            0 15px 40px
            rgba(15,23,42,0.06);
        }

        /* =====================================================
           TOOLBAR
        ===================================================== */

        .users-toolbar {
          display: flex;
          align-items: center;

          gap: 11px;

          padding: 18px;

          border-bottom:
            1px solid
            #e8edf3;

          background:
            rgba(248,250,252,0.8);
        }

        .users-search {
          position: relative;

          flex: 1;

          min-width: 220px;
        }

        .users-search svg {
          position: absolute;

          left: 13px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #94a3b8;
        }

        .users-search input {
          width: 100%;
          height: 42px;

          padding:
            0 14px 0 40px;

          border-radius: 10px;

          border:
            1px solid
            #dbe2ea;

          outline: none;

          background: white;

          color: #0f172a;

          font-size: 12px;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .users-search input:focus {
          border-color: #60a5fa;

          box-shadow:
            0 0 0 3px
            rgba(59,130,246,0.08);
        }

        .users-filter {
          position: relative;
        }

        .users-filter select {
          height: 42px;

          min-width: 145px;

          padding:
            0 36px 0 12px;

          border-radius: 10px;

          border:
            1px solid
            #dbe2ea;

          outline: none;

          background: white;

          color: #334155;

          font-size: 11px;
          font-weight: 700;

          appearance: none;

          cursor: pointer;
        }

        .users-filter svg {
          position: absolute;

          right: 11px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #94a3b8;

          pointer-events: none;
        }

        .users-refresh-btn {
          width: 42px;
          height: 42px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 10px;

          border:
            1px solid
            #dbe2ea;

          background: white;

          color: #64748b;

          cursor: pointer;

          transition:
            color 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease;
        }

        .users-refresh-btn:hover {
          background: #eff6ff;
          color: #2563eb;
        }

        .users-refresh-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .refresh-spinning {
          animation:
            refreshSpin 0.8s linear infinite;
        }

        @keyframes refreshSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =====================================================
           TABLE
        ===================================================== */

        .users-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .users-table {
          width: 100%;

          border-collapse: collapse;

          min-width: 850px;
        }

        .users-table th {
          padding: 13px 18px;

          text-align: left;

          color: #64748b;

          background: #f8fafc;

          border-bottom:
            1px solid
            #e8edf3;

          font-size: 9px;
          font-weight: 850;

          text-transform: uppercase;

          letter-spacing: 0.7px;

          white-space: nowrap;
        }

        .users-table td {
          padding: 15px 18px;

          border-bottom:
            1px solid
            #eef2f6;

          vertical-align: middle;

          font-size: 12px;
        }

        .users-table tbody tr {
          transition:
            background 0.15s ease;
        }

        .users-table tbody tr:hover {
          background:
            rgba(248,250,252,0.85);
        }

        .users-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* =====================================================
           USER CELL
        ===================================================== */

        .user-cell {
          display: flex;
          align-items: center;

          gap: 11px;

          min-width: 190px;
        }

        .user-avatar {
          width: 39px;
          height: 39px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 12px;

          background:
            linear-gradient(
              135deg,
              #dbeafe,
              #e0e7ff
            );

          color: #3730a3;

          font-size: 12px;
          font-weight: 850;
        }

        .user-name {
          color: #0f172a;

          font-size: 12px;
          font-weight: 800;

          max-width: 190px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-id {
          margin-top: 3px;

          color: #94a3b8;

          font-size: 9px;
        }

        /* =====================================================
           EMAIL
        ===================================================== */

        .user-email {
          display: flex;
          align-items: center;

          gap: 6px;

          color: #475569;

          white-space: nowrap;
        }

        .user-email svg {
          color: #94a3b8;
        }

        /* =====================================================
           ROLE BADGE
        ===================================================== */

        .role-badge {
          width: fit-content;

          display: inline-flex;
          align-items: center;

          gap: 6px;

          padding: 6px 9px;

          border-radius: 8px;

          font-size: 9px;
          font-weight: 850;

          white-space: nowrap;
        }

        .role-admin {
          background: #fef2f2;
          color: #dc2626;
        }

        .role-organizer {
          background: #fff7ed;
          color: #ea580c;
        }

        .role-scorer {
          background: #eff6ff;
          color: #2563eb;
        }

        .role-user {
          background: #f1f5f9;
          color: #475569;
        }

        /* =====================================================
           STATUS
        ===================================================== */

        .status-badge {
          width: fit-content;

          display: inline-flex;
          align-items: center;

          gap: 6px;

          padding: 6px 9px;

          border-radius: 999px;

          font-size: 9px;
          font-weight: 850;
        }

        .status-active {
          background: #ecfdf5;
          color: #047857;
        }

        .status-inactive {
          background: #f1f5f9;
          color: #64748b;
        }

        .status-dot {
          width: 6px;
          height: 6px;

          border-radius: 50%;

          background: currentColor;
        }

        /* =====================================================
           ACTIONS
        ===================================================== */

        .user-actions {
          display: flex;
          align-items: center;

          justify-content: flex-end;

          gap: 6px;
        }

        .user-action-btn {
          width: 32px;
          height: 32px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid #e2e8f0;

          border-radius: 8px;

          background: white;

          color: #64748b;

          cursor: pointer;

          transition:
            color 0.18s ease,
            background 0.18s ease,
            border-color 0.18s ease;
        }

        .user-action-btn.edit:hover {
          color: #2563eb;
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .user-action-btn.power:hover {
          color: #059669;
          background: #ecfdf5;
          border-color: #a7f3d0;
        }

        .user-action-btn.delete:hover {
          color: #dc2626;
          background: #fef2f2;
          border-color: #fecaca;
        }

        /* =====================================================
           EMPTY
        ===================================================== */

        .users-empty {
          padding: 65px 20px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          text-align: center;
        }

        .users-empty-icon {
          width: 60px;
          height: 60px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 14px;

          border-radius: 18px;

          background: #f1f5f9;

          color: #94a3b8;
        }

        .users-empty h3 {
          margin: 0;

          color: #334155;

          font-size: 15px;
          font-weight: 800;
        }

        .users-empty p {
          margin: 5px 0 0;

          color: #94a3b8;

          font-size: 11px;
        }

        /* =====================================================
           LOADING
        ===================================================== */

        .users-loading {
          padding: 65px 20px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          color: #64748b;
        }

        .loading-spinner {
          width: 31px;
          height: 31px;

          margin-bottom: 12px;

          border-radius: 50%;

          border:
            3px solid
            #dbeafe;

          border-top-color:
            #2563eb;

          animation:
            refreshSpin 0.7s linear infinite;
        }

        .users-loading span {
          font-size: 11px;
          font-weight: 700;
        }

        /* =====================================================
           MODAL OVERLAY
        ===================================================== */

        .users-modal-overlay {
          position: fixed;

          inset: 0;

          z-index: 1000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          background:
            rgba(2,6,23,0.62);

          backdrop-filter:
            blur(8px);

          animation:
            modalFade 0.2s ease-out;
        }

        @keyframes modalFade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        /* =====================================================
           MODAL
        ===================================================== */

        .users-modal {
          width: 100%;
          max-width: 540px;

          max-height: 92vh;

          overflow-y: auto;

          border-radius: 22px;

          background: white;

          box-shadow:
            0 30px 100px
            rgba(0,0,0,0.3);

          animation:
            modalSlide 0.25s ease-out;
        }

        @keyframes modalSlide {
          from {
            opacity: 0;
            transform:
              translateY(15px)
              scale(0.98);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        .users-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 21px 23px;

          border-bottom:
            1px solid
            #e8edf3;
        }

        .users-modal-title {
          display: flex;
          align-items: center;

          gap: 11px;
        }

        .users-modal-title-icon {
          width: 39px;
          height: 39px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background: #eff6ff;

          color: #2563eb;
        }

        .users-modal-title h2 {
          margin: 0;

          color: #0f172a;

          font-size: 17px;
          font-weight: 850;
        }

        .users-modal-title p {
          margin: 3px 0 0;

          color: #94a3b8;

          font-size: 9px;
        }

        .users-modal-close {
          width: 33px;
          height: 33px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: none;

          border-radius: 9px;

          background: #f8fafc;

          color: #64748b;

          cursor: pointer;

          transition:
            background 0.18s ease,
            color 0.18s ease;
        }

        .users-modal-close:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        /* =====================================================
           FORM
        ===================================================== */

        .users-modal-body {
          padding: 23px;
        }

        .users-form {
          display: flex;
          flex-direction: column;

          gap: 17px;
        }

        .users-form-row {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 13px;
        }

        .users-form-field {
          display: flex;
          flex-direction: column;
        }

        .users-form-label {
          margin-bottom: 7px;

          color: #334155;

          font-size: 10px;
          font-weight: 850;
        }

        .users-input-wrap {
          position: relative;
        }

        .users-input-wrap > svg {
          position: absolute;

          left: 12px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #94a3b8;

          pointer-events: none;
        }

        .users-form-input,
        .users-form-select {
          width: 100%;
          height: 45px;

          padding:
            0 38px;

          border:
            1px solid
            #dbe2ea;

          border-radius: 10px;

          outline: none;

          background: #f8fafc;

          color: #0f172a;

          font-size: 11px;

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .users-form-select {
          padding-left: 38px;
          padding-right: 35px;

          appearance: none;

          cursor: pointer;
        }

        .users-form-input:focus,
        .users-form-select:focus {
          background: white;

          border-color: #60a5fa;

          box-shadow:
            0 0 0 3px
            rgba(59,130,246,0.08);
        }

        .users-select-arrow {
          position: absolute;

          right: 11px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #94a3b8;

          pointer-events: none;
        }

        .users-password-toggle {
          position: absolute;

          right: 7px;
          top: 50%;

          transform:
            translateY(-50%);

          width: 31px;
          height: 31px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: none;
          border-radius: 7px;

          background: transparent;

          color: #94a3b8;

          cursor: pointer;
        }

        .users-password-toggle:hover {
          background: #eff6ff;
          color: #2563eb;
        }

        .users-form-help {
          margin-top: 5px;

          color: #94a3b8;

          font-size: 9px;
          line-height: 1.4;
        }

        /* =====================================================
           SECURITY INFO
        ===================================================== */

        .users-security-box {
          display: flex;
          align-items: flex-start;

          gap: 10px;

          padding: 12px;

          border-radius: 11px;

          background:
            linear-gradient(
              135deg,
              #eff6ff,
              #f5f3ff
            );

          border:
            1px solid
            #dbeafe;
        }

        .users-security-icon {
          width: 30px;
          height: 30px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 8px;

          background: #dbeafe;

          color: #2563eb;
        }

        .users-security-box strong {
          display: block;

          margin-bottom: 3px;

          color: #1e3a8a;

          font-size: 10px;
          font-weight: 850;
        }

        .users-security-box span {
          color: #526b91;

          font-size: 9px;

          line-height: 1.45;
        }

        /* =====================================================
           MODAL FOOTER
        ===================================================== */

        .users-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;

          gap: 9px;

          padding: 17px 23px;

          border-top:
            1px solid
            #e8edf3;

          background: #f8fafc;
        }

        .users-cancel-btn {
          height: 41px;

          padding: 0 16px;

          border-radius: 9px;

          border:
            1px solid
            #dbe2ea;

          background: white;

          color: #475569;

          font-size: 10px;
          font-weight: 800;

          cursor: pointer;
        }

        .users-cancel-btn:hover {
          background: #f1f5f9;
        }

        .users-save-btn {
          height: 41px;

          min-width: 125px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          padding: 0 16px;

          border: none;

          border-radius: 9px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4f46e5
            );

          color: white;

          font-size: 10px;
          font-weight: 850;

          cursor: pointer;

          box-shadow:
            0 7px 17px
            rgba(37,99,235,0.2);
        }

        .users-save-btn:hover {
          filter: brightness(1.05);
        }

        .users-save-btn:disabled,
        .users-cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-spinner {
          width: 15px;
          height: 15px;

          border-radius: 50%;

          border:
            2px solid
            rgba(255,255,255,0.35);

          border-top-color: white;

          animation:
            refreshSpin 0.7s linear infinite;
        }

        /* =====================================================
           DELETE MODAL
        ===================================================== */

        .delete-modal {
          width: 100%;
          max-width: 410px;

          padding: 26px;

          border-radius: 20px;

          background: white;

          box-shadow:
            0 30px 100px
            rgba(0,0,0,0.3);

          animation:
            modalSlide 0.25s ease-out;
        }

        .delete-icon {
          width: 50px;
          height: 50px;

          display: flex;
          align-items: center;
          justify-content: center;

          margin-bottom: 15px;

          border-radius: 15px;

          background: #fef2f2;

          color: #dc2626;
        }

        .delete-modal h3 {
          margin: 0;

          color: #0f172a;

          font-size: 17px;
          font-weight: 850;
        }

        .delete-modal p {
          margin: 7px 0 0;

          color: #64748b;

          font-size: 11px;

          line-height: 1.55;
        }

        .delete-user-name {
          color: #0f172a;
          font-weight: 800;
        }

        .delete-warning {
          margin-top: 15px;

          padding: 11px 12px;

          border-radius: 10px;

          background: #fff7ed;

          border:
            1px solid
            #fed7aa;

          color: #9a3412;

          font-size: 9px;
          font-weight: 650;

          line-height: 1.5;
        }

        .delete-actions {
          display: flex;
          justify-content: flex-end;

          gap: 8px;

          margin-top: 21px;
        }

        .delete-cancel {
          height: 39px;

          padding: 0 15px;

          border:
            1px solid
            #dbe2ea;

          border-radius: 9px;

          background: white;

          color: #475569;

          font-size: 10px;
          font-weight: 800;

          cursor: pointer;
        }

        .delete-confirm {
          height: 39px;

          min-width: 100px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          padding: 0 15px;

          border: none;

          border-radius: 9px;

          background: #dc2626;

          color: white;

          font-size: 10px;
          font-weight: 850;

          cursor: pointer;
        }

        .delete-confirm:hover {
          background: #b91c1c;
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 950px) {

          .users-stats {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

        }

        @media (max-width: 700px) {

          .users-page {
            padding: 18px 13px;
          }

          .users-header {
            flex-direction: column;
          }

          .users-add-btn {
            width: 100%;
          }

          .users-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .users-search {
            min-width: 0;
          }

          .users-filter {
            width: 100%;
          }

          .users-filter select {
            width: 100%;
          }

          .users-refresh-btn {
            width: 100%;
          }

          .users-form-row {
            grid-template-columns: 1fr;
          }

        }

        @media (max-width: 500px) {

          .users-stats {
            grid-template-columns: 1fr;
          }

          .users-heading h1 {
            font-size: 23px;
          }

          .users-modal-overlay {
            padding: 10px;
          }

          .users-modal {
            max-height: 95vh;
            border-radius: 18px;
          }

          .users-modal-body {
            padding: 18px;
          }

          .users-modal-footer {
            padding: 14px 18px;
          }

        }

      `}</style>

      <div className="users-page">
        <div className="users-container">
          {/* ===================================================
              HEADER
          =================================================== */}

          <div className="users-header">
            <div className="users-heading">
              <div className="users-heading-icon">
                <UsersIcon size={23} />
              </div>

              <div>
                <h1>User Management</h1>

                <p>Manage accounts, roles and access permissions.</p>
              </div>
            </div>

            <button
              type="button"
              className="users-add-btn"
              onClick={openCreateModal}
            >
              <Plus size={17} />
              Create User
            </button>
          </div>

          {/* ===================================================
              ERROR
          =================================================== */}

          {error && (
            <div className="users-alert error">
              <AlertCircle size={17} />

              <span>{error}</span>

              <button type="button" onClick={() => setError("")}>
                <X size={15} />
              </button>
            </div>
          )}

          {/* ===================================================
              SUCCESS
          =================================================== */}

          {success && (
            <div className="users-alert success">
              <CheckCircle2 size={17} />

              <span>{success}</span>

              <button type="button" onClick={() => setSuccess("")}>
                <X size={15} />
              </button>
            </div>
          )}

          {/* ===================================================
              STATS
          =================================================== */}

          <div className="users-stats">
            <div className="user-stat-card">
              <div className="user-stat-top">
                <div className="user-stat-icon stat-blue">
                  <UsersIcon size={19} />
                </div>
              </div>

              <div className="user-stat-label">Total Users</div>

              <div className="user-stat-value">{stats.total}</div>

              <div className="user-stat-decoration" />
            </div>

            <div className="user-stat-card">
              <div className="user-stat-top">
                <div className="user-stat-icon stat-green">
                  <CheckCircle2 size={19} />
                </div>
              </div>

              <div className="user-stat-label">Active</div>

              <div className="user-stat-value">{stats.active}</div>

              <div className="user-stat-decoration" />
            </div>

            <div className="user-stat-card">
              <div className="user-stat-top">
                <div className="user-stat-icon stat-orange">
                  <Trophy size={19} />
                </div>
              </div>

              <div className="user-stat-label">Organizers</div>

              <div className="user-stat-value">{stats.organizers}</div>

              <div className="user-stat-decoration" />
            </div>

            <div className="user-stat-card">
              <div className="user-stat-top">
                <div className="user-stat-icon stat-purple">
                  <Shield size={19} />
                </div>
              </div>

              <div className="user-stat-label">Administrators</div>

              <div className="user-stat-value">{stats.admins}</div>

              <div className="user-stat-decoration" />
            </div>
          </div>

          {/* ===================================================
              TABLE CARD
          =================================================== */}

          <div className="users-card">
            {/* TOOLBAR */}

            <div className="users-toolbar">
              <div className="users-search">
                <Search size={17} />

                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="users-filter">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="ALL">All Roles</option>

                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>

                <ChevronDown size={15} />
              </div>

              <div className="users-filter">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>

                  <option value="ACTIVE">Active</option>

                  <option value="INACTIVE">Inactive</option>
                </select>

                <ChevronDown size={15} />
              </div>

              <button
                type="button"
                className="users-refresh-btn"
                onClick={() => loadUsers(true)}
                disabled={refreshing}
                title="Refresh users"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "refresh-spinning" : ""}
                />
              </button>
            </div>

            {/* TABLE */}

            {loading ? (
              <div className="users-loading">
                <div className="loading-spinner" />

                <span>Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="users-empty">
                <div className="users-empty-icon">
                  <UsersIcon size={26} />
                </div>

                <h3>No users found</h3>

                <p>Try changing your search or filters.</p>
              </div>
            ) : (
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User</th>

                      <th>Email</th>

                      <th>Role</th>

                      <th>Status</th>

                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => {
                      const normalizedRole = normalizeRole(user?.role);

                      const roleConfig =
                        ROLE_CONFIG[normalizedRole] || ROLE_CONFIG.USER;

                      const active = isActiveUser(user);

                      return (
                        <tr key={user.id}>
                          {/* USER */}

                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">
                                {getInitials(user?.name)}
                              </div>

                              <div>
                                <div className="user-name">
                                  {user?.name || "Unnamed User"}
                                </div>

                                <div className="user-id">
                                  ID: {user?.id ?? "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* EMAIL */}

                          <td>
                            <div className="user-email">
                              <Mail size={14} />

                              {user?.email || "No email"}
                            </div>
                          </td>

                          {/* ROLE */}

                          <td>
                            <span
                              className={`role-badge ${roleConfig.className}`}
                            >
                              <RoleIcon role={normalizedRole} size={13} />

                              {roleConfig.label}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td>
                            <span
                              className={`status-badge ${
                                active ? "status-active" : "status-inactive"
                              }`}
                            >
                              <span className="status-dot" />

                              {active ? "Active" : "Inactive"}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td>
                            <div className="user-actions">
                              <button
                                type="button"
                                className="user-action-btn edit"
                                onClick={() => openEditModal(user)}
                                title="Edit user"
                              >
                                <Pencil size={14} />
                              </button>

                              <button
                                type="button"
                                className="user-action-btn power"
                                onClick={() => handleToggleStatus(user)}
                                title={
                                  active ? "Deactivate user" : "Activate user"
                                }
                              >
                                <Power size={14} />
                              </button>

                              <button
                                type="button"
                                className="user-action-btn delete"
                                onClick={() => openDeleteModal(user)}
                                title="Delete user"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =======================================================
          CREATE / EDIT MODAL
      ======================================================= */}

      {showModal && (
        <div
          className="users-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="users-modal">
            {/* HEADER */}

            <div className="users-modal-header">
              <div className="users-modal-title">
                <div className="users-modal-title-icon">
                  {modalMode === "create" ? (
                    <Plus size={19} />
                  ) : (
                    <Pencil size={18} />
                  )}
                </div>

                <div>
                  <h2>
                    {modalMode === "create" ? "Create User" : "Edit User"}
                  </h2>

                  <p>
                    {modalMode === "create"
                      ? "Create a new account and assign permissions."
                      : "Update account details and permissions."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="users-modal-close"
                onClick={closeModal}
                disabled={submitting}
              >
                <X size={17} />
              </button>
            </div>

            {/* BODY */}

            <div className="users-modal-body">
              <form className="users-form" onSubmit={handleSubmit}>
                {/* NAME + EMAIL */}

                <div className="users-form-row">
                  <div className="users-form-field">
                    <label className="users-form-label" htmlFor="user-name">
                      Full Name
                    </label>

                    <div className="users-input-wrap">
                      <User size={16} />

                      <input
                        id="user-name"
                        className="users-form-input"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        disabled={submitting}
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="users-form-field">
                    <label className="users-form-label" htmlFor="user-email">
                      Email Address
                    </label>

                    <div className="users-input-wrap">
                      <Mail size={16} />

                      <input
                        id="user-email"
                        className="users-form-input"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email"
                        disabled={submitting}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                </div>

                {/* PASSWORD */}

                <div className="users-form-field">
                  <label className="users-form-label" htmlFor="user-password">
                    {modalMode === "create" ? "Password" : "New Password"}
                  </label>

                  <div className="users-input-wrap">
                    <LockKeyhole size={16} />

                    <input
                      id="user-password"
                      className="users-form-input"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={
                        modalMode === "create"
                          ? "Minimum 6 characters"
                          : "Leave blank to keep current password"
                      }
                      disabled={submitting}
                      autoComplete={
                        modalMode === "create" ? "new-password" : "off"
                      }
                    />

                    <button
                      type="button"
                      className="users-password-toggle"
                      onClick={() => setShowPassword((previous) => !previous)}
                      disabled={submitting}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {modalMode === "edit" && (
                    <div className="users-form-help">
                      Leave blank if you do not want to change the password.
                    </div>
                  )}
                </div>

                {/* ROLE + STATUS */}

                <div className="users-form-row">
                  <div className="users-form-field">
                    <label className="users-form-label" htmlFor="user-role">
                      Account Role
                    </label>

                    <div className="users-input-wrap">
                      <RoleIcon role={formData.role} size={16} />

                      <select
                        id="user-role"
                        className="users-form-select"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={submitting}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>

                      <ChevronDown className="users-select-arrow" size={15} />
                    </div>
                  </div>

                  <div className="users-form-field">
                    <label className="users-form-label" htmlFor="user-status">
                      Account Status
                    </label>

                    <div className="users-input-wrap">
                      <CheckCircle2 size={16} />

                      <select
                        id="user-status"
                        className="users-form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={submitting}
                      >
                        <option value="ACTIVE">Active</option>

                        <option value="INACTIVE">Inactive</option>
                      </select>

                      <ChevronDown className="users-select-arrow" size={15} />
                    </div>
                  </div>
                </div>

                {/* SECURITY INFO */}

                <div className="users-security-box">
                  <div className="users-security-icon">
                    <ShieldCheck size={16} />
                  </div>

                  <div>
                    <strong>Administrator Access</strong>

                    <span>
                      You are creating this account as an administrator. The
                      selected role controls what this user can access in
                      CricketScore.
                    </span>
                  </div>
                </div>

                {/* FOOTER */}

                <div className="users-modal-footer">
                  <button
                    type="button"
                    className="users-cancel-btn"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="users-save-btn"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="modal-spinner" />

                        {modalMode === "create" ? "Creating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />

                        {modalMode === "create"
                          ? "Create User"
                          : "Save Changes"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          DELETE MODAL
      ======================================================= */}

      {deleteUser && (
        <div
          className="users-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div className="delete-modal">
            <div className="delete-icon">
              <Trash2 size={23} />
            </div>

            <h3>Delete User?</h3>

            <p>
              You are about to permanently delete{" "}
              <span className="delete-user-name">
                {deleteUser.name || "this user"}
              </span>
              . This action cannot be undone.
            </p>

            <div className="delete-warning">
              <strong>Warning:</strong> Deleting the account removes the user
              from the user-management list. Make sure this is the correct
              account before continuing.
            </div>

            <div className="delete-actions">
              <button
                type="button"
                className="delete-cancel"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="modal-spinner" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Users;

// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Search,
//   Plus,
//   MoreVertical,
//   ShieldCheck,
//   UserRound,
//   Eye,
//   Pencil,
//   Trash2,
//   UserCheck,
//   UserX,
//   X,
//   Check,
//   Users as UsersIcon,
//   Crown,
//   Activity,
//   Mail,
//   CalendarDays,
//   Lock,
//   RefreshCw,
//   AlertCircle,
// } from "lucide-react";

// import { userAPI } from "../services/api";

// import {
//   ROLE_OPTIONS,
//   ROLES,
//   normalizeRole,
//   roleLabel,
// } from "../constants/roles";

// /* =========================================================
//    CONSTANTS
// ========================================================= */

// const EMPTY_FORM = {
//   name: "",
//   email: "",
//   password: "",
//   role: ROLES.USER,
//   status: "ACTIVE",
// };

// /* =========================================================
//    HELPERS
// ========================================================= */

// const normalizeUser = (user) => {
//   if (!user) return null;

//   const status = String(
//     user.status || (user.enabled === false ? "INACTIVE" : "ACTIVE"),
//   ).toUpperCase();

//   return {
//     id: user.id ?? user.userId ?? null,

//     name: user.name || "",

//     email: user.email || "",

//     role: normalizeRole(user.role),

//     status,

//     /*
//      * IMPORTANT:
//      * Keep enabled because handleToggleStatus() uses it.
//      */
//     enabled:
//       typeof user.enabled === "boolean" ? user.enabled : status === "ACTIVE",

//     joinedDate: user.joinedDate || user.createdAt || user.createdDate || null,

//     lastActive: user.lastActive || user.lastLoginAt || user.lastLogin || null,

//     tournaments: Number(user.tournaments || user.tournamentCount || 0),
//   };
// };

// const getCurrentUser = () => {
//   try {
//     return JSON.parse(localStorage.getItem("user") || "{}");
//   } catch {
//     return {};
//   }
// };

// const getCurrentRole = () => {
//   const user = getCurrentUser();

//   return normalizeRole(user?.role);
// };

// const getCurrentUserId = () => {
//   const user = getCurrentUser();

//   return user?.id || user?.userId || user?.user_id || null;
// };

// const formatDate = (value) => {
//   if (!value) return "—";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return String(value);
//   }

//   return date.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// const formatRelativeTime = (value) => {
//   if (!value) return "Never";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) {
//     return String(value);
//   }

//   const diff = Date.now() - date.getTime();

//   if (diff < 0) return "Just now";

//   const seconds = Math.floor(diff / 1000);
//   const minutes = Math.floor(seconds / 60);
//   const hours = Math.floor(minutes / 60);
//   const days = Math.floor(hours / 24);

//   if (seconds < 60) return "Just now";
//   if (minutes < 60) return `${minutes}m ago`;
//   if (hours < 24) return `${hours}h ago`;
//   if (days < 30) return `${days}d ago`;

//   return formatDate(value);
// };

// const getInitials = (name = "") => {
//   const parts = name.trim().split(/\s+/).filter(Boolean);

//   if (!parts.length) return "U";

//   if (parts.length === 1) {
//     return parts[0].slice(0, 2).toUpperCase();
//   }

//   return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
// };

// const getRoleIcon = (role) => {
//   switch (normalizeRole(role)) {
//     case ROLES.ADMIN:
//       return Crown;

//     case ROLES.ORGANIZER:
//       return ShieldCheck;

//     case ROLES.SCORER:
//       return Activity;

//     case ROLES.USER:
//       return UserRound;

//     default:
//       return Eye;
//   }
// };

// const getRoleLabel = (role) => {
//   return roleLabel(role);
// };

// const getErrorMessage = (error) => {
//   return (
//     error?.response?.data?.message ||
//     error?.response?.data?.error ||
//     error?.message ||
//     "Something went wrong. Please try again."
//   );
// };

// /* =========================================================
//    COMPONENT
// ========================================================= */

// export default function Users() {
//   const [users, setUsers] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [search, setSearch] = useState("");
//   const [roleFilter, setRoleFilter] = useState("ALL");
//   const [statusFilter, setStatusFilter] = useState("ALL");

//   const [openMenu, setOpenMenu] = useState(null);

//   const [showForm, setShowForm] = useState(false);
//   const [editingUser, setEditingUser] = useState(null);

//   const [showDeleteModal, setShowDeleteModal] = useState(false);

//   const [deletingUser, setDeletingUser] = useState(null);

//   const [form, setForm] = useState(EMPTY_FORM);

//   const currentRole = getCurrentRole();
//   const currentUserId = getCurrentUserId();

//   /* =======================================================
//      ADMIN ACCESS
//   ======================================================= */

//   const isAdmin = currentRole === ROLES.ADMIN;

//   /* =======================================================
//      LOAD USERS
//   ======================================================= */

//   const loadUsers = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const response = await userAPI.getAll();

//       const responseData = response?.data;

//       const data = Array.isArray(responseData)
//         ? responseData
//         : Array.isArray(responseData?.content)
//           ? responseData.content
//           : Array.isArray(responseData?.users)
//             ? responseData.users
//             : Array.isArray(responseData?.data)
//               ? responseData.data
//               : [];

//       setUsers(data.map(normalizeUser).filter(Boolean));
//     } catch (err) {
//       console.error("Failed to load users:", err);

//       setError(getErrorMessage(err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (isAdmin) {
//       loadUsers();
//     } else {
//       setLoading(false);
//     }
//   }, [isAdmin]);

//   /* =======================================================
//      AUTO CLEAR SUCCESS
//   ======================================================= */

//   useEffect(() => {
//     if (!success) return;

//     const timer = setTimeout(() => {
//       setSuccess("");
//     }, 3500);

//     return () => clearTimeout(timer);
//   }, [success]);

//   /* =======================================================
//      FILTERED USERS
//   ======================================================= */

//   const filteredUsers = useMemo(() => {
//     const query = search.trim().toLowerCase();

//     return users.filter((user) => {
//       const matchesSearch =
//         !query ||
//         user.name.toLowerCase().includes(query) ||
//         user.email.toLowerCase().includes(query);

//       const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

//       const matchesStatus =
//         statusFilter === "ALL" || user.status === statusFilter;

//       return matchesSearch && matchesRole && matchesStatus;
//     });
//   }, [users, search, roleFilter, statusFilter]);

//   /* =======================================================
//      STATS
//   ======================================================= */

//   const stats = useMemo(() => {
//     return {
//       total: users.length,

//       admins: users.filter((user) => user.role === ROLES.ADMIN).length,

//       regularUsers: users.filter((user) => user.role === ROLES.USER).length,

//       organizers: users.filter((user) => user.role === ROLES.ORGANIZER).length,

//       scorers: users.filter((user) => user.role === ROLES.SCORER).length,

//       active: users.filter((user) => user.status === "ACTIVE").length,

//       inactive: users.filter((user) => user.status !== "ACTIVE").length,
//     };
//   }, [users]);

//   /* =======================================================
//      FORM
//   ======================================================= */

//   const openCreateModal = () => {
//     setEditingUser(null);

//     setForm({
//       ...EMPTY_FORM,
//     });

//     setError("");
//     setShowForm(true);
//     setOpenMenu(null);
//   };

//   const openEditModal = (user) => {
//     setEditingUser(user);

//     setForm({
//       name: user.name || "",
//       email: user.email || "",
//       password: "",
//       role: user.role || ROLES.USER,
//       status: user.status || "ACTIVE",
//     });

//     setError("");
//     setShowForm(true);
//     setOpenMenu(null);
//   };

//   const closeFormModal = () => {
//     if (saving) return;

//     setShowForm(false);
//     setEditingUser(null);
//     setForm({
//       ...EMPTY_FORM,
//     });
//   };

//   const handleInputChange = (event) => {
//     const { name, value } = event.target;

//     setForm((previous) => ({
//       ...previous,
//       [name]: value,
//     }));
//   };

//   /* =======================================================
//      CREATE / UPDATE
//   ======================================================= */

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     setError("");

//     const name = form.name.trim();
//     const email = form.email.trim();
//     const password = form.password;

//     if (!name) {
//       setError("Name is required.");
//       return;
//     }

//     if (!email) {
//       setError("Email is required.");
//       return;
//     }

//     if (!editingUser && !password.trim()) {
//       setError("Password is required when creating a user.");
//       return;
//     }

//     if (password && password.length < 6) {
//       setError("Password must be at least 6 characters.");
//       return;
//     }

//     try {
//       setSaving(true);

//       if (editingUser) {
//         const payload = {
//           name,
//           email,
//           role: normalizeRole(form.role),
//           status: form.status.toUpperCase(),
//         };

//         if (password.trim()) {
//           payload.password = password;
//         }

//         const response = await userAPI.update(editingUser.id, payload);

//         const updatedUser = normalizeUser(response?.data);

//         if (updatedUser) {
//           setUsers((previous) =>
//             previous.map((user) =>
//               user.id === editingUser.id ? updatedUser : user,
//             ),
//           );
//         } else {
//           await loadUsers();
//         }

//         setSuccess("User updated successfully.");
//       } else {
//         const payload = {
//           name,
//           email,
//           password,
//           role: normalizeRole(form.role),
//           status: form.status.toUpperCase(),
//         };

//         const response = await userAPI.create(payload);

//         const createdUser = normalizeUser(response?.data);

//         if (createdUser) {
//           setUsers((previous) => [createdUser, ...previous]);
//         } else {
//           await loadUsers();
//         }

//         setSuccess("User created successfully.");
//       }

//       closeFormModal();
//     } catch (err) {
//       console.error("Save user error:", err);

//       setError(getErrorMessage(err));
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* =======================================================
//      TOGGLE STATUS
//   ======================================================= */

//   const handleToggleStatus = async (user) => {
//     setOpenMenu(null);

//     if (!user?.id) return;

//     if (String(user.id) === String(currentUserId)) {
//       setError("You cannot deactivate your own account.");
//       return;
//     }

//     try {
//       setError("");

//       const newEnabled = !user.enabled;

//       const response = await userAPI.toggleStatus(user.id, newEnabled);

//       const updatedUser = normalizeUser(response?.data);

//       if (updatedUser) {
//         setUsers((previous) =>
//           previous.map((item) => (item.id === user.id ? updatedUser : item)),
//         );
//       } else {
//         await loadUsers();
//       }

//       setSuccess(
//         newEnabled
//           ? `${user.name} has been activated.`
//           : `${user.name} has been deactivated.`,
//       );
//     } catch (err) {
//       console.error("Toggle status error:", err);

//       setError(getErrorMessage(err));
//     }
//   };

//   /* =======================================================
//      DELETE
//   ======================================================= */

//   const openDeleteModal = (user) => {
//     setOpenMenu(null);

//     if (String(user.id) === String(currentUserId)) {
//       setError("You cannot delete your own account.");
//       return;
//     }

//     setDeletingUser(user);
//     setShowDeleteModal(true);
//   };

//   const closeDeleteModal = () => {
//     if (saving) return;

//     setShowDeleteModal(false);
//     setDeletingUser(null);
//   };

//   const confirmDelete = async () => {
//     if (!deletingUser?.id) return;

//     try {
//       setSaving(true);
//       setError("");

//       await userAPI.delete(deletingUser.id);

//       setUsers((previous) =>
//         previous.filter((user) => user.id !== deletingUser.id),
//       );

//       setSuccess(`${deletingUser.name} was deleted successfully.`);

//       setShowDeleteModal(false);
//       setDeletingUser(null);
//     } catch (err) {
//       console.error("Delete user error:", err);

//       setError(getErrorMessage(err));
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* =======================================================
//      CLOSE MENU OUTSIDE
//   ======================================================= */

//   useEffect(() => {
//     const handleDocumentClick = () => {
//       setOpenMenu(null);
//     };

//     if (openMenu !== null) {
//       document.addEventListener("click", handleDocumentClick);
//     }

//     return () => {
//       document.removeEventListener("click", handleDocumentClick);
//     };
//   }, [openMenu]);

//   /* =======================================================
//      NOT ADMIN
//   ======================================================= */

//   if (!isAdmin) {
//     return (
//       <>
//         <style>{styles}</style>

//         <div className="users-page">
//           <div className="access-denied">
//             <div className="access-icon">
//               <ShieldCheck size={34} />
//             </div>

//             <h2>Access Restricted</h2>

//             <p>Only administrators can manage tournament users.</p>
//           </div>
//         </div>
//       </>
//     );
//   }

//   /* =======================================================
//      RENDER
//   ======================================================= */

//   return (
//     <>
//       <style>{styles}</style>

//       <div className="users-page" onClick={() => setOpenMenu(null)}>
//         {/* HEADER */}

//         <div className="users-header">
//           <div>
//             <div className="eyebrow">
//               <UsersIcon size={15} />
//               USER MANAGEMENT
//             </div>

//             <h1>Users</h1>

//             <p>
//               Manage administrators, organizers, scorers and users across your
//               cricket tournament platform.
//             </p>
//           </div>

//           <div className="header-actions">
//             <button
//               className="refresh-btn"
//               onClick={(event) => {
//                 event.stopPropagation();
//                 loadUsers();
//               }}
//               disabled={loading}
//               title="Refresh users"
//             >
//               <RefreshCw size={18} className={loading ? "spin" : ""} />
//             </button>

//             <button
//               className="add-user-btn"
//               onClick={(event) => {
//                 event.stopPropagation();
//                 openCreateModal();
//               }}
//             >
//               <Plus size={18} />
//               Add User
//             </button>
//           </div>
//         </div>

//         {/* ALERTS */}

//         {error && (
//           <div className="alert alert-error">
//             <AlertCircle size={18} />

//             <span>{error}</span>

//             <button onClick={() => setError("")}>
//               <X size={17} />
//             </button>
//           </div>
//         )}

//         {success && (
//           <div className="alert alert-success">
//             <Check size={18} />

//             <span>{success}</span>

//             <button onClick={() => setSuccess("")}>
//               <X size={17} />
//             </button>
//           </div>
//         )}

//         {/* STATS */}

//         <div className="stats-grid">
//           <StatCard
//             icon={UsersIcon}
//             title="Total Users"
//             value={stats.total}
//             description="All registered users"
//           />

//           <StatCard
//             icon={Crown}
//             title="Administrators"
//             value={stats.admins}
//             description="Full system access"
//           />

//           <StatCard
//             icon={UserRound}
//             title="Users"
//             value={stats.regularUsers}
//             description="Tournament users"
//           />

//           <StatCard
//             icon={ShieldCheck}
//             title="Organizers"
//             value={stats.organizers}
//             description="Tournament managers"
//           />

//           <StatCard
//             icon={Activity}
//             title="Scorers"
//             value={stats.scorers}
//             description="Live score operators"
//           />

//           <StatCard
//             icon={Activity}
//             title="Active"
//             value={stats.active}
//             description="Currently active"
//           />
//         </div>

//         {/* MAIN CARD */}

//         <div className="users-card">
//           {/* FILTER BAR */}

//           <div className="filter-bar">
//             <div className="search-box">
//               <Search size={18} />

//               <input
//                 type="text"
//                 placeholder="Search users by name or email..."
//                 value={search}
//                 onChange={(event) => setSearch(event.target.value)}
//               />

//               {search && (
//                 <button className="clear-search" onClick={() => setSearch("")}>
//                   <X size={15} />
//                 </button>
//               )}
//             </div>

//             <select
//               value={roleFilter}
//               onChange={(event) => setRoleFilter(event.target.value)}
//             >
//               <option value="ALL">All Roles</option>

//               {ROLE_OPTIONS.map((option) => (
//                 <option key={option.value} value={option.value}>
//                   {option.label}
//                 </option>
//               ))}
//             </select>

//             <select
//               value={statusFilter}
//               onChange={(event) => setStatusFilter(event.target.value)}
//             >
//               <option value="ALL">All Status</option>

//               <option value="ACTIVE">Active</option>

//               <option value="INACTIVE">Inactive</option>
//             </select>
//           </div>

//           {/* RESULT INFO */}

//           <div className="result-row">
//             <span>
//               Showing <strong>{filteredUsers.length}</strong> of{" "}
//               <strong>{users.length}</strong> users
//             </span>

//             {(search || roleFilter !== "ALL" || statusFilter !== "ALL") && (
//               <button
//                 className="clear-filters"
//                 onClick={() => {
//                   setSearch("");
//                   setRoleFilter("ALL");
//                   setStatusFilter("ALL");
//                 }}
//               >
//                 Clear filters
//               </button>
//             )}
//           </div>

//           {/* LOADING */}

//           {loading ? (
//             <LoadingState />
//           ) : filteredUsers.length === 0 ? (
//             <EmptyState
//               hasFilters={
//                 Boolean(search) ||
//                 roleFilter !== "ALL" ||
//                 statusFilter !== "ALL"
//               }
//               onAddUser={openCreateModal}
//             />
//           ) : (
//             <>
//               {/* DESKTOP */}

//               <div className="desktop-table">
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>USER</th>
//                       <th>ROLE</th>
//                       <th>STATUS</th>
//                       <th>TOURNAMENTS</th>
//                       <th>JOINED</th>
//                       <th>LAST ACTIVE</th>
//                       <th />
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {filteredUsers.map((user) => {
//                       const RoleIcon = getRoleIcon(user.role);

//                       return (
//                         <tr key={user.id}>
//                           <td>
//                             <div className="user-cell">
//                               <div className="avatar">
//                                 {getInitials(user.name)}
//                               </div>

//                               <div>
//                                 <div className="user-name">
//                                   {user.name || "Unnamed User"}
//                                 </div>

//                                 <div className="user-email">
//                                   <Mail size={13} />

//                                   {user.email}
//                                 </div>
//                               </div>
//                             </div>
//                           </td>

//                           <td>
//                             <div
//                               className={`role-badge role-${user.role.toLowerCase()}`}
//                             >
//                               <RoleIcon size={14} />

//                               {getRoleLabel(user.role)}
//                             </div>
//                           </td>

//                           <td>
//                             <div
//                               className={`status-badge status-${user.status.toLowerCase()}`}
//                             >
//                               <span className="status-dot" />

//                               {user.status === "ACTIVE" ? "Active" : "Inactive"}
//                             </div>
//                           </td>

//                           <td>
//                             <span className="tournament-count">
//                               {user.tournaments}
//                             </span>
//                           </td>

//                           <td>
//                             <div className="date-cell">
//                               <CalendarDays size={14} />

//                               {formatDate(user.joinedDate)}
//                             </div>
//                           </td>

//                           <td>
//                             <span className="last-active">
//                               {formatRelativeTime(user.lastActive)}
//                             </span>
//                           </td>

//                           <td>
//                             <div
//                               className="actions-wrapper"
//                               onClick={(event) => event.stopPropagation()}
//                             >
//                               <button
//                                 className="icon-btn"
//                                 onClick={() =>
//                                   setOpenMenu(
//                                     openMenu === user.id ? null : user.id,
//                                   )
//                                 }
//                               >
//                                 <MoreVertical size={18} />
//                               </button>

//                               {openMenu === user.id && (
//                                 <ActionMenu
//                                   user={user}
//                                   currentUserId={currentUserId}
//                                   onEdit={() => openEditModal(user)}
//                                   onToggle={() => handleToggleStatus(user)}
//                                   onDelete={() => openDeleteModal(user)}
//                                 />
//                               )}
//                             </div>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>

//               {/* MOBILE */}

//               <div className="mobile-users">
//                 {filteredUsers.map((user) => {
//                   const RoleIcon = getRoleIcon(user.role);

//                   return (
//                     <div className="mobile-user-card" key={user.id}>
//                       <div className="mobile-user-top">
//                         <div className="user-cell">
//                           <div className="avatar">{getInitials(user.name)}</div>

//                           <div>
//                             <div className="user-name">{user.name}</div>

//                             <div className="user-email">
//                               <Mail size={13} />

//                               {user.email}
//                             </div>
//                           </div>
//                         </div>

//                         <button
//                           className="icon-btn"
//                           onClick={(event) => {
//                             event.stopPropagation();

//                             setOpenMenu(openMenu === user.id ? null : user.id);
//                           }}
//                         >
//                           <MoreVertical size={18} />
//                         </button>
//                       </div>

//                       {openMenu === user.id && (
//                         <ActionMenu
//                           user={user}
//                           currentUserId={currentUserId}
//                           mobile
//                           onEdit={() => openEditModal(user)}
//                           onToggle={() => handleToggleStatus(user)}
//                           onDelete={() => openDeleteModal(user)}
//                         />
//                       )}

//                       <div className="mobile-user-details">
//                         <div>
//                           <span className="detail-label">Role</span>

//                           <div
//                             className={`role-badge role-${user.role.toLowerCase()}`}
//                           >
//                             <RoleIcon size={13} />

//                             {getRoleLabel(user.role)}
//                           </div>
//                         </div>

//                         <div>
//                           <span className="detail-label">Status</span>

//                           <div
//                             className={`status-badge status-${user.status.toLowerCase()}`}
//                           >
//                             <span className="status-dot" />

//                             {user.status === "ACTIVE" ? "Active" : "Inactive"}
//                           </div>
//                         </div>

//                         <div>
//                           <span className="detail-label">Tournaments</span>

//                           <strong>{user.tournaments}</strong>
//                         </div>

//                         <div>
//                           <span className="detail-label">Joined</span>

//                           <strong>{formatDate(user.joinedDate)}</strong>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </>
//           )}
//         </div>

//         {/* PERMISSIONS */}

//         <div className="permissions-section">
//           <div className="section-heading">
//             <div>
//               <div className="eyebrow">
//                 <ShieldCheck size={15} />
//                 ACCESS CONTROL
//               </div>

//               <h2>Role Permissions</h2>

//               <p>
//                 Understand what each role can access within the tournament
//                 platform.
//               </p>
//             </div>
//           </div>

//           <div className="permissions-grid">
//             <PermissionCard
//               icon={Crown}
//               title="Administrator"
//               role={ROLES.ADMIN}
//               description="Complete control over the platform."
//               permissions={[
//                 "Manage users",
//                 "Create & manage tournaments",
//                 "Manage teams and players",
//                 "Manage matches",
//                 "Update live scores",
//                 "View all reports",
//               ]}
//             />

//             <PermissionCard
//               icon={ShieldCheck}
//               title="Organizer"
//               role={ROLES.ORGANIZER}
//               description="Can manage tournament operations."
//               permissions={[
//                 "Create tournaments",
//                 "Manage teams",
//                 "Manage players",
//                 "Manage matches",
//                 "Update scores",
//                 "View reports",
//               ]}
//             />

//             <PermissionCard
//               icon={Activity}
//               title="Scorer"
//               role={ROLES.SCORER}
//               description="Can operate live scoring."
//               permissions={[
//                 "Update live scores",
//                 "View tournaments",
//                 "View teams and players",
//                 "View matches",
//                 "View scorecards",
//               ]}
//             />

//             <PermissionCard
//               icon={UserRound}
//               title="User"
//               role={ROLES.USER}
//               description="Standard tournament platform access."
//               permissions={[
//                 "View tournaments",
//                 "View teams and players",
//                 "View matches",
//                 "View live scores",
//                 "View scorecards",
//               ]}
//             />
//           </div>
//         </div>
//       </div>

//       {/* =====================================================
//           CREATE / EDIT MODAL
//       ===================================================== */}

//       {showForm && (
//         <div className="modal-overlay" onMouseDown={closeFormModal}>
//           <div
//             className="modal"
//             onMouseDown={(event) => event.stopPropagation()}
//           >
//             <div className="modal-header">
//               <div>
//                 <div className="modal-icon">
//                   {editingUser ? <Pencil size={20} /> : <Plus size={20} />}
//                 </div>

//                 <div>
//                   <h2>{editingUser ? "Edit User" : "Create User"}</h2>

//                   <p>
//                     {editingUser
//                       ? "Update user account details and permissions."
//                       : "Create a new tournament platform user."}
//                   </p>
//                 </div>
//               </div>

//               <button
//                 className="modal-close"
//                 onClick={closeFormModal}
//                 disabled={saving}
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit} className="user-form">
//               <div className="form-group">
//                 <label>
//                   Full Name
//                   <span>*</span>
//                 </label>

//                 <div className="input-wrapper">
//                   <UserRound size={17} />

//                   <input
//                     type="text"
//                     name="name"
//                     value={form.name}
//                     onChange={handleInputChange}
//                     placeholder="Enter full name"
//                     autoComplete="name"
//                   />
//                 </div>
//               </div>

//               <div className="form-group">
//                 <label>
//                   Email Address
//                   <span>*</span>
//                 </label>

//                 <div className="input-wrapper">
//                   <Mail size={17} />

//                   <input
//                     type="email"
//                     name="email"
//                     value={form.email}
//                     onChange={handleInputChange}
//                     placeholder="Enter email address"
//                     autoComplete="email"
//                   />
//                 </div>
//               </div>

//               <div className="form-group">
//                 <label>
//                   {editingUser ? "New Password" : "Password"}

//                   {!editingUser && <span>*</span>}
//                 </label>

//                 <div className="input-wrapper">
//                   <Lock size={17} />

//                   <input
//                     type="password"
//                     name="password"
//                     value={form.password}
//                     onChange={handleInputChange}
//                     placeholder={
//                       editingUser
//                         ? "Leave blank to keep current password"
//                         : "Minimum 6 characters"
//                     }
//                     autoComplete="new-password"
//                   />
//                 </div>

//                 {editingUser && (
//                   <small className="field-help">
//                     Leave blank if you do not want to change the password.
//                   </small>
//                 )}
//               </div>

//               <div className="form-row">
//                 <div className="form-group">
//                   <label>
//                     Role
//                     <span>*</span>
//                   </label>

//                   <select
//                     name="role"
//                     value={form.role}
//                     onChange={handleInputChange}
//                   >
//                     {ROLE_OPTIONS.map((option) => (
//                       <option key={option.value} value={option.value}>
//                         {option.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="form-group">
//                   <label>
//                     Status
//                     <span>*</span>
//                   </label>

//                   <select
//                     name="status"
//                     value={form.status}
//                     onChange={handleInputChange}
//                   >
//                     <option value="ACTIVE">Active</option>

//                     <option value="INACTIVE">Inactive</option>
//                   </select>
//                 </div>
//               </div>

//               <div className="form-role-info">
//                 <ShieldCheck size={17} />

//                 <div>
//                   <strong>{getRoleLabel(form.role)}</strong>

//                   <span>
//                     {form.role === ROLES.ADMIN &&
//                       "Full access to users, tournaments, teams, matches and scores."}

//                     {form.role === ROLES.ORGANIZER &&
//                       "Can create and manage tournaments, teams, players and matches."}

//                     {form.role === ROLES.SCORER &&
//                       "Can update live scores and view tournament data."}

//                     {form.role === ROLES.USER &&
//                       "Can view tournaments, teams, players, matches and live scorecards."}
//                   </span>
//                 </div>
//               </div>

//               <div className="modal-footer">
//                 <button
//                   type="button"
//                   className="cancel-btn"
//                   onClick={closeFormModal}
//                   disabled={saving}
//                 >
//                   Cancel
//                 </button>

//                 <button type="submit" className="save-btn" disabled={saving}>
//                   {saving ? (
//                     <>
//                       <span className="button-spinner" />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Check size={17} />

//                       {editingUser ? "Update User" : "Create User"}
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* =====================================================
//           DELETE MODAL
//       ===================================================== */}

//       {showDeleteModal && deletingUser && (
//         <div className="modal-overlay" onMouseDown={closeDeleteModal}>
//           <div
//             className="delete-modal"
//             onMouseDown={(event) => event.stopPropagation()}
//           >
//             <div className="delete-icon">
//               <Trash2 size={25} />
//             </div>

//             <h2>Delete User?</h2>

//             <p>
//               Are you sure you want to delete{" "}
//               <strong>{deletingUser.name}</strong>? This action cannot be
//               undone.
//             </p>

//             <div className="delete-user-preview">
//               <div className="avatar">{getInitials(deletingUser.name)}</div>

//               <div>
//                 <strong>{deletingUser.name}</strong>

//                 <span>{deletingUser.email}</span>
//               </div>
//             </div>

//             <div className="delete-actions">
//               <button
//                 className="cancel-btn"
//                 onClick={closeDeleteModal}
//                 disabled={saving}
//               >
//                 Cancel
//               </button>

//               <button
//                 className="delete-confirm-btn"
//                 onClick={confirmDelete}
//                 disabled={saving}
//               >
//                 {saving ? (
//                   <>
//                     <span className="button-spinner" />
//                     Deleting...
//                   </>
//                 ) : (
//                   <>
//                     <Trash2 size={17} />
//                     Delete User
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// /* =========================================================
//    STAT CARD
// ========================================================= */

// function StatCard({ icon: Icon, title, value, description }) {
//   return (
//     <div className="stat-card">
//       <div className="stat-icon">
//         <Icon size={20} />
//       </div>

//       <div className="stat-content">
//         <span className="stat-title">{title}</span>

//         <strong className="stat-value">{value}</strong>

//         <span className="stat-description">{description}</span>
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    ACTION MENU
// ========================================================= */

// function ActionMenu({
//   user,
//   currentUserId,
//   onEdit,
//   onToggle,
//   onDelete,
//   mobile = false,
// }) {
//   const isSelf = String(user.id) === String(currentUserId);

//   return (
//     <div
//       className={`action-menu ${mobile ? "action-menu-mobile" : ""}`}
//       onClick={(event) => event.stopPropagation()}
//     >
//       <button onClick={onEdit}>
//         <Pencil size={16} />
//         Edit User
//       </button>

//       <button
//         onClick={onToggle}
//         disabled={isSelf}
//         title={isSelf ? "You cannot change your own status" : ""}
//       >
//         {user.status === "ACTIVE" ? (
//           <UserX size={16} />
//         ) : (
//           <UserCheck size={16} />
//         )}

//         {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
//       </button>

//       <div className="menu-divider" />

//       <button
//         className="danger-action"
//         onClick={onDelete}
//         disabled={isSelf}
//         title={isSelf ? "You cannot delete your own account" : ""}
//       >
//         <Trash2 size={16} />
//         Delete User
//       </button>
//     </div>
//   );
// }

// /* =========================================================
//    PERMISSION CARD
// ========================================================= */

// function PermissionCard({ icon: Icon, title, role, description, permissions }) {
//   return (
//     <div className={`permission-card permission-${role.toLowerCase()}`}>
//       <div className="permission-top">
//         <div className="permission-icon">
//           <Icon size={21} />
//         </div>

//         <div>
//           <h3>{title}</h3>

//           <span className="permission-role">{role}</span>
//         </div>
//       </div>

//       <p>{description}</p>

//       <div className="permission-list">
//         {permissions.map((permission) => (
//           <div key={permission} className="permission-item">
//             <Check size={14} />

//             <span>{permission}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* =========================================================
//    LOADING
// ========================================================= */

// function LoadingState() {
//   return (
//     <div className="loading-state">
//       <div className="loading-spinner" />

//       <strong>Loading users...</strong>

//       <span>Fetching users from the server.</span>
//     </div>
//   );
// }

// /* =========================================================
//    EMPTY
// ========================================================= */

// function EmptyState({ hasFilters, onAddUser }) {
//   return (
//     <div className="empty-state">
//       <div className="empty-icon">
//         <UsersIcon size={30} />
//       </div>

//       <h3>{hasFilters ? "No users found" : "No users yet"}</h3>

//       <p>
//         {hasFilters
//           ? "Try changing your search or filters."
//           : "Create your first user to get started."}
//       </p>

//       {!hasFilters && (
//         <button className="add-user-btn" onClick={onAddUser}>
//           <Plus size={17} />
//           Add User
//         </button>
//       )}
//     </div>
//   );
// }

// /* =========================================================
//    STYLES
// ========================================================= */

// const styles = `
// * {
//   box-sizing: border-box;
// }

// .users-page {
//   min-height: 100vh;
//   padding: 28px;
//   background:
//     radial-gradient(
//       circle at top right,
//       rgba(99, 102, 241, 0.08),
//       transparent 30%
//     ),
//     #f6f7fb;
//   color: #111827;
// }

// /* HEADER */

// .users-header {
//   display: flex;
//   align-items: flex-end;
//   justify-content: space-between;
//   gap: 20px;
//   margin-bottom: 25px;
// }

// .eyebrow {
//   display: flex;
//   align-items: center;
//   gap: 7px;
//   color: #6366f1;
//   font-size: 11px;
//   font-weight: 800;
//   letter-spacing: 1.2px;
//   margin-bottom: 8px;
// }

// .users-header h1 {
//   margin: 0;
//   font-size: 34px;
//   line-height: 1.1;
//   font-weight: 800;
//   letter-spacing: -1px;
// }

// .users-header p {
//   margin: 8px 0 0;
//   color: #6b7280;
//   font-size: 14px;
// }

// .header-actions {
//   display: flex;
//   gap: 10px;
//   align-items: center;
// }

// .add-user-btn,
// .refresh-btn,
// .icon-btn,
// .cancel-btn,
// .save-btn,
// .delete-confirm-btn {
//   border: 0;
//   font-family: inherit;
//   cursor: pointer;
// }

// .add-user-btn {
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   gap: 8px;
//   min-height: 44px;
//   padding: 0 17px;
//   border-radius: 11px;
//   color: white;
//   background: #111827;
//   font-size: 13px;
//   font-weight: 700;
//   box-shadow: 0 8px 20px rgba(17, 24, 39, 0.16);
//   transition: 0.2s;
// }

// .add-user-btn:hover {
//   transform: translateY(-1px);
//   background: #1f2937;
// }

// .refresh-btn {
//   width: 44px;
//   height: 44px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 11px;
//   background: white;
//   color: #4b5563;
//   border: 1px solid #e5e7eb;
// }

// .refresh-btn:hover {
//   background: #f9fafb;
// }

// .spin {
//   animation: spin 1s linear infinite;
// }

// /* ALERTS */

// .alert {
//   display: flex;
//   align-items: center;
//   gap: 10px;
//   padding: 12px 14px;
//   margin-bottom: 18px;
//   border-radius: 11px;
//   font-size: 13px;
//   font-weight: 600;
// }

// .alert span {
//   flex: 1;
// }

// .alert button {
//   border: 0;
//   background: transparent;
//   cursor: pointer;
//   display: flex;
//   align-items: center;
// }

// .alert-error {
//   color: #991b1b;
//   background: #fef2f2;
//   border: 1px solid #fecaca;
// }

// .alert-success {
//   color: #166534;
//   background: #f0fdf4;
//   border: 1px solid #bbf7d0;
// }

// /* STATS */

// .stats-grid {
//   display: grid;
//   grid-template-columns: repeat(6, 1fr);
//   gap: 14px;
//   margin-bottom: 20px;
// }

// .stat-card {
//   min-height: 122px;
//   display: flex;
//   gap: 13px;
//   padding: 18px;
//   border: 1px solid #e7e9ef;
//   border-radius: 15px;
//   background: rgba(255, 255, 255, 0.92);
//   box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
// }

// .stat-icon {
//   width: 40px;
//   height: 40px;
//   flex: 0 0 40px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 11px;
//   background: #eef2ff;
//   color: #6366f1;
// }

// .stat-content {
//   display: flex;
//   flex-direction: column;
//   min-width: 0;
// }

// .stat-title {
//   color: #6b7280;
//   font-size: 12px;
//   font-weight: 600;
// }

// .stat-value {
//   margin-top: 3px;
//   color: #111827;
//   font-size: 26px;
//   line-height: 1.1;
// }

// .stat-description {
//   margin-top: 4px;
//   color: #9ca3af;
//   font-size: 11px;
// }

// /* MAIN CARD */

// .users-card {
//   overflow: visible;
//   border: 1px solid #e5e7eb;
//   border-radius: 16px;
//   background: white;
//   box-shadow: 0 8px 25px rgba(15, 23, 42, 0.04);
// }

// .filter-bar {
//   display: flex;
//   align-items: center;
//   gap: 10px;
//   padding: 17px;
//   border-bottom: 1px solid #eef0f4;
// }

// .search-box {
//   height: 42px;
//   flex: 1;
//   min-width: 220px;
//   display: flex;
//   align-items: center;
//   gap: 9px;
//   padding: 0 12px;
//   border: 1px solid #e5e7eb;
//   border-radius: 10px;
//   color: #9ca3af;
//   background: #fafafa;
// }

// .search-box:focus-within {
//   border-color: #a5b4fc;
//   background: white;
//   box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
// }

// .search-box input {
//   width: 100%;
//   border: 0;
//   outline: 0;
//   background: transparent;
//   font-family: inherit;
//   font-size: 13px;
//   color: #111827;
// }

// .search-box input::placeholder {
//   color: #9ca3af;
// }

// .clear-search {
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border: 0;
//   background: transparent;
//   color: #9ca3af;
//   cursor: pointer;
// }

// .filter-bar select {
//   height: 42px;
//   min-width: 145px;
//   padding: 0 12px;
//   border: 1px solid #e5e7eb;
//   border-radius: 10px;
//   background: white;
//   color: #374151;
//   font-family: inherit;
//   font-size: 13px;
//   outline: none;
// }

// .filter-bar select:focus {
//   border-color: #a5b4fc;
// }

// .result-row {
//   min-height: 48px;
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   padding: 0 17px;
//   border-bottom: 1px solid #eef0f4;
//   color: #9ca3af;
//   font-size: 12px;
// }

// .result-row strong {
//   color: #374151;
// }

// .clear-filters {
//   border: 0;
//   background: transparent;
//   color: #6366f1;
//   cursor: pointer;
//   font-size: 12px;
//   font-weight: 700;
// }

// /* TABLE */

// .desktop-table {
//   width: 100%;
//   overflow-x: auto;
// }

// .desktop-table table {
//   width: 100%;
//   min-width: 950px;
//   border-collapse: collapse;
// }

// .desktop-table th {
//   padding: 12px 17px;
//   color: #9ca3af;
//   background: #fafbfc;
//   border-bottom: 1px solid #eef0f4;
//   text-align: left;
//   font-size: 10px;
//   font-weight: 800;
//   letter-spacing: 0.7px;
// }

// .desktop-table td {
//   position: relative;
//   padding: 15px 17px;
//   border-bottom: 1px solid #f0f1f4;
//   vertical-align: middle;
//   font-size: 13px;
// }

// .desktop-table tbody tr:hover {
//   background: #fafbff;
// }

// .user-cell {
//   display: flex;
//   align-items: center;
//   gap: 11px;
//   min-width: 220px;
// }

// .avatar {
//   width: 40px;
//   height: 40px;
//   flex: 0 0 40px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 50%;
//   background: #eef2ff;
//   color: #4f46e5;
//   font-size: 12px;
//   font-weight: 800;
// }

// .user-name {
//   color: #111827;
//   font-size: 13px;
//   font-weight: 750;
// }

// .user-email {
//   display: flex;
//   align-items: center;
//   gap: 4px;
//   margin-top: 4px;
//   color: #9ca3af;
//   font-size: 11px;
// }

// .role-badge,
// .status-badge {
//   display: inline-flex;
//   align-items: center;
//   gap: 6px;
//   white-space: nowrap;
//   border-radius: 999px;
//   font-size: 11px;
//   font-weight: 700;
// }

// .role-badge {
//   padding: 6px 9px;
// }

// /* ALL FOUR ROLES */

// .role-admin {
//   color: #92400e;
//   background: #fffbeb;
// }

// .role-organizer {
//   color: #6d28d9;
//   background: #f5f3ff;
// }

// .role-scorer {
//   color: #047857;
//   background: #ecfdf5;
// }

// .role-user {
//   color: #1d4ed8;
//   background: #eff6ff;
// }

// .status-badge {
//   gap: 6px;
//   color: #166534;
// }

// .status-inactive {
//   color: #991b1b;
// }

// .status-dot {
//   width: 6px;
//   height: 6px;
//   border-radius: 50%;
//   background: currentColor;
// }

// .tournament-count {
//   display: inline-flex;
//   min-width: 28px;
//   justify-content: center;
//   padding: 5px 8px;
//   border-radius: 7px;
//   background: #f5f3ff;
//   color: #6d28d9;
//   font-size: 11px;
//   font-weight: 800;
// }

// .date-cell {
//   display: flex;
//   align-items: center;
//   gap: 6px;
//   color: #6b7280;
//   white-space: nowrap;
//   font-size: 12px;
// }

// .last-active {
//   color: #6b7280;
//   white-space: nowrap;
//   font-size: 12px;
// }

// /* ACTIONS */

// .actions-wrapper {
//   position: relative;
//   display: flex;
//   justify-content: flex-end;
// }

// .icon-btn {
//   width: 34px;
//   height: 34px;
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 8px;
//   color: #6b7280;
//   background: transparent;
// }

// .icon-btn:hover {
//   color: #111827;
//   background: #f3f4f6;
// }

// .action-menu {
//   position: absolute;
//   top: calc(100% + 5px);
//   right: 0;
//   z-index: 50;
//   width: 175px;
//   padding: 6px;
//   border: 1px solid #e5e7eb;
//   border-radius: 10px;
//   background: white;
//   box-shadow:
//     0 15px 40px rgba(15, 23, 42, 0.13),
//     0 2px 8px rgba(15, 23, 42, 0.06);
// }

// .action-menu button {
//   width: 100%;
//   display: flex;
//   align-items: center;
//   gap: 9px;
//   padding: 9px 10px;
//   border: 0;
//   border-radius: 7px;
//   background: transparent;
//   color: #374151;
//   text-align: left;
//   font-family: inherit;
//   font-size: 12px;
//   font-weight: 600;
//   cursor: pointer;
// }

// .action-menu button:hover:not(:disabled) {
//   background: #f5f6fa;
// }

// .action-menu button:disabled {
//   opacity: 0.45;
//   cursor: not-allowed;
// }

// .action-menu .danger-action {
//   color: #dc2626;
// }

// .menu-divider {
//   height: 1px;
//   margin: 4px 0;
//   background: #eef0f4;
// }

// /* MOBILE */

// .mobile-users {
//   display: none;
// }

// .mobile-user-card {
//   position: relative;
//   margin: 12px;
//   padding: 14px;
//   border: 1px solid #e5e7eb;
//   border-radius: 13px;
//   background: white;
// }

// .mobile-user-top {
//   display: flex;
//   align-items: flex-start;
//   justify-content: space-between;
// }

// .mobile-user-details {
//   display: grid;
//   grid-template-columns: repeat(2, 1fr);
//   gap: 13px;
//   margin-top: 16px;
//   padding-top: 14px;
//   border-top: 1px solid #eef0f4;
// }

// .detail-label {
//   display: block;
//   margin-bottom: 6px;
//   color: #9ca3af;
//   font-size: 10px;
//   font-weight: 700;
//   text-transform: uppercase;
//   letter-spacing: 0.4px;
// }

// .mobile-user-details strong {
//   color: #374151;
//   font-size: 12px;
// }

// .action-menu-mobile {
//   position: absolute;
//   top: 54px;
//   right: 12px;
// }

// /* PERMISSIONS */

// .permissions-section {
//   margin-top: 30px;
// }

// .section-heading {
//   margin-bottom: 16px;
// }

// .section-heading h2 {
//   margin: 0;
//   color: #111827;
//   font-size: 21px;
// }

// .section-heading p {
//   margin: 6px 0 0;
//   color: #6b7280;
//   font-size: 13px;
// }

// .permissions-grid {
//   display: grid;
//   grid-template-columns: repeat(4, 1fr);
//   gap: 14px;
// }

// .permission-card {
//   padding: 19px;
//   border: 1px solid #e5e7eb;
//   border-radius: 15px;
//   background: white;
//   box-shadow: 0 6px 20px rgba(15, 23, 42, 0.035);
// }

// .permission-top {
//   display: flex;
//   align-items: center;
//   gap: 11px;
// }

// .permission-icon {
//   width: 40px;
//   height: 40px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 11px;
// }

// .permission-admin .permission-icon {
//   background: #fffbeb;
//   color: #d97706;
// }

// .permission-organizer .permission-icon {
//   background: #f5f3ff;
//   color: #7c3aed;
// }

// .permission-scorer .permission-icon {
//   background: #ecfdf5;
//   color: #059669;
// }

// .permission-user .permission-icon {
//   background: #eff6ff;
//   color: #2563eb;
// }

// .permission-card h3 {
//   margin: 0;
//   font-size: 14px;
// }

// .permission-role {
//   display: block;
//   margin-top: 2px;
//   color: #9ca3af;
//   font-size: 9px;
//   font-weight: 800;
//   letter-spacing: 0.7px;
// }

// .permission-card > p {
//   min-height: 34px;
//   margin: 15px 0;
//   color: #6b7280;
//   font-size: 12px;
//   line-height: 1.5;
// }

// .permission-list {
//   display: flex;
//   flex-direction: column;
//   gap: 8px;
// }

// .permission-item {
//   display: flex;
//   align-items: center;
//   gap: 8px;
//   color: #4b5563;
//   font-size: 11px;
// }

// .permission-item svg {
//   color: #22c55e;
//   flex: 0 0 auto;
// }

// /* LOADING / EMPTY */

// .loading-state,
// .empty-state {
//   min-height: 280px;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   padding: 30px;
//   text-align: center;
// }

// .loading-state strong,
// .empty-state h3 {
//   margin: 13px 0 5px;
//   color: #374151;
//   font-size: 14px;
// }

// .loading-state span,
// .empty-state p {
//   margin: 0;
//   color: #9ca3af;
//   font-size: 12px;
// }

// .loading-spinner {
//   width: 30px;
//   height: 30px;
//   border: 3px solid #e5e7eb;
//   border-top-color: #6366f1;
//   border-radius: 50%;
//   animation: spin 0.8s linear infinite;
// }

// .empty-icon {
//   width: 60px;
//   height: 60px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 16px;
//   background: #eef2ff;
//   color: #6366f1;
// }

// /* ACCESS DENIED */

// .access-denied {
//   min-height: 70vh;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   text-align: center;
// }

// .access-icon {
//   width: 70px;
//   height: 70px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 20px;
//   color: #dc2626;
//   background: #fef2f2;
// }

// .access-denied h2 {
//   margin: 18px 0 7px;
//   font-size: 22px;
// }

// .access-denied p {
//   margin: 0;
//   color: #6b7280;
//   font-size: 13px;
// }

// /* MODAL */

// .modal-overlay {
//   position: fixed;
//   inset: 0;
//   z-index: 1000;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 20px;
//   background: rgba(15, 23, 42, 0.5);
//   backdrop-filter: blur(5px);
// }

// .modal {
//   width: min(540px, 100%);
//   max-height: calc(100vh - 40px);
//   overflow-y: auto;
//   border-radius: 18px;
//   background: white;
//   box-shadow: 0 30px 80px rgba(15, 23, 42, 0.25);
// }

// .modal-header {
//   display: flex;
//   align-items: flex-start;
//   justify-content: space-between;
//   gap: 15px;
//   padding: 20px;
//   border-bottom: 1px solid #eef0f4;
// }

// .modal-header > div:first-child {
//   display: flex;
//   align-items: flex-start;
//   gap: 12px;
// }

// .modal-icon {
//   width: 40px;
//   height: 40px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 11px;
//   background: #eef2ff;
//   color: #6366f1;
// }

// .modal-header h2 {
//   margin: 0;
//   font-size: 18px;
// }

// .modal-header p {
//   margin: 4px 0 0;
//   color: #9ca3af;
//   font-size: 11px;
// }

// .modal-close {
//   width: 34px;
//   height: 34px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border: 0;
//   border-radius: 8px;
//   background: transparent;
//   color: #6b7280;
//   cursor: pointer;
// }

// .modal-close:hover {
//   background: #f3f4f6;
// }

// .user-form {
//   padding: 20px;
// }

// .form-group {
//   margin-bottom: 16px;
// }

// .form-group label {
//   display: block;
//   margin-bottom: 7px;
//   color: #374151;
//   font-size: 11px;
//   font-weight: 750;
// }

// .form-group label span {
//   margin-left: 3px;
//   color: #ef4444;
// }

// .input-wrapper {
//   height: 43px;
//   display: flex;
//   align-items: center;
//   gap: 9px;
//   padding: 0 12px;
//   border: 1px solid #e5e7eb;
//   border-radius: 10px;
//   color: #9ca3af;
//   background: #fafafa;
// }

// .input-wrapper:focus-within {
//   border-color: #a5b4fc;
//   background: white;
//   box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
// }

// .input-wrapper input {
//   width: 100%;
//   border: 0;
//   outline: 0;
//   background: transparent;
//   font-family: inherit;
//   font-size: 12px;
// }

// .form-group select {
//   width: 100%;
//   height: 43px;
//   padding: 0 11px;
//   border: 1px solid #e5e7eb;
//   border-radius: 10px;
//   outline: 0;
//   background: #fafafa;
//   color: #374151;
//   font-family: inherit;
//   font-size: 12px;
// }

// .form-row {
//   display: grid;
//   grid-template-columns: 1fr 1fr;
//   gap: 12px;
// }

// .field-help {
//   display: block;
//   margin-top: 6px;
//   color: #9ca3af;
//   font-size: 10px;
// }

// .form-role-info {
//   display: flex;
//   align-items: flex-start;
//   gap: 10px;
//   margin-top: 2px;
//   padding: 12px;
//   border-radius: 10px;
//   background: #f8f8ff;
//   color: #6366f1;
// }

// .form-role-info > div {
//   display: flex;
//   flex-direction: column;
//   gap: 3px;
// }

// .form-role-info strong {
//   color: #374151;
//   font-size: 11px;
// }

// .form-role-info span {
//   color: #6b7280;
//   font-size: 10px;
//   line-height: 1.4;
// }

// .modal-footer {
//   display: flex;
//   justify-content: flex-end;
//   gap: 9px;
//   margin-top: 20px;
//   padding-top: 16px;
//   border-top: 1px solid #eef0f4;
// }

// .cancel-btn,
// .save-btn,
// .delete-confirm-btn {
//   min-height: 40px;
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   gap: 7px;
//   padding: 0 14px;
//   border-radius: 9px;
//   font-size: 12px;
//   font-weight: 700;
// }

// .cancel-btn {
//   background: #f3f4f6;
//   color: #374151;
// }

// .cancel-btn:hover {
//   background: #e5e7eb;
// }

// .save-btn {
//   color: white;
//   background: #111827;
// }

// .save-btn:hover:not(:disabled) {
//   background: #1f2937;
// }

// .save-btn:disabled,
// .delete-confirm-btn:disabled {
//   opacity: 0.6;
//   cursor: not-allowed;
// }

// .button-spinner {
//   width: 14px;
//   height: 14px;
//   border: 2px solid rgba(255,255,255,0.35);
//   border-top-color: white;
//   border-radius: 50%;
//   animation: spin 0.7s linear infinite;
// }

// /* DELETE */

// .delete-modal {
//   width: min(410px, 100%);
//   padding: 25px;
//   border-radius: 18px;
//   background: white;
//   text-align: center;
//   box-shadow: 0 30px 80px rgba(15, 23, 42, 0.25);
// }

// .delete-icon {
//   width: 54px;
//   height: 54px;
//   margin: 0 auto;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border-radius: 15px;
//   color: #dc2626;
//   background: #fef2f2;
// }

// .delete-modal h2 {
//   margin: 15px 0 7px;
//   font-size: 19px;
// }

// .delete-modal > p {
//   margin: 0 auto 17px;
//   color: #6b7280;
//   font-size: 12px;
//   line-height: 1.6;
// }

// .delete-user-preview {
//   display: flex;
//   align-items: center;
//   gap: 10px;
//   padding: 12px;
//   margin-bottom: 18px;
//   border: 1px solid #eef0f4;
//   border-radius: 11px;
//   text-align: left;
// }

// .delete-user-preview > div:last-child {
//   display: flex;
//   flex-direction: column;
//   gap: 3px;
// }

// .delete-user-preview strong {
//   color: #374151;
//   font-size: 12px;
// }

// .delete-user-preview span {
//   color: #9ca3af;
//   font-size: 10px;
// }

// .delete-actions {
//   display: flex;
//   justify-content: center;
//   gap: 9px;
// }

// .delete-confirm-btn {
//   color: white;
//   background: #dc2626;
// }

// .delete-confirm-btn:hover:not(:disabled) {
//   background: #b91c1c;
// }

// /* ANIMATION */

// @keyframes spin {
//   to {
//     transform: rotate(360deg);
//   }
// }

// /* RESPONSIVE */

// @media (max-width: 1400px) {
//   .stats-grid {
//     grid-template-columns: repeat(3, 1fr);
//   }

//   .permissions-grid {
//     grid-template-columns: repeat(2, 1fr);
//   }
// }

// @media (max-width: 800px) {
//   .users-page {
//     padding: 18px;
//   }

//   .users-header {
//     align-items: flex-start;
//     flex-direction: column;
//   }

//   .header-actions {
//     width: 100%;
//   }

//   .add-user-btn {
//     flex: 1;
//   }

//   .stats-grid {
//     grid-template-columns: repeat(2, 1fr);
//   }

//   .filter-bar {
//     align-items: stretch;
//     flex-direction: column;
//   }

//   .search-box {
//     width: 100%;
//   }

//   .filter-bar select {
//     width: 100%;
//   }

//   .desktop-table {
//     display: none;
//   }

//   .mobile-users {
//     display: block;
//   }

//   .permissions-grid {
//     grid-template-columns: 1fr;
//   }
// }

// @media (max-width: 520px) {
//   .users-page {
//     padding: 13px;
//   }

//   .users-header h1 {
//     font-size: 28px;
//   }

//   .stats-grid {
//     grid-template-columns: 1fr;
//   }

//   .stats-grid .stat-card {
//     min-height: 100px;
//   }

//   .result-row {
//     padding: 0 13px;
//   }

//   .modal-overlay {
//     padding: 10px;
//   }

//   .modal {
//     max-height: calc(100vh - 20px);
//   }

//   .form-row {
//     grid-template-columns: 1fr;
//     gap: 0;
//   }

//   .mobile-user-details {
//     grid-template-columns: 1fr 1fr;
//   }

//   .delete-modal {
//     padding: 20px;
//   }
// }
// `;

// // import React, { useEffect, useMemo, useState } from "react";
// // import {
// //   Search,
// //   Plus,
// //   MoreVertical,
// //   ShieldCheck,
// //   UserRound,
// //   Eye,
// //   Pencil,
// //   Trash2,
// //   UserCheck,
// //   UserX,
// //   X,
// //   Check,
// //   Users as UsersIcon,
// //   Crown,
// //   Activity,
// //   Mail,
// //   CalendarDays,
// //   Lock,
// //   RefreshCw,
// //   AlertCircle,
// // } from "lucide-react";

// // import { userAPI } from "../services/api";
// // import {
// //   ROLE_OPTIONS,
// //   ROLES,
// //   normalizeRole,
// //   roleLabel,
// // } from "../constants/roles";

// // /* =========================================================
// //    HELPERS
// // ========================================================= */

// // const EMPTY_FORM = {
// //   name: "",
// //   email: "",
// //   password: "",
// //   role: ROLES.USER,
// //   status: "ACTIVE",
// // };

// // const normalizeUser = (user) => {
// //   if (!user) return null;

// //   return {
// //     id: user.id,
// //     name: user.name || "",
// //     email: user.email || "",
// //     role: normalizeRole(user.role),
// //     status: String(user.status || "ACTIVE").toUpperCase(),
// //     joinedDate: user.joinedDate || user.createdAt || user.createdDate || null,
// //     lastActive: user.lastActive || null,
// //     tournaments: Number(user.tournaments || 0),
// //   };
// // };

// // const getCurrentUser = () => {
// //   try {
// //     return JSON.parse(localStorage.getItem("user") || "{}");
// //   } catch {
// //     return {};
// //   }
// // };

// // const getCurrentRole = () => {
// //   const user = getCurrentUser();
// //   return normalizeRole(user?.role);
// // };

// // const getCurrentUserId = () => {
// //   const user = getCurrentUser();

// //   return user?.id || user?.userId || user?.user_id || null;
// // };

// // const formatDate = (value) => {
// //   if (!value) return "—";

// //   const date = new Date(value);

// //   if (Number.isNaN(date.getTime())) {
// //     return String(value);
// //   }

// //   return date.toLocaleDateString("en-IN", {
// //     day: "2-digit",
// //     month: "short",
// //     year: "numeric",
// //   });
// // };

// // const formatRelativeTime = (value) => {
// //   if (!value) return "Never";

// //   const date = new Date(value);

// //   if (Number.isNaN(date.getTime())) {
// //     return String(value);
// //   }

// //   const diff = Date.now() - date.getTime();

// //   if (diff < 0) return "Just now";

// //   const seconds = Math.floor(diff / 1000);
// //   const minutes = Math.floor(seconds / 60);
// //   const hours = Math.floor(minutes / 60);
// //   const days = Math.floor(hours / 24);

// //   if (seconds < 60) return "Just now";
// //   if (minutes < 60) return `${minutes}m ago`;
// //   if (hours < 24) return `${hours}h ago`;
// //   if (days < 30) return `${days}d ago`;

// //   return formatDate(value);
// // };

// // const getInitials = (name = "") => {
// //   const parts = name.trim().split(/\s+/).filter(Boolean);

// //   if (!parts.length) return "U";

// //   if (parts.length === 1) {
// //     return parts[0].slice(0, 2).toUpperCase();
// //   }

// //   return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
// // };

// // const getRoleIcon = (role) => {
// //   switch (role) {
// //     case ROLES.ADMIN:
// //       return Crown;

// //     case ROLES.ORGANIZER:
// //     case ROLES.SCORER:
// //     case ROLES.USER:
// //       return UserRound;

// //     default:
// //       return Eye;
// //   }
// // };

// // const getRoleLabel = (role) => {
// //   return roleLabel(role);
// // };

// // const getErrorMessage = (error) => {
// //   return (
// //     error?.response?.data?.message ||
// //     error?.response?.data?.error ||
// //     error?.message ||
// //     "Something went wrong. Please try again."
// //   );
// // };

// // /* =========================================================
// //    COMPONENT
// // ========================================================= */

// // export default function Users() {
// //   const [users, setUsers] = useState([]);

// //   const [loading, setLoading] = useState(true);
// //   const [saving, setSaving] = useState(false);

// //   const [error, setError] = useState("");
// //   const [success, setSuccess] = useState("");

// //   const [search, setSearch] = useState("");
// //   const [roleFilter, setRoleFilter] = useState("ALL");
// //   const [statusFilter, setStatusFilter] = useState("ALL");

// //   const [openMenu, setOpenMenu] = useState(null);

// //   const [showForm, setShowForm] = useState(false);
// //   const [editingUser, setEditingUser] = useState(null);

// //   const [showDeleteModal, setShowDeleteModal] = useState(false);
// //   const [deletingUser, setDeletingUser] = useState(null);

// //   const [form, setForm] = useState(EMPTY_FORM);

// //   const currentRole = getCurrentRole();
// //   const currentUserId = getCurrentUserId();

// //   /* =======================================================
// //      ADMIN ACCESS
// //   ======================================================= */

// //   const isAdmin = currentRole === ROLES.ADMIN;

// //   /* =======================================================
// //      LOAD USERS
// //   ======================================================= */

// //   const loadUsers = async () => {
// //     try {
// //       setLoading(true);
// //       setError("");

// //       const response = await userAPI.getAll();

// //       const data = Array.isArray(response?.data)
// //         ? response.data
// //         : Array.isArray(response?.data?.content)
// //           ? response.data.content
// //           : Array.isArray(response?.data?.users)
// //             ? response.data.users
// //             : [];

// //       setUsers(data.map(normalizeUser).filter(Boolean));
// //     } catch (err) {
// //       console.error("Failed to load users:", err);
// //       setError(getErrorMessage(err));
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     if (isAdmin) {
// //       loadUsers();
// //     } else {
// //       setLoading(false);
// //     }
// //   }, [isAdmin]);

// //   /* =======================================================
// //      AUTO CLEAR MESSAGES
// //   ======================================================= */

// //   useEffect(() => {
// //     if (!success) return;

// //     const timer = setTimeout(() => {
// //       setSuccess("");
// //     }, 3500);

// //     return () => clearTimeout(timer);
// //   }, [success]);

// //   /* =======================================================
// //      FILTERED USERS
// //   ======================================================= */

// //   const filteredUsers = useMemo(() => {
// //     const query = search.trim().toLowerCase();

// //     return users.filter((user) => {
// //       const matchesSearch =
// //         !query ||
// //         user.name.toLowerCase().includes(query) ||
// //         user.email.toLowerCase().includes(query);

// //       const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

// //       const matchesStatus =
// //         statusFilter === "ALL" || user.status === statusFilter;

// //       return matchesSearch && matchesRole && matchesStatus;
// //     });
// //   }, [users, search, roleFilter, statusFilter]);

// //   /* =======================================================
// //      STATS
// //   ======================================================= */

// //   const stats = useMemo(() => {
// //     return {
// //       total: users.length,

// //       admins: users.filter((user) => user.role === ROLES.ADMIN).length,

// //       regularUsers: users.filter((user) => user.role === ROLES.USER).length,

// //       organizers: users.filter((user) => user.role === ROLES.ORGANIZER).length,

// //       scorers: users.filter((user) => user.role === ROLES.SCORER).length,

// //       active: users.filter((user) => user.status === "ACTIVE").length,

// //       inactive: users.filter((user) => user.status !== "ACTIVE").length,
// //     };
// //   }, [users]);

// //   /* =======================================================
// //      FORM
// //   ======================================================= */

// //   const openCreateModal = () => {
// //     setEditingUser(null);

// //     setForm({
// //       ...EMPTY_FORM,
// //     });

// //     setError("");
// //     setShowForm(true);
// //     setOpenMenu(null);
// //   };

// //   const openEditModal = (user) => {
// //     setEditingUser(user);

// //     setForm({
// //       name: user.name || "",
// //       email: user.email || "",
// //       password: "",
// //       role: user.role || ROLES.USER,
// //       status: user.status || "ACTIVE",
// //     });

// //     setError("");
// //     setShowForm(true);
// //     setOpenMenu(null);
// //   };

// //   const closeFormModal = () => {
// //     if (saving) return;

// //     setShowForm(false);
// //     setEditingUser(null);
// //     setForm(EMPTY_FORM);
// //   };

// //   const handleInputChange = (event) => {
// //     const { name, value } = event.target;

// //     setForm((previous) => ({
// //       ...previous,
// //       [name]: value,
// //     }));
// //   };

// //   /* =======================================================
// //      CREATE / UPDATE
// //   ======================================================= */

// //   const handleSubmit = async (event) => {
// //     event.preventDefault();

// //     if (!form.name.trim()) {
// //       setError("Name is required.");
// //       return;
// //     }

// //     if (!form.email.trim()) {
// //       setError("Email is required.");
// //       return;
// //     }

// //     if (!editingUser && !form.password.trim()) {
// //       setError("Password is required when creating a user.");
// //       return;
// //     }

// //     if (!editingUser && form.password.length < 6) {
// //       setError("Password must be at least 6 characters.");
// //       return;
// //     }

// //     try {
// //       setSaving(true);
// //       setError("");

// //       if (editingUser) {
// //         const payload = {
// //           name: form.name.trim(),
// //           email: form.email.trim(),
// //           role: form.role,
// //           status: form.status,
// //         };

// //         // Only send password when admin actually entered one.
// //         if (form.password.trim()) {
// //           if (form.password.length < 6) {
// //             setError("Password must be at least 6 characters.");
// //             setSaving(false);
// //             return;
// //           }

// //           payload.password = form.password;
// //         }

// //         const response = await userAPI.update(editingUser.id, payload);

// //         const updatedUser = normalizeUser(response?.data);

// //         if (updatedUser) {
// //           setUsers((previous) =>
// //             previous.map((user) =>
// //               user.id === editingUser.id ? updatedUser : user,
// //             ),
// //           );
// //         } else {
// //           await loadUsers();
// //         }

// //         setSuccess("User updated successfully.");
// //       } else {
// //         const payload = {
// //           name: form.name.trim(),
// //           email: form.email.trim(),
// //           password: form.password,
// //           role: form.role,
// //           status: form.status,
// //         };

// //         const response = await userAPI.create(payload);

// //         const createdUser = normalizeUser(response?.data);

// //         if (createdUser) {
// //           setUsers((previous) => [createdUser, ...previous]);
// //         } else {
// //           await loadUsers();
// //         }

// //         setSuccess("User created successfully.");
// //       }

// //       closeFormModal();
// //     } catch (err) {
// //       console.error("Save user error:", err);
// //       setError(getErrorMessage(err));
// //     } finally {
// //       setSaving(false);
// //     }
// //   };

// //   /* =======================================================
// //      TOGGLE STATUS
// //   ======================================================= */

// //   const handleToggleStatus = async (user) => {
// //     setOpenMenu(null);

// //     if (!user?.id) return;

// //     if (String(user.id) === String(currentUserId)) {
// //       setError("You cannot deactivate your own account.");
// //       return;
// //     }

// //     try {
// //       setError("");

// //       const response = await userAPI.toggleStatus(user.id, !user.enabled);

// //       const updatedUser = normalizeUser(response?.data);

// //       if (updatedUser) {
// //         setUsers((previous) =>
// //           previous.map((item) => (item.id === user.id ? updatedUser : item)),
// //         );
// //       } else {
// //         await loadUsers();
// //       }

// //       setSuccess(
// //         user.status === "ACTIVE"
// //           ? `${user.name} has been deactivated.`
// //           : `${user.name} has been activated.`,
// //       );
// //     } catch (err) {
// //       console.error("Toggle status error:", err);

// //       setError(getErrorMessage(err));
// //     }
// //   };

// //   /* =======================================================
// //      DELETE
// //   ======================================================= */

// //   const openDeleteModal = (user) => {
// //     setOpenMenu(null);

// //     if (String(user.id) === String(currentUserId)) {
// //       setError("You cannot delete your own account.");
// //       return;
// //     }

// //     setDeletingUser(user);
// //     setShowDeleteModal(true);
// //   };

// //   const closeDeleteModal = () => {
// //     if (saving) return;

// //     setShowDeleteModal(false);
// //     setDeletingUser(null);
// //   };

// //   const confirmDelete = async () => {
// //     if (!deletingUser?.id) return;

// //     try {
// //       setSaving(true);
// //       setError("");

// //       await userAPI.delete(deletingUser.id);

// //       setUsers((previous) =>
// //         previous.filter((user) => user.id !== deletingUser.id),
// //       );

// //       setSuccess(`${deletingUser.name} was deleted successfully.`);

// //       closeDeleteModal();
// //     } catch (err) {
// //       console.error("Delete user error:", err);

// //       setError(getErrorMessage(err));
// //     } finally {
// //       setSaving(false);
// //     }
// //   };

// //   /* =======================================================
// //      CLOSE MENU WHEN CLICKING OUTSIDE
// //   ======================================================= */

// //   useEffect(() => {
// //     const handleDocumentClick = () => {
// //       setOpenMenu(null);
// //     };

// //     if (openMenu !== null) {
// //       document.addEventListener("click", handleDocumentClick);
// //     }

// //     return () => {
// //       document.removeEventListener("click", handleDocumentClick);
// //     };
// //   }, [openMenu]);

// //   /* =======================================================
// //      NOT ADMIN
// //   ======================================================= */

// //   if (!isAdmin) {
// //     return (
// //       <>
// //         <style>{styles}</style>

// //         <div className="users-page">
// //           <div className="access-denied">
// //             <div className="access-icon">
// //               <ShieldCheck size={34} />
// //             </div>

// //             <h2>Access Restricted</h2>

// //             <p>Only administrators can manage tournament users.</p>
// //           </div>
// //         </div>
// //       </>
// //     );
// //   }

// //   /* =======================================================
// //      RENDER
// //   ======================================================= */

// //   return (
// //     <>
// //       <style>{styles}</style>

// //       <div className="users-page" onClick={() => setOpenMenu(null)}>
// //         {/* =================================================
// //             HEADER
// //         ================================================= */}

// //         <div className="users-header">
// //           <div>
// //             <div className="eyebrow">
// //               <UsersIcon size={15} />
// //               USER MANAGEMENT
// //             </div>

// //             <h1>Users</h1>

// //             <p>
// //               Manage administrators, organizers, scorers and users across your
// //               cricket tournament platform.
// //             </p>
// //           </div>

// //           <div className="header-actions">
// //             <button
// //               className="refresh-btn"
// //               onClick={(event) => {
// //                 event.stopPropagation();
// //                 loadUsers();
// //               }}
// //               disabled={loading}
// //               title="Refresh users"
// //             >
// //               <RefreshCw size={18} className={loading ? "spin" : ""} />
// //             </button>

// //             <button
// //               className="add-user-btn"
// //               onClick={(event) => {
// //                 event.stopPropagation();
// //                 openCreateModal();
// //               }}
// //             >
// //               <Plus size={18} />
// //               Add User
// //             </button>
// //           </div>
// //         </div>

// //         {/* =================================================
// //             ALERTS
// //         ================================================= */}

// //         {error && (
// //           <div className="alert alert-error">
// //             <AlertCircle size={18} />

// //             <span>{error}</span>

// //             <button onClick={() => setError("")}>
// //               <X size={17} />
// //             </button>
// //           </div>
// //         )}

// //         {success && (
// //           <div className="alert alert-success">
// //             <Check size={18} />

// //             <span>{success}</span>

// //             <button onClick={() => setSuccess("")}>
// //               <X size={17} />
// //             </button>
// //           </div>
// //         )}

// //         {/* =================================================
// //             STATS
// //         ================================================= */}

// //         <div className="stats-grid">
// //           <StatCard
// //             icon={UsersIcon}
// //             title="Total Users"
// //             value={stats.total}
// //             description="All registered users"
// //           />

// //           <StatCard
// //             icon={Crown}
// //             title="Administrators"
// //             value={stats.admins}
// //             description="Full system access"
// //           />

// //           <StatCard
// //             icon={UserRound}
// //             title="Users"
// //             value={stats.regularUsers}
// //             description="Tournament users"
// //           />

// //           <StatCard
// //             icon={UserRound}
// //             title="Organizers"
// //             value={stats.organizers}
// //             description="Tournament managers"
// //           />

// //           <StatCard
// //             icon={Activity}
// //             title="Scorers"
// //             value={stats.scorers}
// //             description="Live score operators"
// //           />

// //           <StatCard
// //             icon={Activity}
// //             title="Active"
// //             value={stats.active}
// //             description="Currently active"
// //           />
// //         </div>

// //         {/* =================================================
// //             MAIN CARD
// //         ================================================= */}

// //         <div className="users-card">
// //           {/* FILTER BAR */}

// //           <div className="filter-bar">
// //             <div className="search-box">
// //               <Search size={18} />

// //               <input
// //                 type="text"
// //                 placeholder="Search users by name or email..."
// //                 value={search}
// //                 onChange={(event) => setSearch(event.target.value)}
// //               />

// //               {search && (
// //                 <button className="clear-search" onClick={() => setSearch("")}>
// //                   <X size={15} />
// //                 </button>
// //               )}
// //             </div>

// //             <select
// //               value={roleFilter}
// //               onChange={(event) => setRoleFilter(event.target.value)}
// //             >
// //               <option value="ALL">All Roles</option>
// //               {ROLE_OPTIONS.map((option) => (
// //                 <option key={option.value} value={option.value}>
// //                   {option.label}
// //                 </option>
// //               ))}
// //             </select>

// //             <select
// //               value={statusFilter}
// //               onChange={(event) => setStatusFilter(event.target.value)}
// //             >
// //               <option value="ALL">All Status</option>
// //               <option value="ACTIVE">Active</option>
// //               <option value="INACTIVE">Inactive</option>
// //             </select>
// //           </div>

// //           {/* =================================================
// //               RESULT INFO
// //           ================================================= */}

// //           <div className="result-row">
// //             <span>
// //               Showing <strong>{filteredUsers.length}</strong> of{" "}
// //               <strong>{users.length}</strong> users
// //             </span>

// //             {(search || roleFilter !== "ALL" || statusFilter !== "ALL") && (
// //               <button
// //                 className="clear-filters"
// //                 onClick={() => {
// //                   setSearch("");
// //                   setRoleFilter("ALL");
// //                   setStatusFilter("ALL");
// //                 }}
// //               >
// //                 Clear filters
// //               </button>
// //             )}
// //           </div>

// //           {/* =================================================
// //               LOADING
// //           ================================================= */}

// //           {loading ? (
// //             <LoadingState />
// //           ) : filteredUsers.length === 0 ? (
// //             <EmptyState
// //               hasFilters={
// //                 Boolean(search) ||
// //                 roleFilter !== "ALL" ||
// //                 statusFilter !== "ALL"
// //               }
// //               onAddUser={openCreateModal}
// //             />
// //           ) : (
// //             <>
// //               {/* =================================================
// //                   DESKTOP TABLE
// //               ================================================= */}

// //               <div className="desktop-table">
// //                 <table>
// //                   <thead>
// //                     <tr>
// //                       <th>USER</th>
// //                       <th>ROLE</th>
// //                       <th>STATUS</th>
// //                       <th>TOURNAMENTS</th>
// //                       <th>JOINED</th>
// //                       <th>LAST ACTIVE</th>
// //                       <th></th>
// //                     </tr>
// //                   </thead>

// //                   <tbody>
// //                     {filteredUsers.map((user) => {
// //                       const RoleIcon = getRoleIcon(user.role);

// //                       return (
// //                         <tr key={user.id}>
// //                           <td>
// //                             <div className="user-cell">
// //                               <div className="avatar">
// //                                 {getInitials(user.name)}
// //                               </div>

// //                               <div>
// //                                 <div className="user-name">
// //                                   {user.name || "Unnamed User"}
// //                                 </div>

// //                                 <div className="user-email">
// //                                   <Mail size={13} />

// //                                   {user.email}
// //                                 </div>
// //                               </div>
// //                             </div>
// //                           </td>

// //                           <td>
// //                             <div
// //                               className={`role-badge role-${user.role.toLowerCase()}`}
// //                             >
// //                               <RoleIcon size={14} />

// //                               {getRoleLabel(user.role)}
// //                             </div>
// //                           </td>

// //                           <td>
// //                             <div
// //                               className={`status-badge status-${user.status.toLowerCase()}`}
// //                             >
// //                               <span className="status-dot" />
// //                               {user.status === "ACTIVE" ? "Active" : "Inactive"}
// //                             </div>
// //                           </td>

// //                           <td>
// //                             <span className="tournament-count">
// //                               {user.tournaments}
// //                             </span>
// //                           </td>

// //                           <td>
// //                             <div className="date-cell">
// //                               <CalendarDays size={14} />

// //                               {formatDate(user.joinedDate)}
// //                             </div>
// //                           </td>

// //                           <td>
// //                             <span className="last-active">
// //                               {formatRelativeTime(user.lastActive)}
// //                             </span>
// //                           </td>

// //                           <td>
// //                             <div
// //                               className="actions-wrapper"
// //                               onClick={(event) => event.stopPropagation()}
// //                             >
// //                               <button
// //                                 className="icon-btn"
// //                                 onClick={() =>
// //                                   setOpenMenu(
// //                                     openMenu === user.id ? null : user.id,
// //                                   )
// //                                 }
// //                               >
// //                                 <MoreVertical size={18} />
// //                               </button>

// //                               {openMenu === user.id && (
// //                                 <ActionMenu
// //                                   user={user}
// //                                   currentUserId={currentUserId}
// //                                   onEdit={() => openEditModal(user)}
// //                                   onToggle={() => handleToggleStatus(user)}
// //                                   onDelete={() => openDeleteModal(user)}
// //                                 />
// //                               )}
// //                             </div>
// //                           </td>
// //                         </tr>
// //                       );
// //                     })}
// //                   </tbody>
// //                 </table>
// //               </div>

// //               {/* =================================================
// //                   MOBILE CARDS
// //               ================================================= */}

// //               <div className="mobile-users">
// //                 {filteredUsers.map((user) => {
// //                   const RoleIcon = getRoleIcon(user.role);

// //                   return (
// //                     <div className="mobile-user-card" key={user.id}>
// //                       <div className="mobile-user-top">
// //                         <div className="user-cell">
// //                           <div className="avatar">{getInitials(user.name)}</div>

// //                           <div>
// //                             <div className="user-name">{user.name}</div>

// //                             <div className="user-email">
// //                               <Mail size={13} />

// //                               {user.email}
// //                             </div>
// //                           </div>
// //                         </div>

// //                         <button
// //                           className="icon-btn"
// //                           onClick={() =>
// //                             setOpenMenu(openMenu === user.id ? null : user.id)
// //                           }
// //                         >
// //                           <MoreVertical size={18} />
// //                         </button>
// //                       </div>

// //                       {openMenu === user.id && (
// //                         <ActionMenu
// //                           user={user}
// //                           currentUserId={currentUserId}
// //                           mobile
// //                           onEdit={() => openEditModal(user)}
// //                           onToggle={() => handleToggleStatus(user)}
// //                           onDelete={() => openDeleteModal(user)}
// //                         />
// //                       )}

// //                       <div className="mobile-user-details">
// //                         <div>
// //                           <span className="detail-label">Role</span>

// //                           <div
// //                             className={`role-badge role-${user.role.toLowerCase()}`}
// //                           >
// //                             <RoleIcon size={13} />

// //                             {getRoleLabel(user.role)}
// //                           </div>
// //                         </div>

// //                         <div>
// //                           <span className="detail-label">Status</span>

// //                           <div
// //                             className={`status-badge status-${user.status.toLowerCase()}`}
// //                           >
// //                             <span className="status-dot" />
// //                             {user.status === "ACTIVE" ? "Active" : "Inactive"}
// //                           </div>
// //                         </div>

// //                         <div>
// //                           <span className="detail-label">Tournaments</span>

// //                           <strong>{user.tournaments}</strong>
// //                         </div>

// //                         <div>
// //                           <span className="detail-label">Joined</span>

// //                           <strong>{formatDate(user.joinedDate)}</strong>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   );
// //                 })}
// //               </div>
// //             </>
// //           )}
// //         </div>

// //         {/* =================================================
// //             PERMISSIONS
// //         ================================================= */}

// //         <div className="permissions-section">
// //           <div className="section-heading">
// //             <div>
// //               <div className="eyebrow">
// //                 <ShieldCheck size={15} />
// //                 ACCESS CONTROL
// //               </div>

// //               <h2>Role Permissions</h2>

// //               <p>
// //                 Understand what each role can access within the tournament
// //                 platform.
// //               </p>
// //             </div>
// //           </div>

// //           <div className="permissions-grid">
// //             <PermissionCard
// //               icon={Crown}
// //               title="Administrator"
// //               role={ROLES.ADMIN}
// //               description="Complete control over the platform."
// //               permissions={[
// //                 "Manage users",
// //                 "Create & manage tournaments",
// //                 "Manage teams and players",
// //                 "Manage matches",
// //                 "Update live scores",
// //                 "View all reports",
// //               ]}
// //             />

// //             <PermissionCard
// //               icon={UserRound}
// //               title="Organizer"
// //               role={ROLES.ORGANIZER}
// //               description="Can manage assigned tournament data."
// //               permissions={[
// //                 "Create tournaments",
// //                 "Manage teams",
// //                 "Manage players",
// //                 "Manage matches",
// //                 "Update scores",
// //                 "View reports",
// //               ]}
// //             />

// //             <PermissionCard
// //               icon={Activity}
// //               title="Scorer"
// //               role={ROLES.SCORER}
// //               description="Can operate live scoring."
// //               permissions={[
// //                 "Update live scores",
// //                 "View tournaments",
// //                 "View teams and players",
// //                 "View matches",
// //                 "View scorecards",
// //               ]}
// //             />
// //           </div>
// //         </div>
// //       </div>

// //       {/* =====================================================
// //           CREATE / EDIT MODAL
// //       ===================================================== */}

// //       {showForm && (
// //         <div className="modal-overlay" onMouseDown={closeFormModal}>
// //           <div
// //             className="modal"
// //             onMouseDown={(event) => event.stopPropagation()}
// //           >
// //             <div className="modal-header">
// //               <div>
// //                 <div className="modal-icon">
// //                   {editingUser ? <Pencil size={20} /> : <Plus size={20} />}
// //                 </div>

// //                 <div>
// //                   <h2>{editingUser ? "Edit User" : "Create User"}</h2>

// //                   <p>
// //                     {editingUser
// //                       ? "Update user account details and permissions."
// //                       : "Create a new tournament platform user."}
// //                   </p>
// //                 </div>
// //               </div>

// //               <button
// //                 className="modal-close"
// //                 onClick={closeFormModal}
// //                 disabled={saving}
// //               >
// //                 <X size={20} />
// //               </button>
// //             </div>

// //             <form onSubmit={handleSubmit} className="user-form">
// //               <div className="form-group">
// //                 <label>
// //                   Full Name
// //                   <span>*</span>
// //                 </label>

// //                 <div className="input-wrapper">
// //                   <UserRound size={17} />

// //                   <input
// //                     type="text"
// //                     name="name"
// //                     value={form.name}
// //                     onChange={handleInputChange}
// //                     placeholder="Enter full name"
// //                     autoComplete="name"
// //                   />
// //                 </div>
// //               </div>

// //               <div className="form-group">
// //                 <label>
// //                   Email Address
// //                   <span>*</span>
// //                 </label>

// //                 <div className="input-wrapper">
// //                   <Mail size={17} />

// //                   <input
// //                     type="email"
// //                     name="email"
// //                     value={form.email}
// //                     onChange={handleInputChange}
// //                     placeholder="Enter email address"
// //                     autoComplete="email"
// //                   />
// //                 </div>
// //               </div>

// //               <div className="form-group">
// //                 <label>
// //                   {editingUser ? "New Password" : "Password"}

// //                   {!editingUser && <span>*</span>}
// //                 </label>

// //                 <div className="input-wrapper">
// //                   <Lock size={17} />

// //                   <input
// //                     type="password"
// //                     name="password"
// //                     value={form.password}
// //                     onChange={handleInputChange}
// //                     placeholder={
// //                       editingUser
// //                         ? "Leave blank to keep current password"
// //                         : "Minimum 6 characters"
// //                     }
// //                     autoComplete={editingUser ? "new-password" : "new-password"}
// //                   />
// //                 </div>

// //                 {editingUser && (
// //                   <small className="field-help">
// //                     Leave blank if you do not want to change the password.
// //                   </small>
// //                 )}
// //               </div>

// //               <div className="form-row">
// //                 <div className="form-group">
// //                   <label>
// //                     Role
// //                     <span>*</span>
// //                   </label>

// //                   <select
// //                     name="role"
// //                     value={form.role}
// //                     onChange={handleInputChange}
// //                   >
// //                     {ROLE_OPTIONS.map((option) => (
// //                       <option key={option.value} value={option.value}>
// //                         {option.label}
// //                       </option>
// //                     ))}
// //                   </select>
// //                 </div>

// //                 <div className="form-group">
// //                   <label>
// //                     Status
// //                     <span>*</span>
// //                   </label>

// //                   <select
// //                     name="status"
// //                     value={form.status}
// //                     onChange={handleInputChange}
// //                   >
// //                     <option value="ACTIVE">Active</option>

// //                     <option value="INACTIVE">Inactive</option>
// //                   </select>
// //                 </div>
// //               </div>

// //               <div className="form-role-info">
// //                 <ShieldCheck size={17} />

// //                 <div>
// //                   <strong>{getRoleLabel(form.role)}</strong>

// //                   <span>
// //                     {form.role === ROLES.ADMIN &&
// //                       "Full access to users, tournaments, teams, matches and scores."}

// //                     {form.role === ROLES.ORGANIZER &&
// //                       "Can create and manage tournaments, teams, players and matches."}

// //                     {form.role === ROLES.SCORER &&
// //                       "Can update live scores and view tournament data."}

// //                     {form.role === ROLES.USER &&
// //                       "Can create and manage tournament data."}
// //                   </span>
// //                 </div>
// //               </div>

// //               <div className="modal-footer">
// //                 <button
// //                   type="button"
// //                   className="cancel-btn"
// //                   onClick={closeFormModal}
// //                   disabled={saving}
// //                 >
// //                   Cancel
// //                 </button>

// //                 <button type="submit" className="save-btn" disabled={saving}>
// //                   {saving ? (
// //                     <>
// //                       <span className="button-spinner" />
// //                       Saving...
// //                     </>
// //                   ) : (
// //                     <>
// //                       <Check size={17} />

// //                       {editingUser ? "Update User" : "Create User"}
// //                     </>
// //                   )}
// //                 </button>
// //               </div>
// //             </form>
// //           </div>
// //         </div>
// //       )}

// //       {/* =====================================================
// //           DELETE MODAL
// //       ===================================================== */}

// //       {showDeleteModal && deletingUser && (
// //         <div className="modal-overlay" onMouseDown={closeDeleteModal}>
// //           <div
// //             className="delete-modal"
// //             onMouseDown={(event) => event.stopPropagation()}
// //           >
// //             <div className="delete-icon">
// //               <Trash2 size={25} />
// //             </div>

// //             <h2>Delete User?</h2>

// //             <p>
// //               Are you sure you want to delete{" "}
// //               <strong>{deletingUser.name}</strong>? This action cannot be
// //               undone.
// //             </p>

// //             <div className="delete-user-preview">
// //               <div className="avatar">{getInitials(deletingUser.name)}</div>

// //               <div>
// //                 <strong>{deletingUser.name}</strong>

// //                 <span>{deletingUser.email}</span>
// //               </div>
// //             </div>

// //             <div className="delete-actions">
// //               <button
// //                 className="cancel-btn"
// //                 onClick={closeDeleteModal}
// //                 disabled={saving}
// //               >
// //                 Cancel
// //               </button>

// //               <button
// //                 className="delete-confirm-btn"
// //                 onClick={confirmDelete}
// //                 disabled={saving}
// //               >
// //                 {saving ? (
// //                   <>
// //                     <span className="button-spinner" />
// //                     Deleting...
// //                   </>
// //                 ) : (
// //                   <>
// //                     <Trash2 size={17} />
// //                     Delete User
// //                   </>
// //                 )}
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </>
// //   );
// // }

// // /* =========================================================
// //    STAT CARD
// // ========================================================= */

// // function StatCard({ icon: Icon, title, value, description }) {
// //   return (
// //     <div className="stat-card">
// //       <div className="stat-icon">
// //         <Icon size={20} />
// //       </div>

// //       <div className="stat-content">
// //         <span className="stat-title">{title}</span>

// //         <strong className="stat-value">{value}</strong>

// //         <span className="stat-description">{description}</span>
// //       </div>
// //     </div>
// //   );
// // }

// // /* =========================================================
// //    ACTION MENU
// // ========================================================= */

// // function ActionMenu({
// //   user,
// //   currentUserId,
// //   onEdit,
// //   onToggle,
// //   onDelete,
// //   mobile = false,
// // }) {
// //   const isSelf = String(user.id) === String(currentUserId);

// //   return (
// //     <div
// //       className={`action-menu ${mobile ? "action-menu-mobile" : ""}`}
// //       onClick={(event) => event.stopPropagation()}
// //     >
// //       <button onClick={onEdit}>
// //         <Pencil size={16} />
// //         Edit User
// //       </button>

// //       <button
// //         onClick={onToggle}
// //         disabled={isSelf}
// //         title={isSelf ? "You cannot change your own status" : ""}
// //       >
// //         {user.status === "ACTIVE" ? (
// //           <UserX size={16} />
// //         ) : (
// //           <UserCheck size={16} />
// //         )}

// //         {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
// //       </button>

// //       <div className="menu-divider" />

// //       <button
// //         className="danger-action"
// //         onClick={onDelete}
// //         disabled={isSelf}
// //         title={isSelf ? "You cannot delete your own account" : ""}
// //       >
// //         <Trash2 size={16} />
// //         Delete User
// //       </button>
// //     </div>
// //   );
// // }

// // /* =========================================================
// //    PERMISSION CARD
// // ========================================================= */

// // function PermissionCard({ icon: Icon, title, role, description, permissions }) {
// //   return (
// //     <div className={`permission-card permission-${role.toLowerCase()}`}>
// //       <div className="permission-top">
// //         <div className="permission-icon">
// //           <Icon size={21} />
// //         </div>

// //         <div>
// //           <h3>{title}</h3>

// //           <span className="permission-role">{role}</span>
// //         </div>
// //       </div>

// //       <p>{description}</p>

// //       <div className="permission-list">
// //         {permissions.map((permission) => (
// //           <div key={permission} className="permission-item">
// //             <Check size={14} />
// //             <span>{permission}</span>
// //           </div>
// //         ))}
// //       </div>
// //     </div>
// //   );
// // }

// // /* =========================================================
// //    LOADING
// // ========================================================= */

// // function LoadingState() {
// //   return (
// //     <div className="loading-state">
// //       <div className="loading-spinner" />

// //       <strong>Loading users...</strong>

// //       <span>Fetching users from the server.</span>
// //     </div>
// //   );
// // }

// // /* =========================================================
// //    EMPTY
// // ========================================================= */

// // function EmptyState({ hasFilters, onAddUser }) {
// //   return (
// //     <div className="empty-state">
// //       <div className="empty-icon">
// //         <UsersIcon size={30} />
// //       </div>

// //       <h3>{hasFilters ? "No users found" : "No users yet"}</h3>

// //       <p>
// //         {hasFilters
// //           ? "Try changing your search or filters."
// //           : "Create your first user to get started."}
// //       </p>

// //       {!hasFilters && (
// //         <button className="add-user-btn" onClick={onAddUser}>
// //           <Plus size={17} />
// //           Add User
// //         </button>
// //       )}
// //     </div>
// //   );
// // }

// // /* =========================================================
// //    STYLES
// // ========================================================= */

// // const styles = `
// // * {
// //   box-sizing: border-box;
// // }

// // .users-page {
// //   min-height: 100vh;
// //   padding: 28px;
// //   background:
// //     radial-gradient(
// //       circle at top right,
// //       rgba(99, 102, 241, 0.08),
// //       transparent 30%
// //     ),
// //     #f6f7fb;
// //   color: #111827;
// // }

// // /* =========================================================
// //    HEADER
// // ========================================================= */

// // .users-header {
// //   display: flex;
// //   align-items: flex-end;
// //   justify-content: space-between;
// //   gap: 20px;
// //   margin-bottom: 25px;
// // }

// // .eyebrow {
// //   display: flex;
// //   align-items: center;
// //   gap: 7px;
// //   color: #6366f1;
// //   font-size: 11px;
// //   font-weight: 800;
// //   letter-spacing: 1.2px;
// //   margin-bottom: 8px;
// // }

// // .users-header h1 {
// //   margin: 0;
// //   font-size: 34px;
// //   line-height: 1.1;
// //   font-weight: 800;
// //   letter-spacing: -1px;
// // }

// // .users-header p {
// //   margin: 8px 0 0;
// //   color: #6b7280;
// //   font-size: 14px;
// // }

// // .header-actions {
// //   display: flex;
// //   gap: 10px;
// //   align-items: center;
// // }

// // .add-user-btn,
// // .refresh-btn,
// // .icon-btn,
// // .cancel-btn,
// // .save-btn,
// // .delete-confirm-btn {
// //   border: 0;
// //   font-family: inherit;
// //   cursor: pointer;
// // }

// // .add-user-btn {
// //   display: inline-flex;
// //   align-items: center;
// //   justify-content: center;
// //   gap: 8px;
// //   min-height: 44px;
// //   padding: 0 17px;
// //   border-radius: 11px;
// //   color: white;
// //   background: #111827;
// //   font-size: 13px;
// //   font-weight: 700;
// //   box-shadow: 0 8px 20px rgba(17, 24, 39, 0.16);
// //   transition: 0.2s;
// // }

// // .add-user-btn:hover {
// //   transform: translateY(-1px);
// //   background: #1f2937;
// // }

// // .refresh-btn {
// //   width: 44px;
// //   height: 44px;
// //   display: flex;
// //   align-items: center;
// //   justify-content: center;
// //   border-radius: 11px;
// //   background: white;
// //   color: #4b5563;
// //   border: 1px solid #e5e7eb;
// // }

// // .refresh-btn:hover {
// //   background: #f9fafb;
// // }

// // .spin {
// //   animation: spin 1s linear infinite;
// // }

// // /* =========================================================
// //    ALERTS
// // ========================================================= */

// // .alert {
// //   display: flex;
// //   align-items: center;
// //   gap: 10px;
// //   padding: 12px 14px;
// //   margin-bottom: 18px;
// //   border-radius: 11px;
// //   font-size: 13px;
// //   font-weight: 600;
// // }

// // .alert span {
// //   flex: 1;
// // }

// // .alert button {
// //   border: 0;
// //   background: transparent;
// //   cursor: pointer;
// //   display: flex;
// //   align-items: center;
// // }

// // .alert-error {
// //   color: #991b1b;
// //   background: #fef2f2;
// //   border: 1px solid #fecaca;
// // }

// // .alert-success {
// //   color: #166534;
// //   background: #f0fdf4;
// //   border: 1px solid #bbf7d0;
// // }

// // /* =========================================================
// //    STATS
// // ========================================================= */

// // .stats-grid {
// //   display: grid;
// //   grid-template-columns: repeat(5, 1fr);
// //   gap: 14px;
// //   margin-bottom: 20px;
// // }

// // .stat-card {
// //   min-height: 122px;
// //   display: flex;
// //   gap: 13px;
// //   padding: 18px;
// //   border: 1px solid #e7e9ef;
// //   border-radius: 15px;
// //   background: rgba(255, 255, 255, 0.92);
// //   box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
// // }

// // .stat-icon {
// //   width: 40px;
// //   height: 40px;
// //   flex: 0 0 40px;
// //   display: flex;
// //   align-items: center;
// //   justify-content: center;
// //   border-radius: 11px;
// //   background: #eef2ff;
// //   color: #6366f1;
// // }

// // .stat-content {
// //   display: flex;
// //   flex-direction: column;
// //   min-width: 0;
// // }

// // .stat-title {
// //   color: #6b7280;
// //   font-size: 12px;
// //   font-weight: 600;
// // }

// // .stat-value {
// //   margin-top: 3px;
// //   color: #111827;
// //   font-size: 26px;
// //   line-height: 1.1;
// // }

// // .stat-description {
// //   margin-top: 4px;
// //   color: #9ca3af;
// //   font-size: 11px;
// // }

// // /* =========================================================
// //    MAIN CARD
// // ========================================================= */

// // .users-card {
// //   overflow: visible;
// //   border: 1px solid #e5e7eb;
// //   border-radius: 16px;
// //   background: white;
// //   box-shadow: 0 8px 25px rgba(15, 23, 42, 0.04);
// // }

// // .filter-bar {
// //   display: flex;
// //   align-items: center;
// //   gap: 10px;
// //   padding: 17px;
// //   border-bottom: 1px solid #eef0f4;
// // }

// // .search-box {
// //   height: 42px;
// //   flex: 1;
// //   min-width: 220px;
// //   display: flex;
// //   align-items: center;
// //   gap: 9px;
// //   padding: 0 12px;
// //   border: 1px solid #e5e7eb;
// //   border-radius: 10px;
// //   color: #9ca3af;
// //   background: #fafafa;
// // }

// // .search-box:focus-within {
// //   border-color: #a5b4fc;
// //   background: white;
// //   box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
// // }

// // .search-box input {
// //   width: 100%;
// //   border: 0;
// //   outline: 0;
// //   background: transparent;
// //   font-family: inherit;
// //   font-size: 13px;
// //   color: #111827;
// // }

// // .search-box input::placeholder {
// //   color: #9ca3af;
// // }

// // .clear-search {
// //   display: flex;
// //   align-items: center;
// //   justify-content: center;
// //   border: 0;
// //   background: transparent;
// //   color: #9ca3af;
// //   cursor: pointer;
// // }

// // .filter-bar select {
// //   height: 42px;
// //   min-width: 145px;
// //   padding: 0 12px;
// //   border: 1px solid #e5e7eb;
// //   border-radius: 10px;
// //   background: white;
// //   color: #374151;
// //   font-family: inherit;
// //   font-size: 13px;
// //   outline: none;
// // }

// // .filter-bar select:focus {
// //   border-color: #a5b4fc;
// // }

// // .result-row {
// //   min-height: 48px;
// //   display: flex;
// //   align-items: center;
// //   justify-content: space-between;
// //   padding: 0 17px;
// //   border-bottom: 1px solid #eef0f4;
// //   color: #9ca3af;
// //   font-size: 12px;
// // }

// // .result-row strong {
// //   color: #374151;
// // }

// // .clear-filters {
// //   border: 0;
// //   background: transparent;
// //   color: #6366f1;
// //   cursor: pointer;
// //   font-size: 12px;
// //   font-weight: 700;
// // }

// // /* =========================================================
// //    TABLE
// // ========================================================= */

// // .desktop-table {
// //   width: 100%;
// //   overflow-x: auto;
// // }

// // .desktop-table table {
// //   width: 100%;
// //   min-width: 950px;
// //   border-collapse: collapse;
// // }

// // .desktop-table th {
// //   padding: 12px 17px;
// //   color: #9ca3af;
// //   background: #fafbfc;
// //   border-bottom: 1px solid #eef0f4;
// //   text-align: left;
// //   font-size: 10px;
// //   font-weight: 800;
// //   letter-spacing: 0.7px;
// // }

// // .desktop-table td {
// //   position: relative;
// //   padding: 15px 17px;
// //   border-bottom: 1px solid #f0f1f4;
// //   vertical-align: middle;
// //   font-size: 13px;
// // }

// // .desktop-table tbody tr:hover {
// //   background: #fafbff;
// // }

// // .user-cell {
// //   display: flex;
// //   align-items: center;
// //   gap: 11px;
// //   min-width: 220px;
// // }

// // .avatar {
// //   width: 40px;
// //   height: 40px;
// //   flex: 0 0 40px;
// //   display: flex;
// //   align-items: center;
// //   justify-content: center;
// //   border-radius: 50%;
// //   background: #eef2ff;
// //   color: #4f46e5;
// //   font-size: 12px;
// //   font-weight: 800;
// // }

// // .user-name {
// //   color: #111827;
// //   font-size: 13px;
// //   font-weight: 750;
// // }

// // .user-email {
// //   display: flex;
// //   align-items: center;
// //   gap: 4px;
// //   margin-top: 4px;
// //   color: #9ca3af;
// //   font-size: 11px;
// // }

// // .role-badge,
// // .status-badge {
// //   display: inline-flex;
// //   align-items: center;
// //   gap: 6px;
// //   white-space: nowrap;
// //   border-radius: 999px;
// //   font-size: 11px;
// //   font-weight: 700;
// // }

// // .role-badge {
// //   padding: 6px 9px;
// // }

// // .role-admin {
// //   color: #92400e;
// //   background: #fffbeb;
// // }

// // .role-user {
// //   color: #1d4ed8;
// //   background: #eff6ff;
// // }

// // .role-viewer {
// //   color: #475569;
// //   background: #f1f5f9;
// // }

// // .status-badge {
// //   gap: 6px;
// //   color: #166534;
// // }

// // .status-inactive {
// //   color: #991b1b;
// // }

// // .status-dot {
// //   width: 6px;
// //   height: 6px;
// //   border-radius: 50%;
// //   background: currentColor;
// // }

// // .tournament-count {
// //   display: inline-flex;
// //   min-width: 28px;
// //   justify-content: center;
// //   padding: 5px 8px;
// //   border-radius: 7px;
// //   background: #f5f3ff;
// //   color: #6d28d9;
// //   font-size: 11px;
// //   font-weight: 800;
// // }

// // .date-cell {
// //   display: flex;
// //   align-items: center;
// //   gap: 6px;
// //   color: #6b7280;
// //   white-space: nowrap;
// //   font-size: 12px;
// // }

// // .last-active {
// //   color: #6b7280;
// //   white-space: nowrap;
// //   font-size: 12px;
// // }

// // /* =========================================================
// //    ACTIONS
// // ========================================================= */

// // .actions-wrapper {
// //   position: relative;
// //   display: flex;
// //   justify-content: flex-end;
// // }

// // .icon-btn {
// //   width: 34px;
// //   height: 34px;
// //   display: inline-flex;
// //   align-items: center;
// //   justify-content: center;
// //   border-radius: 8px;
// //   color: #6b7280;
// //   background: transparent;
// // }

// // .icon-btn:hover {
// //   color: #111827;
// //   background: #f3f4f6;
// // }

// // .action-menu {
// //   position: absolute;
// //   top: calc(100% + 5px);
// //   right: 0;
// //   z-index: 50;
// //   width: 175px;
// //   padding: 6px;
// //   border: 1px solid #e5e7eb;
// //   border-radius: 10px;
// //   background: white;
// //   box-shadow:
// //     0 15px 40px rgba(15, 23, 42, 0.13),
// //     0 2px 8px rgba(15, 23, 42, 0.06);
// // }

// // .action-menu button {
// //   width: 100%;
// //   display: flex;
// //   align-items: center;
// //   gap: 9px;
// //   padding: 9px 10px;
// //   border: 0;
// //   border-radius: 7px;
// //   background: transparent;
// //   color: #374151;
// //   text-align: left;
// //   font-family: inherit;
// //   font-size: 12px;
// //   font-weight: 600;
// //   cursor: pointer;
// // }

// // .action-menu button:hover:not(:disabled) {
// //   background: #f5f6fa;
// // }

// // .action-menu button:disabled {
// //   opacity: 0.45;
// //   cursor: not-allowed;
// // }

// // .action-menu .danger-action {
// //   color: #dc2626;
// // }

// // .menu-divider {
// //   height: 1px;
// //   margin: 4px 0;
// //   background: #eef0f4;
// // }

// // /* =========================================================
// //    MOBILE
// // ========================================================= */

// // .mobile-users {
// //   display: none;
// // }

// // .mobile-user-card {
// //   position: relative;
// //   margin: 12px;
// //   padding: 14px;
// //   border: 1px solid #e5e7eb;
// //   border-radius: 13px;
// //   background: white;
// // }

// // .mobile-user-top {
// //   display: flex;
// //   align-items: flex-start;
// //   justify-content: space-between;
// // }

// // .mobile-user-details {
// //   display: grid;
// //   grid-template-columns: repeat(2, 1fr);
// //   gap: 13px;
// //   margin-top: 16px;
// //   padding-top: 14px;
// //   border-top: 1px solid #eef0f4;
// // }

// // .detail-label {
// //   display: block;
// //   margin-bottom: 6px;
// //   color: #9ca3af;
// //   font-size: 10px;
// //   font-weight: 700;
// //   text-transform: uppercase;
// //   letter-spacing: 0.4px;
// // }

// // .mobile-user-details strong {
// //   color: #374151;
// //   font-size: 12px;
// // }

// // .action-menu-mobile {
// //   position: absolute;
// //   top: 54px;
// //   right: 12px;
// // }

// // /* =========================================================
// //    PERMISSIONS
// // ========================================================= */

// // .permissions-section {
// //   margin-top: 30px;
// // }

// // .section-heading {
// //   margin-bottom: 16px;
// // }

// // .section-heading h2 {
// //   margin: 0;
// //   color: #111827;
// //   font-size: 21px;
// // }

// // .section-heading p {
// //   margin: 6px 0 0;
// //   color: #6b7280;
// //   font-size: 13px;
// // }

// // .permissions-grid {
// //   display: grid;
// //   grid-template-columns: repeat(3, 1fr);
// //   gap: 14px;
// // }

// // .permission-card {
// //   padding: 19px;
// //   border: 1px solid #e5e7eb;
// //   border-radius: 15px;
// //   background: white;
// //   box-shadow: 0 6px 20px rgba(15, 23, 42, 0.035);
// // }

// // .permission-top {
// //   display: flex;
// //   align-items: center;
// //   gap: 11px;
// // }

// // .permission-icon {
// //   width: 40px;
// //   height: 40px;
// //   display: flex;
// //   align-items: center;
// //   justify-content: center;
// //   border-radius: 11px;
// // }

// // .permission-admin .permission-icon {
// //   background: #fffbeb;
// //   color: #d97706;
// // }

// // .permission-user .permission-icon {
// //   background: #eff6ff;
// //   color: #2563eb;
// // }

// // .permission-viewer .permission-icon {
// //   background: #f1f5f9;
// //   color: #475569;
// // }

// // .permission-card h3 {
// //   margin: 0;
// //   font-size: 14px;
// // }

// // .permission-role {
// //   display: block;
// //   margin-top: 2px;
// //   color: #9ca3af;
// //   font-size: 9px;
// //   font-weight: 800;
// //   letter-spacing: 0.7px;
// // }

// // .permission-card > p {
// //   min-height: 34px;
// //   margin: 15px 0;
// //   color: #6b7280;
// //   font-size: 12px;
// //   line-height: 1.5;
// // }

// // .permission-list {
// //   display: flex;
// //   flex-direction: column;
// //   gap: 8px;
// // }

// // .permission-item {
// //   display: flex;
// //   align-items: center;
// //   gap: 8px;
// //   color: #4b5563;
// //   font-size: 11px;
// // }

// // .permission-item svg {
// //   color: #22c55e;
// //   flex: 0 0 auto;
// // }

// // /* =========================================================
// //    LOADING / EMPTY
// // ========================================================= */

// // .loading-state,
// // .empty-state {
// //   min-height: 280px;
// //   display: flex;
// //   flex-direction: column;
// //   align-items: center;
// //   justify-content: center;
// //   padding: 30px;
// //   text-align: center;
// // }

// // .loading-state strong,
// // .empty-state h3 {
// //   margin: 13px 0 5px;
// //   color: #374151;
// //   font-size: 14px;
// // }

// // .loading-state span,
// // .empty-state p {
// //   margin: 0;
// //   color: #9ca3af;
// //   font-size: 12px;
// // }

// // .loading-spinner {
// //   width: 30px;
// //   height: 30px;
// //   border: 3px solid #e5e7eb;
// //   border-top-color: #6366f1;
// //   border-radius: 50%;
// //   animation: spin 0.8s linear infinite;
// // }

// // .empty-icon {
// //   width: 60px;
// //   height: 60px;
// //   display: flex;
// //   align-items: center;
// //   justify-content: center;
// //   border-radius: 16px;
// //   background: #eef2ff;
// //   color: #6366f1;
// // }

// // /* =========================================================
// //    ACCESS DENIED
// // ========================================================= */

// // .access-denied {
// //   min-height: 70vh;
// //   display: flex;
// //   flex-direction: column;
// //   align-items: center;
// //   justify-content: center;
// //   text-align: center;
// // }

// // .access-icon {
// //   width: 70px;
// //   height: 70px;
// //   display: flex;
// //   align-items: center;
// //   justify-content: center;
// //   border-radius: 20px;
// //   color: #dc2626;
// //   background: #fef2f2;
// // }

// // .access-denied h2 {
// //   margin: 18px 0 7px;
// //   font-size: 22px;
// // }

// // .access-denied p {
// //   margin: 0;
// //   color: #6b7280;
// //   font-size: 13px;
// // }

// // /* =========================================================
// //    MODAL
// // ========================================================= */

// // .modal-overlay {
// //   position: fixed;
// //   inset: 0;
// //   z-index: 1000;
// //   display: flex;
// //   align-items: center;
// //   justify-content: center;
// //   padding: 20px;
// //   background: rgba(15, 23, 42, 0.5);
// //   backdrop-filter: blur(5px);
// // }

// // .modal {
// //   width: min(540px, 100%);
// //   max-height: calc(100vh - 40px);
// //   overflow-y: auto;
// //   border-radius: 18px;
// //   background: white;
// //   box-shadow: 0 30px 80px rgba(15, 23, 42, 0.25);
// // }

// // .modal-header {
// //   display: flex;
// //   align-items: flex-start;
// //   justify-content: space-between;
// //   gap: 15px;
// //   padding: 20px;
// //   border-bottom: 1px solid #eef0f4;
// // }

// // .modal-header > div:first-child {
// //   display: flex;
// //   align-items: flex-start;
// //   gap: 12px;
// // }

// // .modal-icon {
// //   width: 40px;
// //   height: 40px;
// //   display: flex;
// //   align-items: center;
// //   justify-content: center;
// //   border-radius: 11px;
// //   background: #eef2ff;
// //   color: #6366f1;
// // }

// // .modal-header h2 {
// //   margin: 0;
// //   font-size: 18px;
// // }

// // .modal-header p {
// //   margin: 4px 0 0;
// //   color: #9ca3af;
// //   font-size: 11px;
// // }

// // .modal-close {
// //   width: 34px;
// //   height: 34px;
// //   display: flex;
// //   align-items: center;
// //   justify-content: center;
// //   border: 0;
// //   border-radius: 8px;
// //   background: transparent;
// //   color: #6b7280;
// //   cursor: pointer;
// // }

// // .modal-close:hover {
// //   background: #f3f4f6;
// // }

// // .user-form {
// //   padding: 20px;
// // }

// // .form-group {
// //   margin-bottom: 16px;
// // }

// // .form-group label {
// //   display: block;
// //   margin-bottom: 7px;
// //   color: #374151;
// //   font-size: 11px;
// //   font-weight: 750;
// // }

// // .form-group label span {
// //   margin-left: 3px;
// //   color: #ef4444;
// // }

// // .input-wrapper {
// //   height: 43px;
// //   display: flex;
// //   align-items: center;
// //   gap: 9px;
// //   padding: 0 12px;
// //   border: 1px solid #e5e7eb;
// //   border-radius: 10px;
// //   color: #9ca3af;
// //   background: #fafafa;
// // }

// // .input-wrapper:focus-within {
// //   border-color: #a5b4fc;
// //   background: white;
// //   box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
// // }

// // .input-wrapper input {
// //   width: 100%;
// //   border: 0;
// //   outline: 0;
// //   background: transparent;
// //   font-family: inherit;
// //   font-size: 12px;
// // }

// // .form-group select {
// //   width: 100%;
// //   height: 43px;
// //   padding: 0 11px;
// //   border: 1px solid #e5e7eb;
// //   border-radius: 10px;
// //   outline: 0;
// //   background: #fafafa;
// //   color: #374151;
// //   font-family: inherit;
// //   font-size: 12px;
// // }

// // .form-row {
// //   display: grid;
// //   grid-template-columns: 1fr 1fr;
// //   gap: 12px;
// // }

// // .field-help {
// //   display: block;
// //   margin-top: 6px;
// //   color: #9ca3af;
// //   font-size: 10px;
// // }

// // .form-role-info {
// //   display: flex;
// //   align-items: flex-start;
// //   gap: 10px;
// //   margin-top: 2px;
// //   padding: 12px;
// //   border-radius: 10px;
// //   background: #f8f8ff;
// //   color: #6366f1;
// // }

// // .form-role-info > div {
// //   display: flex;
// //   flex-direction: column;
// //   gap: 3px;
// // }

// // .form-role-info strong {
// //   color: #374151;
// //   font-size: 11px;
// // }

// // .form-role-info span {
// //   color: #6b7280;
// //   font-size: 10px;
// //   line-height: 1.4;
// // }

// // .modal-footer {
// //   display: flex;
// //   justify-content: flex-end;
// //   gap: 9px;
// //   margin-top: 20px;
// //   padding-top: 16px;
// //   border-top: 1px solid #eef0f4;
// // }

// // .cancel-btn,
// // .save-btn,
// // .delete-confirm-btn {
// //   min-height: 40px;
// //   display: inline-flex;
// //   align-items: center;
// //   justify-content: center;
// //   gap: 7px;
// //   padding: 0 14px;
// //   border-radius: 9px;
// //   font-size: 12px;
// //   font-weight: 700;
// // }

// // .cancel-btn {
// //   background: #f3f4f6;
// //   color: #374151;
// // }

// // .cancel-btn:hover {
// //   background: #e5e7eb;
// // }

// // .save-btn {
// //   color: white;
// //   background: #111827;
// // }

// // .save-btn:hover:not(:disabled) {
// //   background: #1f2937;
// // }

// // .save-btn:disabled,
// // .delete-confirm-btn:disabled {
// //   opacity: 0.6;
// //   cursor: not-allowed;
// // }

// // .button-spinner {
// //   width: 14px;
// //   height: 14px;
// //   border: 2px solid rgba(255,255,255,0.35);
// //   border-top-color: white;
// //   border-radius: 50%;
// //   animation: spin 0.7s linear infinite;
// // }

// // /* =========================================================
// //    DELETE MODAL
// // ========================================================= */

// // .delete-modal {
// //   width: min(410px, 100%);
// //   padding: 25px;
// //   border-radius: 18px;
// //   background: white;
// //   text-align: center;
// //   box-shadow: 0 30px 80px rgba(15, 23, 42, 0.25);
// // }

// // .delete-icon {
// //   width: 54px;
// //   height: 54px;
// //   margin: 0 auto;
// //   display: flex;
// //   align-items: center;
// //   justify-content: center;
// //   border-radius: 15px;
// //   color: #dc2626;
// //   background: #fef2f2;
// // }

// // .delete-modal h2 {
// //   margin: 15px 0 7px;
// //   font-size: 19px;
// // }

// // .delete-modal > p {
// //   margin: 0 auto 17px;
// //   color: #6b7280;
// //   font-size: 12px;
// //   line-height: 1.6;
// // }

// // .delete-user-preview {
// //   display: flex;
// //   align-items: center;
// //   gap: 10px;
// //   padding: 12px;
// //   margin-bottom: 18px;
// //   border: 1px solid #eef0f4;
// //   border-radius: 11px;
// //   text-align: left;
// // }

// // .delete-user-preview > div:last-child {
// //   display: flex;
// //   flex-direction: column;
// //   gap: 3px;
// // }

// // .delete-user-preview strong {
// //   color: #374151;
// //   font-size: 12px;
// // }

// // .delete-user-preview span {
// //   color: #9ca3af;
// //   font-size: 10px;
// // }

// // .delete-actions {
// //   display: flex;
// //   justify-content: center;
// //   gap: 9px;
// // }

// // .delete-confirm-btn {
// //   color: white;
// //   background: #dc2626;
// // }

// // .delete-confirm-btn:hover:not(:disabled) {
// //   background: #b91c1c;
// // }

// // /* =========================================================
// //    ANIMATION
// // ========================================================= */

// // @keyframes spin {
// //   to {
// //     transform: rotate(360deg);
// //   }
// // }

// // /* =========================================================
// //    RESPONSIVE
// // ========================================================= */

// // @media (max-width: 1200px) {
// //   .stats-grid {
// //     grid-template-columns: repeat(3, 1fr);
// //   }

// //   .permissions-grid {
// //     grid-template-columns: 1fr;
// //   }
// // }

// // @media (max-width: 800px) {
// //   .users-page {
// //     padding: 18px;
// //   }

// //   .users-header {
// //     align-items: flex-start;
// //     flex-direction: column;
// //   }

// //   .header-actions {
// //     width: 100%;
// //   }

// //   .add-user-btn {
// //     flex: 1;
// //   }

// //   .stats-grid {
// //     grid-template-columns: repeat(2, 1fr);
// //   }

// //   .filter-bar {
// //     align-items: stretch;
// //     flex-direction: column;
// //   }

// //   .search-box {
// //     width: 100%;
// //   }

// //   .filter-bar select {
// //     width: 100%;
// //   }

// //   .desktop-table {
// //     display: none;
// //   }

// //   .mobile-users {
// //     display: block;
// //   }
// // }

// // @media (max-width: 520px) {
// //   .users-page {
// //     padding: 13px;
// //   }

// //   .users-header h1 {
// //     font-size: 28px;
// //   }

// //   .stats-grid {
// //     grid-template-columns: 1fr;
// //   }

// //   .stats-grid .stat-card {
// //     min-height: 100px;
// //   }

// //   .result-row {
// //     padding: 0 13px;
// //   }

// //   .modal-overlay {
// //     padding: 10px;
// //   }

// //   .modal {
// //     max-height: calc(100vh - 20px);
// //   }

// //   .form-row {
// //     grid-template-columns: 1fr;
// //     gap: 0;
// //   }

// //   .mobile-user-details {
// //     grid-template-columns: 1fr 1fr;
// //   }

// //   .delete-modal {
// //     padding: 20px;
// //   }
// // }
// // `;
