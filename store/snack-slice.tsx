import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type SnackVariant = "success" | "error" | "warning";

type SliceState = {
  snackbar: {
    status: boolean;
    message: string;
    variant: SnackVariant;
  };
};

const initialState: SliceState = {
  snackbar: {
    status: false,
    message: "",
    variant: "success",
  },
};

const snackSlice = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    showSnack(
      state,
      action: PayloadAction<{
        message: string;
        variant?: SnackVariant;
      }>,
    ) {
      state.snackbar = {
        status: true,
        message: action.payload.message,
        variant: action.payload.variant ?? "success",
      };
    },
    hideSnack(state) {
      state.snackbar = {
        ...initialState.snackbar,
      };
    },
  },
});

export const snackActions = snackSlice.actions;

export default snackSlice;
