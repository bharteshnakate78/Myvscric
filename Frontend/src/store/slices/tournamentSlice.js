
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { tournamentAPI } from "../../services/api";

/*
|--------------------------------------------------------------------------
| FETCH TOURNAMENTS
|--------------------------------------------------------------------------
*/

export const fetchTournaments = createAsyncThunk(
  "tournaments/fetchTournaments",
  async (_, { rejectWithValue }) => {
    try {
      const response =
        await tournamentAPI.getAll();

      console.log(
        "TOURNAMENT LIST RESPONSE:",
        response.data
      );

      return Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

    } catch (error) {
      console.error(
        "FETCH TOURNAMENTS ERROR:",
        error
      );

      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch tournaments"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| CREATE TOURNAMENT
|--------------------------------------------------------------------------
*/

export const createTournament = createAsyncThunk(
  "tournaments/createTournament",
  async (data, { rejectWithValue }) => {
    try {
      const response =
        await tournamentAPI.create(data);

      console.log(
        "CREATE TOURNAMENT RESPONSE:",
        response.data
      );

      return response.data;

    } catch (error) {
      console.error(
        "CREATE TOURNAMENT ERROR:",
        error
      );

      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to create tournament"
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  tournaments: [],
  isLoading: false,
  error: null,
};

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/

const tournamentSlice = createSlice({
  name: "tournaments",

  initialState,

  reducers: {
    clearTournamentError: (state) => {
      state.error = null;
    },

    clearTournaments: (state) => {
      state.tournaments = [];
    },
  },

  extraReducers: (builder) => {

    builder

      /*
      |--------------------------------------------------------------------------
      | FETCH
      |--------------------------------------------------------------------------
      */

      .addCase(
        fetchTournaments.pending,
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )

      .addCase(
        fetchTournaments.fulfilled,
        (state, action) => {
          state.isLoading = false;
          state.tournaments =
            action.payload || [];
        }
      )

      .addCase(
        fetchTournaments.rejected,
        (state, action) => {
          state.isLoading = false;
          state.error =
            action.payload ||
            "Failed to fetch tournaments";
        }
      )

      /*
      |--------------------------------------------------------------------------
      | CREATE
      |--------------------------------------------------------------------------
      */

      .addCase(
        createTournament.pending,
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )

      .addCase(
        createTournament.fulfilled,
        (state, action) => {
          state.isLoading = false;

          if (action.payload) {
            state.tournaments.push(
              action.payload
            );
          }
        }
      )

      .addCase(
        createTournament.rejected,
        (state, action) => {
          state.isLoading = false;
          state.error =
            action.payload ||
            "Failed to create tournament";
        }
      );
  },
});

export const {
  clearTournamentError,
  clearTournaments,
} = tournamentSlice.actions;

export default tournamentSlice.reducer;


// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import { tournamentAPI } from '../../services/api';

// export const fetchTournaments = createAsyncThunk('tournaments/fetchAll', async (_, { rejectWithValue }) => {
//   try {
//     const response = await tournamentAPI.getAll();
//     return response.data.data;
//   } catch (error) {
//     return rejectWithValue(error.response?.data?.message || 'Failed to fetch');
//   }
// });

// const initialState = {
//   tournaments: [],
//   isLoading: false,
//   error: null,
// };

// const tournamentSlice = createSlice({
//   name: 'tournaments',
//   initialState,
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchTournaments.pending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addCase(fetchTournaments.fulfilled, (state, action) => {
//         state.isLoading = false;
//         state.tournaments = action.payload;
//       })
//       .addCase(fetchTournaments.rejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export default tournamentSlice.reducer;