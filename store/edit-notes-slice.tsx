import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/** Mirrors Svelte `src/stores/editNotes.ts` — drives the "N selected" header pill in edit mode. */
export type EditNotesState = {
  active: boolean;
  selectedCount: number;
};

const initialState: EditNotesState = {
  active: false,
  selectedCount: 0,
};

const editNotesSlice = createSlice({
  name: "editNotes",
  initialState,
  reducers: {
    setActiveAndCount(
      state,
      action: PayloadAction<{ active: boolean; selectedCount: number }>,
    ) {
      state.active = action.payload.active;
      state.selectedCount = action.payload.selectedCount;
    },
    updateSelectedCount(state, action: PayloadAction<number>) {
      state.selectedCount = action.payload;
    },
    resetEditNotes() {
      return initialState;
    },
  },
});

export const editNotesActions = editNotesSlice.actions;
export default editNotesSlice;
