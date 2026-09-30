import React from "react";
import { Users, ShieldCheck, UserCog, Trophy } from "lucide-react";

import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p>Administration</p>

          <h1>Welcome, {user.name || "Admin"}</h1>

          <span>Manage your CricketScoreApp platform</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <Link to="/admin/users" className="dashboard-card">
          <Users size={30} />

          <h3>User Management</h3>

          <p>Create users and manage roles.</p>
        </Link>

        <div className="dashboard-card">
          <ShieldCheck size={30} />

          <h3>Security</h3>

          <p>Manage application access.</p>
        </div>

        <div className="dashboard-card">
          <UserCog size={30} />

          <h3>Roles</h3>

          <p>ADMIN, ORGANIZER, SCORER and USER.</p>
        </div>

        <div className="dashboard-card">
          <Trophy size={30} />

          <h3>Tournaments</h3>

          <p>Manage cricket tournaments.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
