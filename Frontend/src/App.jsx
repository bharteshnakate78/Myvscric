import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

import Tournaments from "./pages/Tournament";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import Matches from "./pages/Matches";
import Scoreboard from "./pages/Scoreboard";
import Users from "./pages/Users";

function getUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    return user?.role?.toString().trim().toUpperCase() || null;
  } catch (error) {
    console.error("Failed to read user role:", error);
    return null;
  }
}

function getDefaultRoute() {
  const role = getUserRole();

  switch (role) {
    case "ADMIN":
      return "/admin";

    case "ORGANIZER":
      return "/organizer";

    case "SCORER":
      return "/scorer";

    case "USER":
      return "/dashboard";

    default:
      return "/login";
  }
}

function App() {
  let isAuthenticated = false;

  try {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    isAuthenticated = Boolean(token && token.trim()) && Boolean(user);
  } catch (error) {
    console.error("Authentication check failed:", error);
    isAuthenticated = false;
  }

  return (
    <Routes>
      {/* =========================
          PUBLIC ROUTES
      ========================= */}

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRoute()} replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRoute()} replace />
          ) : (
            <Signup />
          )
        }
      />

      {/* =========================
          ADMIN
      ========================= */}

      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="/admin/users" element={<Users />} />
        </Route>
      </Route>

      {/* =========================
          ORGANIZER
      ========================= */}

      <Route element={<ProtectedRoute allowedRoles={["ORGANIZER"]} />}>
        <Route element={<Layout />}>
          <Route path="/organizer" element={<Dashboard />} />
        </Route>
      </Route>

      {/* =========================
          SCORER
      ========================= */}

      <Route element={<ProtectedRoute allowedRoles={["SCORER"]} />}>
        <Route element={<Layout />}>
          <Route path="/scorer" element={<Dashboard />} />
        </Route>
      </Route>

      {/* =========================
          NORMAL USER
      ========================= */}

      <Route element={<ProtectedRoute allowedRoles={["USER"]} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      {/* =========================
          COMMON AUTHENTICATED PAGES
      ========================= */}

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["ADMIN", "ORGANIZER", "SCORER", "USER"]}
          />
        }
      >
        <Route element={<Layout />}>
          <Route path="/tournaments" element={<Tournaments />} />

          <Route path="/teams" element={<Teams />} />

          <Route path="/players" element={<Players />} />

          <Route path="/matches" element={<Matches />} />

          <Route path="/scoreboard" element={<Scoreboard />} />
        </Route>
      </Route>

      {/* =========================
          DEFAULT
      ========================= */}

      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? getDefaultRoute() : "/login"}
            replace
          />
        }
      />

      {/* =========================
          404
      ========================= */}

      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? getDefaultRoute() : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;
// import React from "react";
// import { Routes, Route, Navigate } from "react-router-dom";

// import Layout from "./components/Layout";
// import ProtectedRoute from "./components/ProtectedRoute";

// import Login from "./pages/Login";
// import Signup from "./pages/Signup";
// import Dashboard from "./pages/Dashboard";
// import Tournaments from "./pages/Tournament";
// import Teams from "./pages/Teams";
// import Players from "./pages/Players";
// import Matches from "./pages/Matches";
// import Scoreboard from "./pages/Scoreboard";
// import Users from "./pages/Users";

// function App() {
//   let isAuthenticated = false;

//   try {
//     const token = localStorage.getItem("token");
//     const user = localStorage.getItem("user");

//     isAuthenticated = Boolean(token && token.trim()) && Boolean(user);
//   } catch (error) {
//     console.error("Authentication check failed:", error);

//     isAuthenticated = false;
//   }

//   return (
//     <Routes>
//       {/* =====================================================
//           PUBLIC ROUTES
//       ===================================================== */}

//       <Route
//         path="/login"
//         element={
//           isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
//         }
//       />

//       <Route
//         path="/signup"
//         element={
//           isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />
//         }
//       />

//       {/* =====================================================
//           AUTHENTICATED ROUTES
//       ===================================================== */}

//       <Route element={<ProtectedRoute />}>
//         <Route element={<Layout />}>
//           {/* =================================================
//               ADMIN DASHBOARD
//           ================================================= */}

//           <Route
//             path="/admin"
//             element={<ProtectedRoute allowedRoles={["ADMIN"]} />}
//           >
//             <Route index element={<Dashboard />} />
//           </Route>

//           {/* =================================================
//               ORGANIZER DASHBOARD
//           ================================================= */}

//           <Route
//             path="/organizer"
//             element={<ProtectedRoute allowedRoles={["ORGANIZER"]} />}
//           >
//             <Route index element={<Dashboard />} />
//           </Route>

//           {/* =================================================
//               SCORER DASHBOARD
//           ================================================= */}

