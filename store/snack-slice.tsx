import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  snackbar: {
    status: boolean;
    message: string;
  };
};

// First approach: define the initial state using that type
const initialState: SliceState = {
  snackbar: {
    status: false,
    message: "",
  },
};

const snackSlice = createSlice({
  name: "snackbar",
  initialState: initialState,
  reducers: {
    showSnack(state, action) {
      state.snackbar = {
        status: action.payload.status,
        message: action.payload.message,
      };
    },
  },
});

export const snackActions = snackSlice.actions;

export default snackSlice;
