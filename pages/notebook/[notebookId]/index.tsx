import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import {
  NotesDB,
  UserNotes,
  SelectedNote,
  Note,
  Notebook,
  UserNotebook,
  UserNotebooks,
} from "../../../types";
import APPLICATION_CONSTANTS from "../../../application_constants/applicationConstants";
import { dispatchErrorSnack } from "../../../lib/dispatchSnack";
import { runClientNavIfOnline } from "../../../lib/clientOfflineNav";
import { getNotes, getNotebook, getNotebooks } from "../../../lib/db-helpers";
import { showErrorMessage } from "../../../lib/errorMessageMap";
import {
  toLegacyCover,
  type NotebookCoverType,
} from "../../../lib/folder-options";
import { editActions } from "../../../store/edit-slice";
import { editNotesActions } from "../../../store/edit-notes-slice";
import { useAppDispatch } from "../../../store/hooks";
import { useAppSelector } from "../../../store/hooks";
import ErrorAlert from "../../../components/ui/error-alert";
import AddNotebookForm from "../../../components/notebooks/add-notebook-form";
import SelectNotebookForm from "../../../components/notebooks/select-notebook-form";
const LoadingScreen = dynamic(
  () => import("../../../components/ui/loading-screen"),
);
const NoteList = dynamic(
  () => import("../../../components/notebooks/note-list"),
);
const Footer = dynamic(() => import("../../../components/layout/footer"));

const AC = APPLICATION_CONSTANTS;