//           <Route
//             path="/scorer"
//             element={<ProtectedRoute allowedRoles={["SCORER"]} />}
//           >
//             <Route index element={<Dashboard />} />
//           </Route>

//           {/* =================================================
//               USER DASHBOARD
//           ================================================= */}

//           <Route
//             path="/dashboard"
//             element={
//               <ProtectedRoute
//                 allowedRoles={["ADMIN", "ORGANIZER", "SCORER", "USER"]}
//               />
//             }
//           >
//             <Route index element={<Dashboard />} />
//           </Route>

//           {/* =================================================
//               TOURNAMENTS
//           ================================================= */}

//           <Route
//             path="/tournaments"
//             element={
//               <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "USER"]} />
//             }
//           >
//             <Route index element={<Tournaments />} />
//           </Route>

//           {/* =================================================
//               TEAMS
//           ================================================= */}

//           <Route
//             path="/teams"
//             element={
//               <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "USER"]} />
//             }
//           >
//             <Route index element={<Teams />} />
//           </Route>

//           {/* =================================================
//               PLAYERS
//           ================================================= */}

//           <Route
//             path="/players"
//             element={
//               <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "USER"]} />
//             }
//           >
//             <Route index element={<Players />} />
//           </Route>

//           {/* =================================================
//               MATCHES
//           ================================================= */}

//           <Route
//             path="/matches"
//             element={
//               <ProtectedRoute
//                 allowedRoles={["ADMIN", "ORGANIZER", "SCORER", "USER"]}
//               />
//             }
//           >
//             <Route index element={<Matches />} />
//           </Route>

//           {/* =================================================
//               SCOREBOARD
//           ================================================= */}

//           <Route
//             path="/scoreboard"
//             element={
//               <ProtectedRoute
//                 allowedRoles={["ADMIN", "ORGANIZER", "SCORER", "USER"]}
//               />
//             }
//           >
//             <Route index element={<Scoreboard />} />
//           </Route>
//         </Route>
//       </Route>

//       {/* =====================================================
//           ADMIN ONLY - USERS
//       ===================================================== */}

//       <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
//         <Route element={<Layout />}>
//           <Route path="/users" element={<Users />} />
//         </Route>
//       </Route>

//       {/* =====================================================
//           DEFAULT
//       ===================================================== */}

//       <Route
//         path="/"
//         element={
//           <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
//         }
//       />

//       {/* =====================================================
//           404
//       ===================================================== */}

//       <Route
//         path="*"
//         element={
//           <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
//         }
//       />
//     </Routes>
//   );
// }

// export default App;

// // import React from "react";
// // import { Routes, Route, Navigate } from "react-router-dom";

// // import Layout from "./components/Layout";
// // import ProtectedRoute from "./components/ProtectedRoute";

// // import Login from "./pages/Login";
// // import Signup from "./pages/Signup";
// // import Dashboard from "./pages/Dashboard";
// // import Tournaments from "./pages/Tournament";
// // import Teams from "./pages/Teams";
// // import Players from "./pages/Players";
// // import Matches from "./pages/Matches";
// // import Scoreboard from "./pages/Scoreboard";
// // import Users from "./pages/Users";

// // function App() {
// //   let isAuthenticated = false;

// //   try {
// //     const token = localStorage.getItem("token");
// //     const user = localStorage.getItem("user");

// //     isAuthenticated = Boolean(token && token.trim()) && Boolean(user);
// //   } catch (error) {
// //     console.error("Authentication check failed:", error);
// //     isAuthenticated = false;
// //   }

// //   return (
// //     <Routes>
// //       {/* =====================================================
// //           PUBLIC ROUTES
// //       ===================================================== */}

// //       <Route
// //         path="/login"
// //         element={
// //           isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
// //         }
// //       />

// //       <Route
// //         path="/signup"
// //         element={
// //           isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />
// //         }
// //       />

// //       {/* =====================================================
// //           PROTECTED ROUTES
// //       ===================================================== */}

// //       <Route element={<ProtectedRoute />}>
// //         <Route element={<Layout />}>
// //           <Route path="/dashboard" element={<Dashboard />} />

// //           <Route
// //             path="/tournaments"
// //             element={
// //               <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "USER"]} />
// //             }
// //           >
// //             <Route index element={<Tournaments />} />
// //           </Route>

// //           <Route
// //             path="/teams"
// //             element={
// //               <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "USER"]} />
// //             }
// //           >
// //             <Route index element={<Teams />} />
// //           </Route>

// //           <Route
// //             path="/players"
// //             element={
// //               <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "USER"]} />
// //             }
// //           >
// //             <Route index element={<Players />} />
// //           </Route>

// //           <Route
// //             path="/matches"
// //             element={
// //               <ProtectedRoute
// //                 allowedRoles={["ADMIN", "ORGANIZER", "SCORER", "USER"]}
// //               />
// //             }
// //           >
// //             <Route index element={<Matches />} />
// //           </Route>

