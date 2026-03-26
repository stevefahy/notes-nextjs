import dynamic from "next/dynamic";
import { GetServerSideProps, NextPage } from "next";
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useCallback,
  useState,
  useRef,
  memo,
} from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { snackActions } from "../../../../store/snack-slice";
import { useAppDispatch } from "../../../../store/hooks";
import { dispatchErrorSnack } from "../../../../lib/dispatchSnack";
import { UserNote, NoteEdit, UserNoteDB } from "../../../../types";
import { getNote } from "../../../../lib/db-helpers";
import classes from "./index.module.css";
import {
  alignNotePanesScroll,
  captureSplitEnterScrollSnap,
  initScrollSync,
  stabilizeSplitEnterScroll,
} from "../../../../lib/scroll_sync";
import {
  commitNoteShellTransition,
  NOTE_SHELL_TRANSITION_CLEANUP_MS,
} from "../../../../lib/noteShellDom";
import type { NoteShellLayout } from "../../../../lib/noteShellDom";
import useWindowDimensions from "../../../../lib/useWindowDimension";
import APPLICATION_CONSTANTS from "../../../../application_constants/applicationConstants";
import WELCOME_NOTE from "../../../../public/assets/markdown/welcome_markdown.md";

const EditNote = dynamic(() => import("../../../../components/note/editnote"));
const ViewNote = dynamic(() => import("../../../../components/note/viewnote"));
const Footer = dynamic(() => import("../../../../components/layout/footer"));

