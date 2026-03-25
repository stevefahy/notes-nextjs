import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import classes from "./select-notebook-form.module.css";
import { getDisplayCover } from "../../lib/notebookCoverUtils";
import type { NotebookCoverType } from "../../lib/folder-options";
import { Notebook, SelectNotebookFormProps } from "../../types";

const optionCoverTint: Record<NotebookCoverType, string> = {
  forest: classes.optionCoverForest,
  emerald: classes.optionCoverEmerald,
  lime: classes.optionCoverLime,
  sage: classes.optionCoverSage,
};

const nbSpineTint: Record<NotebookCoverType, string> = {
  forest: classes.nbSpineForest,
  emerald: classes.nbSpineEmerald,
  lime: classes.nbSpineLime,
  sage: classes.nbSpineSage,
};

const SelectNotebookForm = (props: SelectNotebookFormProps) => {
  const { notebooks, currentNotebookId, moveNotes, onCancel } = props;
  const [selectedNotebook, setSelectedNotebook] = useState("");
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const notebooksFiltered = useMemo(() => {
    const copy = [...notebooks];
    copy.sort((a, b) => {
      const aDate =
        a.updatedAt === "No date" || !a.updatedAt
          ? "December 17, 1995"
          : a.updatedAt;
      const bDate =
        b.updatedAt === "No date" || !b.updatedAt
          ? "December 17, 1995"
          : b.updatedAt;
      return new Date(aDate) > new Date(bDate) ? -1 : 1;
    });
    return copy.filter((n) => n._id !== currentNotebookId);
  }, [notebooks, currentNotebookId]);

  const formIsValid = selectedNotebook !== "" && selectedNotebook !== "default";

  const finishClose = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const requestClose = useCallback((event?: React.SyntheticEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
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

  useEffect(() => {
    const node = sheetRef.current;
    if (!node) return;
    const first = node.querySelector<HTMLButtonElement>(
      `.${classes.notebookOption}`,
    );
    first?.focus();
  }, []);

  const cancelHandler = (event: React.FormEvent | React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    requestClose(event);
  };

  const submitHandler = (event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!formIsValid || closing) return;
    moveNotes(selectedNotebook);
  };

  const overlayKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      const t = e.target as HTMLElement;
      if (t.closest(`.${classes.bottomSheet}`)) {
        return;
      }
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

  const handleOptionsKeydown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const root = e.currentTarget;
    const optionEls = Array.from(
      root.querySelectorAll<HTMLButtonElement>(`.${classes.notebookOption}`),
    );
    const current = optionEls.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    if (e.key === "ArrowDown" && current < optionEls.length - 1) {
      e.preventDefault();
      optionEls[current + 1].focus();
    } else if (e.key === "ArrowUp" && current > 0) {
      e.preventDefault();
      optionEls[current - 1].focus();
    }
  };

  const renderOption = (nb: Notebook) => {
    const cover = getDisplayCover(nb.notebook_cover);
    const selected = selectedNotebook === nb._id;
    return (
      <button
        key={nb._id}
        type="button"
        className={`${classes.notebookOption} ${selected ? classes.notebookOptionSelected : ""}`}
        id={`option-${nb._id}`}
        role="option"
        aria-selected={selected}
        onClick={() => setSelectedNotebook(nb._id)}
      >
        <span className={`${classes.optionCover} ${optionCoverTint[cover]}`}>
          <span className={`${classes.nbSpine} ${nbSpineTint[cover]}`} />
        </span>
        <span className={classes.optionName}>{nb.notebook_name}</span>
      </button>
    );
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
          ref={sheetRef}
          className={`${classes.bottomSheet} ${closing ? classes.bottomSheetExiting : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="move-notebook-title"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={sheetKeyDown}
          onAnimationEnd={handleSheetAnimationEnd}
        >
          <div className={classes.sheetHandle} aria-hidden />

          <h2 id="move-notebook-title" className={classes.sheetTitle}>
            Move to Notebook
          </h2>

          <div className={classes.sheetField}>
            <span className={classes.formLabel} id="notebook-options-label">
              Notebook
            </span>
            <div
              className={classes.notebookOptions}
              role="listbox"
              tabIndex={-1}
              aria-labelledby="notebook-options-label"
              onKeyDown={handleOptionsKeydown}
            >
              {notebooksFiltered.map(renderOption)}
            </div>
          </div>

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
              className={classes.btnMove}
              disabled={!formIsValid}
              onClick={submitHandler}
              aria-label="Move Note button"
            >
              Move Note
            </button>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default SelectNotebookForm;