const NotebookPage: NextPage<NotesDB> = (props) => {
  const router = useRouter();
  const { notebookId } = router.query;

  const notes_found = props.notes?.result?.notes;
  const notebook_found = props.notebook?.result ?? undefined;
  const notebooks_found = props.notebooks?.result?.notebooks;

  const serverError =
    props.notes?.error || props.notebook?.error || props.notebooks?.error;
  const hasPropsError =
    Boolean(serverError) ||
    (props.notes?.message === "Error" &&
      props.notes?.result == null &&
      props.notebook?.result == null);

  const errorDisplay = serverError
    ? showErrorMessage(serverError, true)
    : AC.NOTEBOOK_ERROR;

  const dispatch = useAppDispatch();
  const serverErrorReported = useRef<string | null>(null);
  const notification_editing = useAppSelector((state) => state.edit.editing);

  const [isSelected, setIsSelected] = useState<SelectedNote | null>();
  const [moveNote, setMoveNote] = useState(false);
  const [notes, setNotes] = useState<Note[]>();
  const [notebook, setNotebook] = useState<Notebook>();
  const [notebooks, setNotebooks] = useState<Notebook[]>();
  const [editNotebook, setEditNotebook] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [noteListResetKey, setNoteListResetKey] = useState(0);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [notebookLoaded, setNotebookLoaded] = useState(false);

  useEffect(() => {
    if (notification_editing.status === true) {
      editNotebookBtnHandler();
    }
  }, [notification_editing]);

  useEffect(() => {
    if (!hasPropsError) {
      serverErrorReported.current = null;
      return;
    }
    const key = serverError ?? "notebook-load-error";
    if (serverErrorReported.current === key) return;
    serverErrorReported.current = key;
    dispatchErrorSnack(
      dispatch,
      serverError ?? AC.NOTEBOOK_ERROR,
      Boolean(serverError),
    );
  }, [dispatch, hasPropsError, serverError]);

  const sortNotes = useCallback((notes: Note[]) => {
    // Add an update date for sorting if one does not exist
    notes.map((x) => {
      if (x.updatedAt === "No date" || undefined) {
        x.updatedAt = "December 17, 1995 03:24:00";
      }
    });
    notes
      .sort((a, b) => {
        if (a.updatedAt !== undefined && b.updatedAt !== undefined) {
          return new Date(a.updatedAt) > new Date(b.updatedAt) ? 1 : -1;
        } else {
          return a.updatedAt !== undefined ? 1 : -1;
        }
      })
      .reverse();
    return notes;
  }, []);

  useEffect(() => {
    if (notes_found) {
      const notes_sorted = sortNotes(notes_found);
      setTimeout(function () {
        setNotes(notes_sorted);
        setNotesLoaded(true);
      }, 0);
    }
  }, [notes_found, sortNotes]);

  useEffect(() => {
    if (notebook_found) {
      setTimeout(function () {
        setNotebook(notebook_found);
        setNotebookLoaded(true);
      }, 0);
    }
  }, [notebook_found]);

  useEffect(() => {
    if (notebooks_found) {
      setNotebooks(notebooks_found);
    }
  }, [notebooks_found]);

  const addNoteFormHandler = () => {
    if (notebookId === undefined) return;
    runClientNavIfOnline(
      dispatch,
      () => void router.push(`/notebook/${notebookId}/create-note`),
    );
  };

  const editNoteFormHandler = () => {
    setEditNotes(true);
  };

  const resetNotesSelected = () => {
    setIsSelected((state) => {
      let newarray: SelectedNote = { selected: [] };
      return { ...state, selected: newarray.selected };
    });
  };

  const cancelEditNoteFormHandler = () => {
    setEditNotes(false);
    setNoteListResetKey((k) => k + 1);
    resetNotesSelected();
    dispatch(editNotesActions.resetEditNotes());
  };

  const deleteNoteHandler = async () => {
    let notesSelected: string[];
    if (isSelected !== null && isSelected !== undefined) {
      notesSelected = isSelected.selected;
      const del = { notes: notesSelected };
      let response;
      try {
        response = await fetch("/api/db/delete-notes", {
          method: "POST",
          body: JSON.stringify(del),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("An error occured deleting the notes!");
        }
        const data = await response.json();
        if (data.error) {
          dispatchErrorSnack(dispatch, data.error, true);
          return;
        }
        let updatedNotesLatestDate: string | undefined;
        const NotesLatestDate: string | undefined = notes![0].updatedAt;
        // update the notes array to delete the notes from state
        setNotes((prev) => {
          let oldarray: Note[];
          let newarray: Note[] = [];
          if (prev) {
            oldarray = [...prev];
            let i = oldarray.length;
            while (i--) {
              var obj = oldarray[i];
              if (notesSelected.indexOf(obj._id) !== -1) {
                // Item to be removed found
              } else {
                newarray.push(obj);
              }
            }
            const updated = newarray.reverse();
            if (updated.length > 0) {
              updatedNotesLatestDate = updated[0].updatedAt;
            }
            return updated;
          }
        });
        if (
          updatedNotesLatestDate !== undefined &&
          notebookId !== undefined &&
          NotesLatestDate
        ) {
          if (
            new Date(updatedNotesLatestDate).getTime() !==
            new Date(NotesLatestDate).getTime()
          ) {
            let nID = String(notebookId);
            updateNotebookDate(nID, updatedNotesLatestDate);
          }
        }
        cancelEditNoteFormHandler();
      } catch (error: unknown) {
        dispatchErrorSnack(dispatch, error, false);
        return;
      }
    }
  };

  const editNotebookDateHandler = async (
    notebookID: string,
    notebookUpdated: string,
  ) => {
    if (notebookID && notebookUpdated) {
      const edit = {
        notebookID,
        notebookUpdated,
      };
      let response;
      try {
        response = await fetch("/api/db/edit-date-notebook", {
          method: "POST",
          body: JSON.stringify(edit),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("An error occured updating the notebook!");
        }
        const data = await response.json();
        if (data.error) {
          dispatchErrorSnack(dispatch, data.error, true);
          return;
        }
      } catch (error: unknown) {
        dispatchErrorSnack(dispatch, error, false);
        return;
      }
    }
  };

  const editNotebookHandler = async (
    notebookID: string,
    notebookName: string,
    notebookCover: NotebookCoverType,
    notebookUpdated: string,
  ): Promise<boolean> => {
    if (!notebookID || !notebookName || !notebookCover || !notebookUpdated) {
      return false;
    }
    const edit = {
      notebookID,
      notebookName,
      notebookCover: toLegacyCover(notebookCover),
      notebookUpdated,
    };
    try {
      const response = await fetch("/api/db/edit-notebook", {
        method: "POST",
        body: JSON.stringify(edit),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("An error occured updating the notebook!");
      }
      const data = await response.json();
      if (data.error) {
        dispatchErrorSnack(dispatch, data.error, true);
        return false;
      }
      setNotebook((prev) => data.edited);
      dispatch(editActions.editStatus({ status: false }));
      dispatch(
        editActions.editChange({
          message: data.edited,
        }),
      );
      setEditNotebook((prev) => false);
      return true;
    } catch (error: unknown) {
      dispatchErrorSnack(dispatch, error, false);
      return false;
    }
  };

  const getLatestUpdated = (selected: string[]) => {
    let found_notes = [];
    for (const i in selected) {
      if (notes) {
        var result = notes.filter((obj) => {
          return obj._id === selected[i];
        });
        found_notes.push(result[0]);
      }
    }
    let selected_notes = sortNotes(found_notes);
    return selected_notes[0].updatedAt;
  };

  const updateNotebookDate = (
    notebookId: string,
    notebookLatesDate: string,
  ) => {
    editNotebookDateHandler(notebookId, notebookLatesDate);
  };

  const moveNoteHandler = async (notebook_id: string) => {
    let notesSelected: string[];
    if (isSelected !== null && isSelected !== undefined && notebook_id) {
      notesSelected = isSelected.selected;
      const latestUpdatedDate = getLatestUpdated(notesSelected);
      const move = {
        notes: notesSelected,
        notebookID: notebook_id,
        latestUpdatedNote: latestUpdatedDate,
      };
      let response;
      try {
        response = await fetch("/api/db/move-notes", {
          method: "POST",
          body: JSON.stringify(move),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("An error occured moving the notes!");
        }
        const data = await response.json();
        if (data.error) {
          dispatchErrorSnack(dispatch, data.error, true);
          return;
        }
        let updatedNotesLatestDate: string | undefined;
        // update the notes array to delete the notes from state
        setNotes((prev) => {
          let oldarray: Note[];
          let newarray: Note[] = [];
          if (prev) {
            oldarray = [...prev];
            let i = oldarray.length;
            while (i--) {
              var obj = oldarray[i];
              if (notesSelected.indexOf(obj._id) !== -1) {
                // Item to be removed found
              } else {
                newarray.push(obj);
              }
            }
            const updated = newarray.reverse();
            if (updated.length > 0) {
              updatedNotesLatestDate = updated[0].updatedAt;
            }
            return updated;
          }
        });

        if (updatedNotesLatestDate !== undefined && notebookId !== undefined) {
          let nID = String(notebookId);
          updateNotebookDate(nID, updatedNotesLatestDate);
        }
        // Close the dialogue
        setMoveNote((prev) => false);
        // Reset
        cancelEditNoteFormHandler();
      } catch (error: unknown) {
        dispatchErrorSnack(dispatch, error, false);
        return;
      }
    }
  };

  const deleteNotebookHandler = async () => {
    const notebook_id = notebook!._id;
    if (notebook_id.length > 0) {
      const deleteNotebook = {
        notebookID: notebook_id,
      };
      let response;
      try {
        response = await fetch("/api/db/delete-notebook", {
          method: "POST",
          body: JSON.stringify(deleteNotebook),
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("An error occured deleting the notebook!");
        }
        const data = await response.json();
        if (data.error) {
          dispatchErrorSnack(dispatch, data.error, true);
          return;
        }
        runClientNavIfOnline(dispatch, () => void router.push(`/notebooks`));
      } catch (error: unknown) {
        dispatchErrorSnack(dispatch, error, false);
        return;
      }
    }
  };

  const updateSelected = useCallback((selected: SelectedNote) => {
    setIsSelected(selected);
  }, []);

  const moveNoteFormHandler = () => {
    setMoveNote((prevState) => true);
  };

  const cancelHandler = () => {
    setMoveNote((prevState) => false);
  };
  const cancelEditHandler = () => {
    setEditNotebook((prevState) => false);
    dispatch(editActions.editStatus({ status: false }));
  };

  const editNotebookBtnHandler = () => {
    setEditNotebook((prevState) => true);
  };

  return (
    <Fragment>
      {!hasPropsError && (!notebookLoaded || !notesLoaded) && <LoadingScreen />}
      {hasPropsError && (
        <div className="page_scrollable_header_breadcrumb_footer_list">
          <ErrorAlert>{errorDisplay}</ErrorAlert>
        </div>
      )}
      {notebook && notes && (
        <div className="page_scrollable_header_breadcrumb_footer_list">
          {notes && notebook && (
            <NoteList
              key={noteListResetKey}
              notes={notes}
              onNotesSelected={updateSelected}
              onNotesEdit={editNotes}
            />
          )}
          {moveNote && notebooks && typeof notebookId === "string" && (
            <SelectNotebookForm
              notebooks={notebooks}
              currentNotebookId={notebookId}
              moveNotes={moveNoteHandler}
              onCancel={cancelHandler}
            />
          )}
          {editNotebook && (
            <AddNotebookForm
              method="edit"
              notebook={notebook}
              editNotebook={editNotebookHandler}
              onCancel={cancelEditHandler}
            />
          )}
        </div>
      )}
      <Footer>
        {notebookLoaded && notesLoaded ? (
          <div className="nb-footer-row">
            {!editNotes && notes && notes.length > 0 ? (
              <button
                type="button"
                className="btn-action-ghost"
                onClick={editNoteFormHandler}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="media_query_size"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Notes
              </button>
            ) : null}
            {!editNotes ? (
              <button
                type="button"
                className="btn-action-primary"
                onClick={addNoteFormHandler}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden
                  className="media_query_size"
                >
                  <path
                    d="M6 1v10M1 6h10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Add Note
              </button>
            ) : null}
            {notes && notes.length < 1 ? (
              <button
                type="button"
                className="btn-action-danger"
                onClick={deleteNotebookHandler}
              >
                <span className="icon_text">
                  <span className="material-symbols-outlined button_icon danger">
                    delete
                  </span>
                  Delete Notebook
                </span>
              </button>
            ) : null}
            {editNotes && isSelected && isSelected.selected.length > 0 ? (
              <button
                type="button"
                className="btn-action-danger"
                onClick={deleteNoteHandler}
              >
                <span className="icon_text">
                  <span className="material-symbols-outlined button_icon danger media_query_size">
                    delete
                  </span>
                  Delete
                </span>
              </button>
            ) : null}
            {editNotes &&
            isSelected &&
            isSelected.selected.length > 0 &&
            notebooks &&
            notebooks.length > 1 ? (
              <button
                type="button"
                className="btn-action-ghost"
                onClick={moveNoteFormHandler}
              >
                <span className="icon_text">
                  <span className="material-symbols-outlined button_icon green symbol_size media_query_size">
                    flip_to_front
                  </span>
                  Move to…
                </span>
              </button>
            ) : null}
            {editNotes ? (
              <button
                type="button"
                className="btn-action-ghost"
                onClick={cancelEditNoteFormHandler}
              >
                <span className="icon_text">
                  <span className="material-symbols-outlined button_icon green media_query_size">
                    cancel
                  </span>
                  Cancel
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </Footer>
    </Fragment>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession({ req: context.req });
  if (!session || !session.user || !session.user._id) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  const userID = session.user._id;

  // Notebook Notes

  let notebookId = context.params?.notebookId?.toString();
  if (!notebookId) {
    const errorFound: UserNotes = {
      error: APPLICATION_CONSTANTS.NOTEBOOK_ERROR,
      message: "Error",
      result: null,
    };
    return {
      props: {
        notes: errorFound,
        notebook: { ...errorFound } as UserNotebook,
        notebooks: { ...errorFound } as UserNotebooks,
      },
    };
  }

  let notesRequest: UserNotes;
  let notebookRequest: UserNotebook;
  let notebooksRequest: UserNotebooks;

  try {
    [notesRequest, notebookRequest, notebooksRequest] = await Promise.all([
      getNotes(userID, notebookId),
      getNotebook(userID, notebookId),
      getNotebooks(userID),
    ]);
  } catch (error: any) {
    const errorFound = {
      error: error.message,
      message: "Error",
      result: null,
    };
    return {
      props: {
        notes: { ...errorFound } as UserNotes,
        notebook: { ...errorFound } as UserNotebook,
        notebooks: { ...errorFound } as UserNotebooks,
      },
    };
  }

  return {
    props: {
      notes: notesRequest,
      notebook: notebookRequest,
      notebooks: notebooksRequest,
    },
  };
};

export default NotebookPage;
