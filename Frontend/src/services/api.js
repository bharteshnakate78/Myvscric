// import axios from "axios";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api";
// const api = axios.create({ baseURL: API_URL, timeout: 15000, headers: { "Content-Type": "application/json" } });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token?.trim()) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
// api.interceptors.response.use((r) => r, (error) => {
//   const status = error.response?.status; const url = error.config?.url || "";
//   console.error("API ERROR", status, url, error.response?.data || error.message);
//   if (status === 401 && !url.includes("/auth/login") && !url.includes("/auth/register")) {
//     localStorage.removeItem("token"); localStorage.removeItem("user");
//     if (window.location.pathname !== "/login") window.location.href = "/login";
//   }
//   return Promise.reject(error);
// });

// export const authAPI = { login:(d)=>api.post("/auth/login",d), register:(d)=>api.post("/auth/register",d), logout:()=>{localStorage.removeItem("token");localStorage.removeItem("user");} };
// export const tournamentAPI = { getAll:()=>api.get("/tournaments"), getById:(id)=>api.get(`/tournaments/${id}`), create:(d)=>api.post("/tournaments",d), update:(id,d)=>api.put(`/tournaments/${id}`,d), delete:(id)=>api.delete(`/tournaments/${id}`) };
// export const teamAPI = { getAll:()=>api.get("/teams"), getById:(id)=>api.get(`/teams/${id}`), getByTournament:(id)=>api.get(`/teams/tournament/${id}`), create:(d)=>api.post("/teams",d), update:(id,d)=>api.put(`/teams/${id}`,d), delete:(id)=>api.delete(`/teams/${id}`) };
// export const playerAPI = { getAll:()=>api.get("/players"), getById:(id)=>api.get(`/players/${id}`), getByTeam:(id)=>api.get(`/players/team/${id}`), getStats:()=>api.get("/players/stats"), getTeams:()=>api.get("/players/teams"), create:(d)=>api.post("/players",d), update:(id,d)=>api.put(`/players/${id}`,d), delete:(id)=>api.delete(`/players/${id}`) };
// export const matchAPI = { getAll:()=>api.get("/matches"), getById:(id)=>api.get(`/matches/${id}`), getByStatus:(s)=>api.get(`/matches/status/${s}`), getByTournament:(id)=>api.get(`/matches/tournament/${id}`), create:(d)=>api.post("/matches",d), update:(id,d)=>api.put(`/matches/${id}`,d), delete:(id)=>api.delete(`/matches/${id}`), start:(id)=>api.post(`/matches/${id}/start`) };
// export const inningsAPI = { getAll:()=>api.get("/innings"), getById:(id)=>api.get(`/innings/${id}`), getByMatch:(id)=>api.get(`/innings/match/${id}`), getCurrent:(id)=>api.get(`/innings/match/${id}`), create:(d)=>api.post("/innings",d), update:(id,d)=>api.put(`/innings/${id}/score`,d), updateScore:(id,d)=>api.put(`/innings/${id}/score`,d), complete:(id)=>api.put(`/innings/${id}/complete`), delete:(id)=>api.delete(`/innings/${id}`) };
// export const scoreAPI = { getAll:()=>api.get("/scores"), getByMatch:(id)=>api.get(`/scores/match/${id}`), getCurrent:(id)=>api.get(`/scores/match/${id}`), create:(d)=>api.post("/scores",d), createForMatch:(id,d)=>api.post(`/scores/match/${id}`,d), update:(id,d)=>api.put(`/scores/${id}`,d), recordBall:(d)=>api.post("/scores/ball",{matchId:Number(d.matchId),runs:Number(d.runs||0),wicket:Boolean(d.wicket),ballType:d.ballType||"NORMAL",striker:d.striker||null,nonStriker:d.nonStriker||null,bowler:d.bowler||null,batsmanRuns:Number(d.batsmanRuns||0),wicketType:d.wicketType||null,description:d.description||null,legalBall:d.legalBall!==undefined?Boolean(d.legalBall):true}), undoLastBall:(id)=>api.post(`/scores/match/${id}/undo`), startInnings:(id)=>api.post(`/scores/match/${id}/start-innings`), resetForNewInnings:(id)=>api.post(`/scores/match/${id}/start-innings`), reset:(id)=>api.post(`/scores/${id}/reset`), delete:(id)=>api.delete(`/scores/${id}`) };
// export const userAPI = { getAll:()=>api.get("/users"), getById:(id)=>api.get(`/users/id/${id}`), getByEmail:(e)=>api.get(`/users/email/${encodeURIComponent(e)}`), create:(d)=>api.post("/users",d), update:(id,d)=>api.put(`/users/${id}`,d), toggleStatus:(id)=>api.patch(`/users/${id}/status`), delete:(id)=>api.delete(`/users/${id}`) };
// export const adminAPI = { getUsers:()=>api.get("/admin/users"), createUser:(d)=>api.post("/admin/users",d), changeRole:(id,role)=>api.put(`/admin/users/${id}/role`,{role}), deleteUser:(id)=>api.delete(`/admin/users/${id}`) };
// export const dashboardAPI = { get:()=>api.get("/dashboard"), getStats:()=>api.get("/dashboard/stats") };
// export const getStoredUser=()=>{try{return JSON.parse(localStorage.getItem("user")||"null")}catch{return null}};
// export const getToken=()=>localStorage.getItem("token");
// export const isAuthenticated=()=>Boolean(getToken()?.trim());
// export const getUserRole=()=>String(getStoredUser()?.role||"").replace(/^ROLE_/i,"").toUpperCase();
// export const logout=()=>{authAPI.logout();window.location.href="/login"};
// export default api;
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8081/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// =========================================================
// REQUEST INTERCEPTOR
// =========================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token?.trim()) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================================================
// RESPONSE INTERCEPTOR
// =========================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    console.error(
      "API ERROR",
      status,
      url,
      error.response?.data || error.message
    );

    if (
      status === 401 &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/register")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// =========================================================
// AUTH API
// =========================================================

export const authAPI = {
  login: (data) =>
    api.post("/auth/login", data),

  register: (data) =>
    api.post("/auth/register", data),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

// =========================================================
// TOURNAMENT API
// =========================================================

export const tournamentAPI = {
  getAll: () =>
    api.get("/tournaments"),

  getById: (id) =>
    api.get(`/tournaments/${id}`),

  create: (data) =>
    api.post("/tournaments", data),

  update: (id, data) =>
    api.put(`/tournaments/${id}`, data),

  delete: (id) =>
    api.delete(`/tournaments/${id}`),
};

// =========================================================
// TEAM API
// =========================================================

export const teamAPI = {
  getAll: () =>
    api.get("/teams"),

  getById: (id) =>
    api.get(`/teams/${id}`),

  getByTournament: (id) =>
    api.get(`/teams/tournament/${id}`),

  create: (data) =>
    api.post("/teams", data),

  update: (id, data) =>
    api.put(`/teams/${id}`, data),

  delete: (id) =>
    api.delete(`/teams/${id}`),
};

// =========================================================
// PLAYER API
// =========================================================

export const playerAPI = {
  getAll: () =>
    api.get("/players"),

  getById: (id) =>
    api.get(`/players/${id}`),

  getByTeam: (id) =>
    api.get(`/players/team/${id}`),

  getStats: () =>
    api.get("/players/stats"),

  getTeams: () =>
    api.get("/players/teams"),

  create: (data) =>
    api.post("/players", data),

  update: (id, data) =>
    api.put(`/players/${id}`, data),

  delete: (id) =>
    api.delete(`/players/${id}`),
};

// =========================================================
// MATCH API
// =========================================================

export const matchAPI = {
  getAll: () =>
    api.get("/matches"),

  getById: (id) =>
    api.get(`/matches/${id}`),

  getByStatus: (status) =>
    api.get(`/matches/status/${status}`),

  getByTournament: (id) =>
    api.get(`/matches/tournament/${id}`),

  create: (data) =>
    api.post("/matches", data),

  update: (id, data) =>
    api.put(`/matches/${id}`, data),

  delete: (id) =>
    api.delete(`/matches/${id}`),

  start: (id) =>
    api.post(`/matches/${id}/start`),
};

// =========================================================
// INNINGS API
// =========================================================

export const inningsAPI = {

  // Get all innings
  getAll: () =>
    api.get("/innings"),

  // Get innings by ID
  getById: (id) =>
    api.get(`/innings/${id}`),

  // Get all innings of a match
  getByMatch: (id) =>
    api.get(`/innings/match/${id}`),

  // IMPORTANT
  // Get currently active/latest innings
  getCurrent: (id) =>
    api.get(`/innings/current/${id}`),

  // Create innings
  create: (data) =>
    api.post("/innings", data),

  // Update innings score
  update: (id, data) =>
    api.put(`/innings/${id}/score`, data),

  // Same method, kept for compatibility
  updateScore: (id, data) =>
    api.put(`/innings/${id}/score`, data),

  // Complete innings
  complete: (id) =>
    api.put(`/innings/${id}/complete`),

  // Delete innings
  delete: (id) =>
    api.delete(`/innings/${id}`),
};

// =========================================================
// SCORE API
// =========================================================

export const scoreAPI = {

  getAll: () =>
    api.get("/scores"),

  getByMatch: (id) =>
    api.get(`/scores/match/${id}`),

  getCurrent: (id) =>
    api.get(`/scores/match/${id}`),

  create: (data) =>
    api.post("/scores", data),

  createForMatch: (id, data) =>
    api.post(`/scores/match/${id}`, data),

  update: (id, data) =>
    api.put(`/scores/${id}`, data),

  recordBall: (data) =>
    api.post("/scores/ball", {
      matchId: Number(data.matchId),

      runs: Number(data.runs || 0),

      wicket: Boolean(data.wicket),

      ballType:
        data.ballType || "NORMAL",

      striker:
        data.striker || null,

      nonStriker:
        data.nonStriker || null,

      bowler:
        data.bowler || null,

      batsmanRuns:
        Number(data.batsmanRuns || 0),

      wicketType:
        data.wicketType || null,

      description:
        data.description || null,

      legalBall:
        data.legalBall !== undefined
          ? Boolean(data.legalBall)
          : true,
    }),

  undoLastBall: (id) =>
    api.post(`/scores/match/${id}/undo`),

  startInnings: (id) =>
    api.post(`/scores/match/${id}/start-innings`),

  resetForNewInnings: (id) =>
    api.post(`/scores/match/${id}/start-innings`),

  reset: (id) =>
    api.post(`/scores/${id}/reset`),

  delete: (id) =>
    api.delete(`/scores/${id}`),
};

// =========================================================
// USER API
// =========================================================

export const userAPI = {

  getAll: () =>
    api.get("/users"),

  getById: (id) =>
    api.get(`/users/id/${id}`),

  getByEmail: (email) =>
    api.get(
      `/users/email/${encodeURIComponent(email)}`
    ),

  create: (data) =>
    api.post("/users", data),

  update: (id, data) =>
    api.put(`/users/${id}`, data),

  toggleStatus: (id) =>
    api.patch(`/users/${id}/status`),

  delete: (id) =>
    api.delete(`/users/${id}`),
};

// =========================================================
// ADMIN API
// =========================================================

export const adminAPI = {

  getUsers: () =>
    api.get("/admin/users"),

  createUser: (data) =>
    api.post("/admin/users", data),

  changeRole: (id, role) =>
    api.put(`/admin/users/${id}/role`, {
      role,
    }),

  deleteUser: (id) =>
    api.delete(`/admin/users/${id}`),
};

// =========================================================
// DASHBOARD API
// =========================================================

export const dashboardAPI = {

  get: () =>
    api.get("/dashboard"),

  getStats: () =>
    api.get("/dashboard/stats"),
};

// =========================================================
// AUTH HELPERS
// =========================================================

export const getStoredUser = () => {

  try {

    return JSON.parse(
      localStorage.getItem("user") || "null"
    );

  } catch {

    return null;
  }
};

export const getToken = () =>
  localStorage.getItem("token");

export const isAuthenticated = () =>
  Boolean(getToken()?.trim());

export const getUserRole = () =>
  String(
    getStoredUser()?.role || ""
  )
    .replace(/^ROLE_/i, "")
    .toUpperCase();

export const logout = () => {

  authAPI.logout();

  window.location.href = "/login";
};

export default api;