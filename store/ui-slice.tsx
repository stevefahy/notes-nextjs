import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  notification: {
    status: string;
    title: string;
    message: string;
  };
};

// First approach: define the initial state using that type
const initialState: SliceState = {
  notification: {
    status: "",
    title: "",
    message: "",
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState: { notification: { status: null, title: null, message: null } },
  reducers: {
    showNotification(state, action) {
      state.notification = {
        status: action.payload.status,
        title: action.payload.title,
        message: action.payload.message,
      };
    },
  },
});

export const uiActions = uiSlice.actions;

export default uiSlice;
