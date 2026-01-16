import dynamic from "next/dynamic";
import { GetServerSideProps, NextPage } from "next";
import { Fragment, useEffect, useCallback, useState, memo } from "react";
import Image from "next/image";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { uiActions } from "../../../../store/ui-slice";
import { snackActions } from "../../../../store/snack-slice";
import { useAppDispatch } from "../../../../store/hooks";
import { UserNote, NoteEdit, UserNoteDB } from "../../../../types";
import { getNote } from "../../../../lib/db-helpers";
import classes from "./index.module.css";
import { initScrollSync } from "../../../../lib/scroll_sync";
import useWindowDimensions from "../../../../lib/useWindowDimension";
import APPLICATION_CONSTANTS from "../../../../application_constants/applicationConstants";
import WELCOME_NOTE from "../../../../application_constants/welcome_markdown.md";
import Fab from "@mui/material/Fab";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EggIcon from "@mui/icons-material/Egg";

const EditNote = dynamic(() => import("../../../../components/note/editnote"));
const ViewNote = dynamic(() => import("../../../../components/note/viewnote"));
const Footer = dynamic(() => import("../../../../components/layout/footer"));

const EditNotePage: NextPage<NoteEdit> = (props) => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { notebookId, noteId } = router.query;

  let note_loaded: string;
  let new_note = false;

  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (width < APPLICATION_CONSTANTS.SPLITSCREEN_MINIMUM_WIDTH) {
      setIsplitScreen(false);
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  }, [width, height]);

  useEffect(() => {
    // Wait for the Markdown to load before initializing scroll sync
    setTimeout(() => {
      initScrollSync();
    }, 500);
  }, []);

  const showErrorCallback = useCallback(
    (error: string) => {
      dispatch(
        uiActions.showNotification({
          status: "error",
          title: "Error!",
          message: error,
        })
      );
    },
    [dispatch]
  );

  if (props.error) {
    showErrorCallback(props.error);
    note_loaded = "";
  } else {
    note_loaded = props.data.note;
  }

  if (noteId === "create-note") {
    new_note = true;
  }

  const [viewText, setViewText] = useState("");
  const [loadedText, setLoadedText] = useState("");
  const [isChanged, setIsChanged] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [isView, setIsView] = useState(new_note);
  const [isSplitScreen, setIsplitScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCreate, setIsCreate] = useState(new_note);
  const [originalText, setOriginalText] = useState("");
  const [updateEditTextProp, setUpdateEditTextProp] = useState("");

  const onRouteChangeStart = useCallback(
    (url: string) => {
      if (isChanged && !isCreate) {
        setAutoSave((prev) => true);
      }
    },
    [isChanged, isCreate]
  );

  const toggleEditHandlerCallback = useCallback(() => {
    setIsView(!isView);
  }, [isView]);

  const toggleSplitHandlerCallback = useCallback(() => {
    setIsplitScreen(!isSplitScreen);
  }, [isSplitScreen]);

  const saveNoteCallback = useCallback(async () => {
    const note = {
      notebookID: notebookId,
      noteID: noteId,
      note: viewText,
    };

    let response;
    try {
      response = await fetch("/api/db/save-note", {
        method: "POST",
        body: JSON.stringify(note),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.error) {
        showErrorCallback(data.error);
        return;
      }
      if (!response.ok) {
        throw new Error("An error occured saving the note!");
      }
      setIsChanged((prev) => false);
      setAutoSave((prev) => false);
      setOriginalText(viewText);
      // Change to View Mode
      if (isView) {
        toggleEditHandlerCallback();
      }
      return data;
    } catch (error: any) {
      showErrorCallback(error.message);
      return;
    }
  }, [
    isView,
    noteId,
    notebookId,
    showErrorCallback,
    toggleEditHandlerCallback,
    viewText,
  ]);

  useEffect(() => {
    if (autoSave && isChanged && (isView || isChanged) && !isCreate) {
      const noteSaved = async () => {
        const saved_note = await saveNoteCallback();
        setAutoSave((prev) => false);
        setIsChanged(false);
      };
      noteSaved();
      return () => {
        // component unmounts
      };
    }
  }, [autoSave, isChanged, isView, isCreate, router, saveNoteCallback]);

  useEffect(() => {
    router.events.on("routeChangeStart", onRouteChangeStart);
    return () => {
      router.events.off("routeChangeStart", onRouteChangeStart);
    };
  }, [onRouteChangeStart, router.events]);

  useEffect(() => {
    if (note_loaded) {
      setViewText(note_loaded);
      setLoadedText(note_loaded);
      setOriginalText(note_loaded);
    }
  }, [note_loaded]);

  useEffect(() => {
    if (autoSave) {
      dispatch(
        snackActions.showSnack({
          status: true,
          message: "Note Saved",
        })
      );
    }
  }, [autoSave, dispatch]);

  const exampleNote = () => {
    if (!isMobile) {
      setIsplitScreen(true);
    }
    updatedViewTextHandler(WELCOME_NOTE);
  };

  const createNote = async () => {
    const note = { notebookID: notebookId, note: viewText };
    let response;
    setAutoSave(false);
    try {
      response = await fetch("/api/db/create-note", {
        method: "POST",
        body: JSON.stringify(note),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("An error occured creating the note!");
      }
      const data = await response.json();
      if (data.error) {
        showErrorCallback(data.error);
        return;
      }
      setIsCreate(false);
      setIsChanged(false);
      setAutoSave(false);
      router.back();
      return data;
    } catch (error: any) {
      showErrorCallback(error.message);
      return;
    }
  };

  const updateIsChanged = (content: string) => {
    if (content !== originalText) {
      setIsChanged((prev) => true);
    } else {
      setIsChanged((prev) => false);
    }
  };

  const updatedViewTextHandler = (updatedViewText: string) => {
    updateIsChanged(updatedViewText);
    setViewText((prev) => updatedViewText);
    setUpdateEditTextProp(updatedViewText);
  };

  return (
    <Fragment>
      <div className="page_scrollable_header_breadcrumb_footer">
        <div className={classes.view_container} id="view_container">
          <ViewNote
            visible={!isView}
            splitScreen={isSplitScreen}
            viewText={viewText}
            updatedViewText={updatedViewTextHandler}
          />
          <EditNote
            visible={isView}
            splitScreen={isSplitScreen}
            loadedText={loadedText}
            updateViewText={updatedViewTextHandler}
            passUpdatedViewText={updateEditTextProp}
          />
        </div>
      </div>
      <Footer>
        {viewText.length > 0 && !isCreate && isChanged && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={saveNoteCallback}
          >
            <AddCircleIcon sx={{ mr: 1 }} />
            Save Note
          </Fab>
        )}

        {viewText.length > 0 && isCreate && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={createNote}
          >
            <AddCircleIcon sx={{ mr: 1 }} />
            Create Note
          </Fab>
        )}

        {viewText.length === 0 && isCreate && (
          <Fab
            variant="extended"
            color="primary"
            size="medium"
            onClick={exampleNote}
            className="example_button"
          >
            <EggIcon sx={{ mr: 0 }} />
            Example
          </Fab>
        )}

        {!isSplitScreen && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={toggleEditHandlerCallback}
          >
            {isView ? (
              <VisibilityIcon sx={{ mr: 1 }} />
            ) : (
              <EditIcon sx={{ mr: 1 }} />
            )}
            {isView ? "View" : "Edit"}
          </Fab>
        )}

        {!isMobile && (
          <Fab
            variant="extended"
            color="primary"
            size="medium"
            onClick={toggleSplitHandlerCallback}
            className="split_screen_button"
          >
            {isSplitScreen ? (
              <span className="split_screen_icon">
                <Image
                  src="/images/split_screen_icon_single.png"
                  alt="split screen icon"
                  width="30"
                  height="30"
                />
              </span>
            ) : (
              <span className="split_screen_icon">
                <Image
                  src="/images/split_screen_icon_double.png"
                  alt="split screen icon"
                  width="30"
                  height="30"
                />
              </span>
            )}
          </Fab>
        )}
      </Footer>
    </Fragment>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Session
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

  // Notebook Note

  const { notebookId, noteId } = context.query;

  if (!notebookId || !noteId) {
    const errorFound: UserNote = {
      error: "",
      data: null,
    };
    return {
      props: { error: errorFound },
    };
  }

  if (noteId === "create-note") {
    return {
      props: { data: "" },
    };
  }

  let noteRequest: UserNoteDB;

  try {
    noteRequest = await getNote(userID, noteId.toString());
  } catch (error: any) {
    const errorFound: UserNote = {
      error: error.message,
      data: null,
    };
    return {
      props: errorFound,
    };
  }
  return { props: noteRequest };
};

export default memo(EditNotePage);
