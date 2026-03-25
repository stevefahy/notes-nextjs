import type { AppDispatch } from "../store";
import { snackActions } from "../store/snack-slice";
import { showErrorMessage } from "./errorMessageMap";

export function dispatchErrorSnack(
  dispatch: AppDispatch,
  raw: unknown,
  fromServer?: boolean,
) {
  dispatch(
    snackActions.showSnack({
      message: showErrorMessage(raw, fromServer),
      variant: "error",
    }),
  );
}

export function dispatchWarningSnack(dispatch: AppDispatch, message: string) {
  dispatch(
    snackActions.showSnack({
      message,
      variant: "warning",
    }),
  );
}

export function dispatchSuccessSnack(dispatch: AppDispatch, message: string) {
  dispatch(
    snackActions.showSnack({
      message,
      variant: "success",
    }),
  );
}