const EditNotePage: NextPage<NoteEdit> = (props) => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { notebookId, noteId } = router.query;

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
    if (!props.error) return;
    dispatchErrorSnack(dispatch, props.error, true);
  }, [dispatch, props.error]);

  const showErrorCallback = useCallback(
    (raw: unknown, fromServer: boolean) => {
      dispatchErrorSnack(dispatch, raw, fromServer);
    },
    [dispatch],
  );

  const note_loaded = props.error
    ? ""
    : props.data &&
        typeof props.data === "object" &&
        props.data !== null &&
        "note" in props.data
      ? ((props.data as NoteEdit["data"]).note ?? "")
      : "";

  if (noteId === "create-note") {
    new_note = true;
  }

  const [viewText, setViewText] = useState("");
  const [loadedText, setLoadedText] = useState("");
  const [isChanged, setIsChanged] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [isView, setIsView] = useState(noteId !== "create-note");
  const [isSplitScreen, setIsplitScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCreate, setIsCreate] = useState(new_note);
  const [originalText, setOriginalText] = useState("");
  const [updateEditTextProp, setUpdateEditTextProp] = useState("");

  const prevIsSplitRef = useRef(isSplitScreen);
  const splitEnterFromRef = useRef<"edit" | "view" | null>(null);
  const viewContainerRef = useRef<HTMLDivElement | null>(null);
  const prevNoteShellLayoutRef = useRef<NoteShellLayout | null>(null);
  const splitPostAlignTimeoutRef = useRef<number | null>(null);
  const splitEnterSnapRef = useRef<ReturnType<
    typeof captureSplitEnterScrollSnap
  > | null>(null);
  const splitStabilizeCleanupRef = useRef<(() => void) | null>(null);

  const noteShellLayout = isSplitScreen
    ? "split"
    : isView
      ? "view"
      : "edit";

  useLayoutEffect(() => {
    if (!prevIsSplitRef.current && isSplitScreen) {
      splitEnterFromRef.current = isView ? "view" : "edit";
    }
    prevIsSplitRef.current = isSplitScreen;
  }, [isSplitScreen, isView]);

  useLayoutEffect(() => {
    const el = viewContainerRef.current;
    const prev = prevNoteShellLayoutRef.current;
    if (prev !== null && prev !== noteShellLayout) {
      commitNoteShellTransition(el, prev, noteShellLayout);
    }
    prevNoteShellLayoutRef.current = noteShellLayout;
  }, [noteShellLayout]);

  useLayoutEffect(() => {
    if (splitPostAlignTimeoutRef.current !== null) {
      window.clearTimeout(splitPostAlignTimeoutRef.current);
      splitPostAlignTimeoutRef.current = null;
    }
    splitStabilizeCleanupRef.current?.();
    splitStabilizeCleanupRef.current = null;

    let raf1 = 0;
    let raf2 = 0;
    const splitFrom = splitEnterFromRef.current;
    const snapCaptured = splitEnterSnapRef.current;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!isSplitScreen) {
          alignNotePanesScroll(noteShellLayout, null);
          splitEnterFromRef.current = null;
          initScrollSync();
          return;
        }

        const enteringSplit = splitFrom !== null;
        if (enteringSplit) {
          splitEnterFromRef.current = null;
        }

        if (enteringSplit && snapCaptured) {
          splitEnterSnapRef.current = null;
          const splitStabilizeMs = NOTE_SHELL_TRANSITION_CLEANUP_MS + 120;
          splitStabilizeCleanupRef.current = stabilizeSplitEnterScroll(
            snapCaptured,
            splitStabilizeMs,
            () => {
              splitStabilizeCleanupRef.current = null;
              initScrollSync();
            },
          );
          return;
        }

        if (enteringSplit) {
          splitPostAlignTimeoutRef.current = window.setTimeout(() => {
            splitPostAlignTimeoutRef.current = null;
            alignNotePanesScroll("split", splitFrom);
            initScrollSync();
          }, NOTE_SHELL_TRANSITION_CLEANUP_MS);
          return;
        }

        alignNotePanesScroll("split", null);
        initScrollSync();
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      if (splitPostAlignTimeoutRef.current !== null) {
        window.clearTimeout(splitPostAlignTimeoutRef.current);
        splitPostAlignTimeoutRef.current = null;
      }
      splitStabilizeCleanupRef.current?.();
      splitStabilizeCleanupRef.current = null;
    };
  }, [noteShellLayout, isSplitScreen]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      initScrollSync();
    }, 500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const creating = noteId === "create-note";
    setIsCreate(creating);
    setIsView(!creating);
  }, [noteId]);

  const onRouteChangeStart = useCallback(
    (url: string) => {
      if (isChanged && !isCreate) {
        setAutoSave((prev) => true);
      }
    },
    [isChanged, isCreate],
  );

  const toggleEditHandlerCallback = useCallback(() => {
    setIsView(!isView);
  }, [isView]);

  const toggleSplitHandlerCallback = useCallback(() => {
    if (!isSplitScreen) {
      splitEnterSnapRef.current = captureSplitEnterScrollSnap(isView);
    } else {
      splitEnterSnapRef.current = null;
    }
    setIsplitScreen(!isSplitScreen);
  }, [isSplitScreen, isView]);

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
        showErrorCallback(data.error, true);
        return;
      }
      if (!response.ok) {
        throw new Error("An error occured saving the note!");
      }
      setIsChanged((prev) => false);
      setAutoSave((prev) => false);
      setOriginalText(viewText);
      dispatch(
        snackActions.showSnack({
          message: "Note Saved",
          variant: "success",
        }),
      );
      return data;
    } catch (error: unknown) {
      showErrorCallback(error, false);
      return;
    }
  }, [dispatch, noteId, notebookId, showErrorCallback, viewText]);

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

  const exampleNote = () => {
    if (!isMobile) {
      splitEnterSnapRef.current = captureSplitEnterScrollSnap(isView);
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
        showErrorCallback(data.error, true);
        return;
      }
      setIsCreate(false);
      setIsChanged(false);
      setAutoSave(false);
      router.back();
      return data;
    } catch (error: unknown) {
      showErrorCallback(error, false);
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

  const updatedViewTextHandler = (
    updated: string | ((prev: string) => string),
  ) => {
    setViewText((prev) => {
      const next = typeof updated === "function" ? updated(prev) : updated;
      updateIsChanged(next);
      setUpdateEditTextProp(next);
      return next;
    });
  };

  return (
    <Fragment>
      <div className="page_scrollable_header_breadcrumb_footer">
        <div
          ref={viewContainerRef}
          className={`${classes.view_container}${
            isSplitScreen ? " editnote_box_split" : ""
          }`}
          id="view_container"
          data-note-layout={noteShellLayout}
        >
          <EditNote
            visible={!isView || isSplitScreen}
            splitScreen={isSplitScreen}
            loadedText={loadedText}
            updateViewText={updatedViewTextHandler}
            passUpdatedViewText={updateEditTextProp}
          />
          <ViewNote
            visible={isView || isSplitScreen}
            splitScreen={isSplitScreen}
            viewText={viewText}
            updatedViewText={updatedViewTextHandler}
          />
        </div>
      </div>
      <Footer>
        <div className="nb-footer-row">
          {viewText.length > 0 && !isCreate && isChanged ? (
            <button
              type="button"
              className="btn-action-primary"
              onClick={saveNoteCallback}
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
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Note
            </button>
          ) : null}
          {viewText.length > 0 && isCreate ? (
            <button
              type="button"
              className="btn-action-primary"
              onClick={() => void createNote()}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden
              >
                <path
                  d="M6 1v10M1 6h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Create Note
            </button>
          ) : null}
          {viewText.length === 0 && isCreate ? (
            <button
              type="button"
              className="btn-action-ghost example_button"
              onClick={exampleNote}
            >
              <span className="material-symbols-outlined" aria-hidden>
                egg
              </span>
              Example
            </button>
          ) : null}
          {!isSplitScreen ? (
            <button
              type="button"
              className="btn-action-ghost"
              onClick={toggleEditHandlerCallback}
              aria-label={isView ? "Switch to Edit" : "Switch to View"}
            >
              {isView ? (
                <>
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
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </>
              ) : (
                <>
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
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  View
                </>
              )}
            </button>
          ) : null}
          {!isMobile ? (
            <button
              type="button"
              className="btn-action-ghost"
              onClick={toggleSplitHandlerCallback}
              aria-label="Toggle split screen"
            >
              {isSplitScreen ? (
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
                >
                  <rect x="6" y="2" width="12" height="20" rx="2" />
                </svg>
              ) : (
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
                >
                  <rect x="2" y="2" width="8" height="20" rx="2" />
                  <rect x="14" y="2" width="8" height="20" rx="2" />
                </svg>
              )}
              Split Screen
            </button>
          ) : null}
        </div>
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
