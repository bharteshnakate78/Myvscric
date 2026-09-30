import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const id = Date.now();
      state.notifications.push({ id, ...action.payload });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
  },
});

export const { addNotification, removeNotification } = uiSlice.actions;
export default uiSlice.reducer;
