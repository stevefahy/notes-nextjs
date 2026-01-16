import { configureStore, Action, ThunkAction } from "@reduxjs/toolkit";
import uiSlice from "./ui-slice";
import editSlice from "./edit-slice";
import snackSlice from "./snack-slice";

export const store = configureStore({
  reducer: {
    ui: uiSlice.reducer,
    edit: editSlice.reducer,
    snack: snackSlice.reducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
