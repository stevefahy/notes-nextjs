import { createSlice } from "@reduxjs/toolkit";

type SliceState = {
  editing: {
    status: boolean;
  };
  edited: {
    message: { _id: string; notebook_name: string; notebook_cover: string };
  };
};

// First approach: define the initial state using that type
const initialState: SliceState = {
  editing: {
    status: false,
  },
  edited: {
    message: { _id: "", notebook_name: "", notebook_cover: "" },
  },
};

const editSlice = createSlice({
  name: "edit",
  initialState: initialState,
  reducers: {
    editStatus(state, action) {
      state.editing = {
        status: action.payload.status,
      };
    },
    editChange(state, action) {
      state.edited = {
        message: action.payload.message,
      };
    },
  },
});

export const editActions = editSlice.actions;

export default editSlice;
