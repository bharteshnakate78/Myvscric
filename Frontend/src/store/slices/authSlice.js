import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authAPI } from "../../services/api";
import { normalizeRole } from "../../constants/roles";

/*
|--------------------------------------------------------------------------
| Helper: Normalize User
|--------------------------------------------------------------------------
*/

const normalizeUser = (user = {}) => {
  return {
    id: user.id ?? user.userId ?? null,
    userId: user.userId ?? user.id ?? null,
    name: user.name ?? "",
    email: user.email ?? "",
    role: normalizeRole(user.role),
  };
};

/*
|--------------------------------------------------------------------------
| Get Initial User
|--------------------------------------------------------------------------
*/

const getInitialUser = () => {
  try {
    const user = localStorage.getItem("user");

    if (!user) {
      return null;
    }

    return JSON.parse(user);
  } catch (error) {
    localStorage.removeItem("user");
    return null;
  }
};

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);

      const result = response.data;

      console.log("LOGIN RESPONSE:", result);

      if (!result?.token) {
        return rejectWithValue(
          result?.message || "Login failed. Token was not returned."
        );
      }

      const responseUser = result.user || result;

      const user = normalizeUser({
        userId: responseUser.userId ?? responseUser.id,
        name: responseUser.name,
        email: responseUser.email,
        role: responseUser.role,
      });

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(user));

      return {
        token: result.token,
        user,
      };
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data ||
        error.message ||
        "Login failed.";

      return rejectWithValue(message);
    }
  }
);

/*
|--------------------------------------------------------------------------
| SIGNUP
|--------------------------------------------------------------------------
*/

export const signup = createAsyncThunk(
  "auth/signup",
  async (data, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(data);

      const result = response.data;

      console.log("SIGNUP RESPONSE:", result);

      /*
      |--------------------------------------------------------------------------
      | Case 1:
      | Backend returns JWT immediately
      |--------------------------------------------------------------------------
      */

      if (result?.token) {
        const user = normalizeUser(
          result.user || {
            userId: result.userId,
            name: result.name,
            email: result.email,
            role: result.role,
          }
        );

        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(user));

        return {
          token: result.token,
          user,
        };
      }

      /*
      |--------------------------------------------------------------------------
      | Case 2:
      | Backend returns only created user
      |--------------------------------------------------------------------------
      */

      if (result?.user) {
        return {
          user: normalizeUser(result.user),
          token: null,
        };
      }

      /*
      |--------------------------------------------------------------------------
      | Case 3:
      | Backend returns user directly
      |--------------------------------------------------------------------------
      */

      if (result?.email || result?.userId || result?.id) {
        return {
          user: normalizeUser(result),
          token: null,
        };
      }

      /*
      |--------------------------------------------------------------------------
      | Case 4:
      | Backend returns success/message only
      |--------------------------------------------------------------------------
      */

      if (
        result?.success === true ||
        result?.message ||
        response.status === 200 ||
        response.status === 201
      ) {
        return {
          user: null,
          token: null,
          message: result?.message || "Registration successful.",
        };
      }

      return rejectWithValue("Registration failed.");
    } catch (error) {
      console.error("SIGNUP ERROR:", error);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data ||
        error.message ||
        "Registration failed.";

      return rejectWithValue(message);
    }
  }
);

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  user: getInitialUser(),
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
  success: false,
};

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.success = false;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },

    clearAuthError: (state) => {
      state.error = null;
    },

    clearAuthSuccess: (state) => {
      state.success = false;
    },
  },

  extraReducers: (builder) => {
    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })

      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.success = true;

        state.token = action.payload.token;
        state.user = action.payload.user;
      })

      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.token = null;
        state.user = null;

        state.error =
          action.payload || "Unable to login. Please try again.";
      });

    /*
    |--------------------------------------------------------------------------
    | SIGNUP
    |--------------------------------------------------------------------------
    */

    builder
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })

      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.success = true;

        if (action.payload?.token) {
          state.token = action.payload.token;
        }

        if (action.payload?.user) {
          state.user = action.payload.user;
        }
      })

      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.success = false;

        state.error =
          action.payload ||
          "Unable to create account. Please try again.";
      });
  },
});

export const {
  logout,
  clearAuthError,
  clearAuthSuccess,
} = authSlice.actions;

export default authSlice.reducer;