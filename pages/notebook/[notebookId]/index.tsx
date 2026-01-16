import { Fragment, useCallback, useEffect, useState } from "react";
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
import { getNotes, getNotebook, getNotebooks } from "../../../lib/db-helpers";
import { uiActions } from "../../../store/ui-slice";
import { editActions } from "../../../store/edit-slice";
import { useAppDispatch } from "../../../store/hooks";
import { useAppSelector } from "../../../store/hooks";
import Fab from "@mui/material/Fab";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import FlipToFrontIcon from "@mui/icons-material/FlipToFront";
import NoteAddIcon from "@mui/icons-material/NoteAdd";

const LoadingScreen = dynamic(
  () => import("../../../components/ui/loading-screen")
);
const NoteList = dynamic(
  () => import("../../../components/notebooks/note-list")
);
const AddNotebookForm = dynamic(
  () => import("../../../components/notebooks/add-notebook-form")
);
const SelectNotebookForm = dynamic(
  () => import("../../../components/notebooks/select-notebook-form")
);
const Footer = dynamic(() => import("../../../components/layout/footer"));

const NotebookPage: NextPage<NotesDB> = (props) => {
  const router = useRouter();
  const { notebookId } = router.query;

  const notes_found = props.notes.result?.notes;
  const notebook_found = props.notebook.result;
  const notebooks_found = props.notebooks?.result?.notebooks;

  const dispatch = useAppDispatch();
  const notification_editing = useAppSelector((state) => state.edit.editing);

  const [isSelected, setIsSelected] = useState<SelectedNote | null>();
  const [moveNote, setMoveNote] = useState(false);
  const [notes, setNotes] = useState<Note[]>();
  const [notebook, setNotebook] = useState<Notebook>();
  const [notebooks, setNotebooks] = useState<Notebook[]>();
  const [editNotebook, setEditNotebook] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  const [clearEditNotes, setClearEditNotes] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [notebookLoaded, setNotebookLoaded] = useState(false);

  useEffect(() => {
    if (notification_editing.status === true) {
      editNotebookBtnHandler();
    }
  }, [notification_editing]);

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
    router.push(`/notebook/${notebookId}/create-note`);
  };

  const editNoteFormHandler = () => {
    setEditNotes(true);
    setClearEditNotes(false);
  };

  const resetNotesSelected = () => {
    setIsSelected((state) => {
      let newarray: SelectedNote = { selected: [] };
      return { ...state, selected: newarray.selected };
    });
  };

  const cancelEditNoteFormHandler = () => {
    setEditNotes(false);
    setClearEditNotes(true);
    resetNotesSelected();
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
          dispatch(
            uiActions.showNotification({
              status: "error",
              title: "Error!",
              message: data.error,
            })
          );
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
      } catch (error: any) {
        dispatch(
          uiActions.showNotification({
            status: "error",
            title: "Error!",
            message: error.message,
          })
        );
        return;
      }
    }
  };

  const editNotebookDateHandler = async (
    notebookID: string,
    notebookUpdated: string
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
          dispatch(
            uiActions.showNotification({
              status: "error",
              title: "Error!",
              message: data.error,
            })
          );
          return;
        }
      } catch (error: any) {
        dispatch(
          uiActions.showNotification({
            status: "error",
            title: "Error!",
            message: error.message,
          })
        );
        return;
      }
    }
  };

  const editNotebookHandler = async (
    notebookID: string,
    notebookName: string,
    notebookCover: string,
    notebookUpdated: string
  ) => {
    if (notebookID && notebookName && notebookCover && notebookUpdated) {
      const edit = {
        notebookID,
        notebookName,
        notebookCover,
        notebookUpdated,
      };
      let response;
      try {
        response = await fetch("/api/db/edit-notebook", {
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
          dispatch(
            uiActions.showNotification({
              status: "error",
              title: "Error!",
              message: data.error,
            })
          );
          return;
        }
        setNotebook((prev) => data.edited);
        dispatch(editActions.editStatus({ status: false }));
        dispatch(
          editActions.editChange({
            message: data.edited,
          })
        );
        setEditNotebook((prev) => false);
      } catch (error: any) {
        dispatch(
          uiActions.showNotification({
            status: "error",
            title: "Error!",
            message: error.message,
          })
        );
        return;
      }
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
    notebookLatesDate: string
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
          dispatch(
            uiActions.showNotification({
              status: "error",
              title: "Error!",
              message: data.error,
            })
          );
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
      } catch (error: any) {
        dispatch(
          uiActions.showNotification({
            status: "error",
            title: "Error!",
            message: error.message,
          })
        );
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
          dispatch(
            uiActions.showNotification({
              status: "error",
              title: "Error!",
              message: data.error,
            })
          );
          return;
        }
        router.push(`/notebooks`);
      } catch (error: any) {
        dispatch(
          uiActions.showNotification({
            status: "error",
            title: "Error!",
            message: error.message,
          })
        );
        return;
      }
    }
  };

  const updateSelected = (selected: SelectedNote) => {
    setIsSelected((prev) => selected);
  };

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
      {(!notebookLoaded || !notesLoaded) && <LoadingScreen />}
      {notebook && notes && (
        <div className="page_scrollable_header_breadcrumb_footer_list">
          {notes && notebook && (
            <NoteList
              notes={notes}
              onNotesSelected={updateSelected}
              onNotesEdit={editNotes}
              onClearNotesEdit={clearEditNotes}
            />
          )}
          {moveNote && notebooks && (
            <SelectNotebookForm
              notebooks={notebooks}
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
        {!editNotes && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={addNoteFormHandler}
          >
            <NoteAddIcon sx={{ mr: 1 }} />
            Add Note
          </Fab>
        )}

        {!editNotes && notes && notes.length > 0 && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={editNoteFormHandler}
          >
            <EditIcon sx={{ mr: 1 }} />
            Edit Notes
          </Fab>
        )}

        {notes && notes.length < 1 && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={deleteNotebookHandler}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Delete Notebook
          </Fab>
        )}

        {editNotes && isSelected && isSelected.selected.length > 0 && (
          <Fragment>
            <Fab
              variant="extended"
              color="secondary"
              size="medium"
              onClick={deleteNoteHandler}
            >
              <DeleteIcon sx={{ mr: 1 }} />
              Delete
            </Fab>
            {notebooks && notebooks.length > 1 && (
              <Fab
                variant="extended"
                color="secondary"
                size="medium"
                onClick={moveNoteFormHandler}
              >
                <FlipToFrontIcon sx={{ mr: 1 }} />
                Move
              </Fab>
            )}
          </Fragment>
        )}

        {editNotes && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={cancelEditNoteFormHandler}
          >
            <CancelIcon sx={{ mr: 1 }} />
            Cancel
          </Fab>
        )}
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
      error: "",
      message: "Error",
      result: null,
    };
    return {
      props: { notes: errorFound },
    };
  }

  let notesRequest: UserNotes;
  try {
    notesRequest = await getNotes(userID, notebookId);
  } catch (error: any) {
    const errorFound: UserNotes = {
      error: error.message,
      message: "Error",
      result: null,
    };
    return {
      props: { notes: errorFound },
    };
  }

  // Notebook

  let notebookRequest: UserNotebook;
  try {
    notebookRequest = await getNotebook(userID, notebookId);
  } catch (error: any) {
    const errorFound: UserNotebook = {
      error: error.message,
      message: "Error",
      result: null,
    };
    return {
      props: { notebook: errorFound },
    };
  }

  // Notebooks

  let notebooksRequest: UserNotebooks;
  try {
    notebooksRequest = await getNotebooks(userID);
  } catch (error: any) {
    const errorFound: UserNotebooks = {
      error: error.message,
      message: "Error",
      result: null,
    };
    return {
      props: { notebooks: errorFound },
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
