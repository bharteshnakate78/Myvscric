import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">

      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="main-area">

        <Topbar
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="page-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default Layout;