// //           <Route
// //             path="/scoreboard"
// //             element={
// //               <ProtectedRoute
// //                 allowedRoles={["ADMIN", "ORGANIZER", "SCORER", "USER"]}
// //               />
// //             }
// //           >
// //             <Route index element={<Scoreboard />} />
// //           </Route>
// //         </Route>
// //       </Route>

// //       {/* =====================================================
// //           ADMIN ONLY
// //       ===================================================== */}

// //       <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
// //         <Route element={<Layout />}>
// //           <Route path="/users" element={<Users />} />
// //         </Route>
// //       </Route>

// //       {/* =====================================================
// //           DEFAULT ROUTE
// //       ===================================================== */}

// //       <Route
// //         path="/"
// //         element={
// //           <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
// //         }
// //       />

// //       {/* =====================================================
// //           404
// //       ===================================================== */}

// //       <Route
// //         path="*"
// //         element={
// //           <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
// //         }
// //       />
// //     </Routes>
// //   );
// // }

// // export default App;

// // // import React from "react";
// // // import { Routes, Route, Navigate } from "react-router-dom";

// // // import Login from "./pages/Login";
// // // import Signup from "./pages/Signup";
// // // import Dashboard from "./pages/Dashboard";
// // // import Tournaments from "./pages/Tournament";
// // // import Teams from "./pages/Teams";
// // // import Players from "./pages/Players";
// // // import Matches from "./pages/Matches";
// // // import Scoreboard from "./pages/Scoreboard";
// // // import Users from "./pages/Users";

// // // import ProtectedRoute from "./components/ProtectedRoute";

// // // const App = () => {
// // //   return (
// // //     <>
// // //       <Routes>
// // //         {/* PUBLIC */}

// // //         <Route path="/login" element={<Login />} />

// // //         <Route path="/signup" element={<Signup />} />

// // //         {/* PROTECTED */}

// // //         <Route element={<ProtectedRoute />}>
// // //           <Route path="/dashboard" element={<Dashboard />} />

// // //           <Route path="/tournaments" element={<Tournaments />} />

// // //           <Route path="/teams" element={<Teams />} />

// // //           <Route path="/players" element={<Players />} />

// // //           <Route path="/matches" element={<Matches />} />

// // //           <Route path="/scoreboard" element={<Scoreboard />} />
// // //         </Route>

// // //         {/* ADMIN */}

// // //         <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
// // //           <Route path="/users" element={<Users />} />
// // //         </Route>

// // //         {/* DEFAULT */}

// // //         <Route path="/" element={<Navigate to="/dashboard" replace />} />

// // //         <Route path="*" element={<Navigate to="/dashboard" replace />} />
// // //       </Routes>
// // //     </>
// // //   );
// // // };

// // // export default App;

// // import React from "react";
// // import { Routes, Route, Navigate } from "react-router-dom";

// // import Layout from "./components/Layout";
// // import ProtectedRoute from "./components/ProtectedRoute";

// // import Login from "./pages/Login";
// // import Signup from "./pages/Signup";
// // import Dashboard from "./pages/Dashboard";
// // import Tournaments from "./pages/Tournament";
// // import Teams from "./pages/Teams";
// // import Players from "./pages/Players";
// // import Matches from "./pages/Matches";
// // import Scoreboard from "./pages/Scoreboard";
// // import Users from "./pages/Users";

// // function App() {
// //   let user = null;

// //   try {
// //     user = JSON.parse(localStorage.getItem("user") || "null");
// //   } catch {
// //     user = null;
// //   }

// //   return (
// //     <Routes>
// //       {/* ================= LOGIN ================= */}

// //       <Route
// //         path="/login"
// //         element={user ? <Navigate to="/dashboard" replace /> : <Login />}
// //       />

// //       <Route
// //         path="/signup"
// //         element={user ? <Navigate to="/dashboard" replace /> : <Signup />}
// //       />

// //       {/* ================= PROTECTED ================= */}

// //       <Route element={<ProtectedRoute />}>
// //         <Route element={<Layout />}>
// //           <Route path="/dashboard" element={<Dashboard />} />

// //           <Route path="/tournaments" element={<Tournaments />} />

// //           <Route path="/teams" element={<Teams />} />

// //           <Route path="/players" element={<Players />} />

// //           <Route path="/matches" element={<Matches />} />

// //           <Route path="/scoreboard" element={<Scoreboard />} />
// //         </Route>
// //       </Route>

// //       <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
// //         <Route element={<Layout />}>
// //           <Route path="/users" element={<Users />} />
// //         </Route>
// //       </Route>

// //       {/* ================= HOME ================= */}

// //       <Route
// //         path="/"
// //         element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
// //       />

// //       {/* ================= 404 ================= */}

// //       <Route
// //         path="*"
// //         element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
// //       />
// //     </Routes>
// //   );
// // }

// // export default App;
