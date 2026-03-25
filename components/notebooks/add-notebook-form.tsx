import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import classes from "./add-notebook-form.module.css";
import {
  FolderOptions,
  mapLegacyCover,
  type NotebookCoverType,
} from "../../lib/folder-options";
import { NotebookAddEdit } from "../../types";
import APPLICATION_CONSTANTS from "../../application_constants/applicationConstants";
import { dispatchErrorSnack } from "../../lib/dispatchSnack";
import { useAppDispatch } from "../../store/hooks";
import ErrorAlert from "../ui/error-alert";

const AC = APPLICATION_CONSTANTS;

const swatchClass: Record<NotebookCoverType, string> = {
  forest: classes.swatchForest,
  emerald: classes.swatchEmerald,
  lime: classes.swatchLime,
  sage: classes.swatchSage,
};

const AddNotebookForm = (props: NotebookAddEdit) => {
  const dispatch = useAppDispatch();
  const [error, setError] = useState({ state: false, message: "" });
  const [selectedCover, setSelectedCover] = useState<NotebookCoverType>(() =>
    props.method === "edit" && props.notebook
      ? mapLegacyCover(props.notebook.notebook_cover)
      : "forest",
  );
  const [selectedName, setSelectedName] = useState(() =>
    props.method === "edit" && props.notebook
      ? props.notebook.notebook_name
      : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.method === "edit" && props.notebook) {
      setSelectedCover(mapLegacyCover(props.notebook.notebook_cover));
      setSelectedName(props.notebook.notebook_name);
    }
  }, [props.method, props.notebook]);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const originalName =
    props.method === "edit" && props.notebook
      ? props.notebook.notebook_name
      : "";
  const originalCover: NotebookCoverType =
    props.method === "edit" && props.notebook
      ? mapLegacyCover(props.notebook.notebook_cover)
      : "forest";

  const isConfirmDisabled = useMemo(() => {
    if (props.method === "create") {
      return (
        selectedName.length < AC.NOTEBOOK_NAME_MIN ||
        selectedName.length > AC.NOTEBOOK_NAME_MAX
      );
    }
    const hasChange =
      selectedName !== originalName || selectedCover !== originalCover;
    const nameValid =
      selectedName.length >= AC.NOTEBOOK_NAME_MIN &&
      selectedName.length <= AC.NOTEBOOK_NAME_MAX;
    return !hasChange || !nameValid;
  }, [props.method, originalName, originalCover, selectedName, selectedCover]);

  const finishClose = useCallback(() => {
    setError({ state: false, message: "" });
    props.onCancel();
  }, [props]);

  const requestClose = useCallback((event?: React.SyntheticEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    setError({ state: false, message: "" });
    setClosing(true);
  }, []);

  const handleSheetAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      if (!closing) return;
      if (!e.animationName.includes("sheetOut")) return;
      finishClose();
    },
    [closing, finishClose],
  );

  const cancelHandler = (event: React.FormEvent | React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    requestClose(event);
  };

  const runSubmit = async () => {
    if (isConfirmDisabled || isSubmitting || closing) return;
    setError({ state: false, message: "" });

    if (!selectedName || selectedName.length < AC.NOTEBOOK_NAME_MIN) {
      setError({
        state: true,
        message: AC.NOTEBOOK_NAME_MIN_ERROR,
      });
      return;
    }
    if (selectedName.length > AC.NOTEBOOK_NAME_MAX) {
      setError({
        state: true,
        message: AC.NOTEBOOK_NAME_MAX_ERROR,
      });
      return;
    }
    const cover = selectedCover || "forest";
    setIsSubmitting(true);
    try {
      let ok = true;
      if (props.method === "edit" && props.notebook && props.editNotebook) {
        const notebookId = props.notebook._id;
        let updated = new Date().toISOString();
        if (props.notebook.updatedAt) {
          updated = props.notebook.updatedAt;
        }
        try {
          const result = await props.editNotebook(
            notebookId,
            selectedName,
            cover,
            updated,
          );
          ok = result === true;
        } catch (e) {
          dispatchErrorSnack(dispatch, e, false);
          ok = false;
        }
      } else if (props.method === "create" && props.addNotebook) {
        try {
          const result = await props.addNotebook(selectedName, cover);
          ok = result === true;
        } catch (e) {
          dispatchErrorSnack(dispatch, e, false);
          ok = false;
        }
      } else if (props.method === "create") {
        dispatchErrorSnack(
          dispatch,
          new Error(AC.NOTEBOOK_CREATE_ERROR),
          false,
        );
        ok = false;
      }
      if (ok) {
        setClosing(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitHandler = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    void runSubmit();
  };

  const overlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      requestClose(e);
    }
  };

  const sheetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      requestClose(e);
    }
  };

  return (
    <Fragment>
      <div
        className={classes.sheetOverlay}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
        onClick={cancelHandler}
        onKeyDown={overlayKeyDown}
      >
        <div
          className={`${classes.bottomSheet} ${closing ? classes.bottomSheetExiting : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-notebook-title"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={sheetKeyDown}
          onAnimationEnd={handleSheetAnimationEnd}
        >
          <div className={classes.sheetHandle} aria-hidden />

          <h2 id="add-notebook-title" className={classes.sheetTitle}>
            {props.method === "edit" ? "Edit Notebook" : "New Notebook"}
          </h2>

          <form onSubmit={submitHandler}>
            <div className={classes.sheetField}>
              <label className={classes.formLabel} htmlFor="new-notebook">
                Name
              </label>
              <input
                ref={nameInputRef}
                className={classes.formInput}
                type="text"
                id="new-notebook"
                placeholder="e.g. Personal, Work…"
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              />
            </div>

            <fieldset
              className={`${classes.sheetField} ${classes.sheetFieldset}`}
            >
              <legend className={classes.formLabel}>Cover colour</legend>
              <div className={classes.swatchRow}>
                {FolderOptions.map((folder) => (
                  <button
                    key={folder.value}
                    type="button"
                    className={`${classes.swatch} ${swatchClass[folder.value]} ${
                      selectedCover === folder.value
                        ? classes.swatchSelected
                        : ""
                    }`}
                    disabled={isSubmitting}
                    onClick={() => setSelectedCover(folder.value)}
                    aria-label={`${folder.viewValue} cover`}
                    aria-pressed={selectedCover === folder.value}
                  />
                ))}
              </div>
            </fieldset>
          </form>

          {error.state && (
            <div className={classes.sheetField}>
              <ErrorAlert>
                <div>{error.message}</div>
              </ErrorAlert>
            </div>
          )}

          <div className={classes.sheetActions}>
            <button
              type="button"
              className={classes.btnCancel}
              onClick={cancelHandler}
              aria-label="Cancel button"
            >
              Cancel
            </button>
            <button
              type="button"
              className={classes.btnCreate}
              disabled={isConfirmDisabled || isSubmitting}
              onClick={() => void runSubmit()}
              aria-label={
                props.method === "edit"
                  ? "Confirm edit button"
                  : "Create notebook button"
              }
            >
              {isSubmitting
                ? props.method === "edit"
                  ? "Saving…"
                  : "Creating…"
                : props.method === "edit"
                  ? "Confirm"
                  : "Create"}
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default AddNotebookForm;
