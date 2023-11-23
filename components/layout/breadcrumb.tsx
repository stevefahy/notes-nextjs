import { Fragment, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import EditIcon from "@mui/icons-material/Edit";
import Fab from "@mui/material/Fab";
import Typography from "@mui/material/Typography";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";
import NoteOutlinedIcon from "@mui/icons-material/NoteOutlined";
import Avatar from "@mui/material/Avatar";
import { PageType, NotebookType, ErrorMessage } from "../../types";
import { getNotebookFetch } from "../../lib/fetch-helpers";
import { useAppDispatch } from "../../store/hooks";
import { uiActions } from "../../store/ui-slice";
import { editActions } from "../../store/edit-slice";
import { useAppSelector } from "../../store/hooks";
import classes from "./breadcrumb.module.css";

const Breadcrumb = () => {
  const dispatch = useAppDispatch();
  const notification_edited = useAppSelector((state) => state.edit.edited);

  const router = useRouter();
  const notebookId = router.query.notebookId?.toString();

  const [pageLayout, setPageLayout] = useState<PageType>("other");
  const [notebook, setNotebook] = useState<NotebookType>();
  const [notebookLoaded, setNotebookLoaded] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage>();

  const resetNotebook = () => {
    setNotebook({
      id: "",
      name: "",
      cover: "",
    });
  };

  useEffect(() => {
    if (errorMessage?.error !== false && errorMessage?.message !== undefined) {
      const showError = (error: string) => {
        dispatch(
          uiActions.showNotification({
            status: "error",
            title: "Error!",
            message: error,
          })
        );
      };
      showError(errorMessage.message);
    } else {
      // Reset error message
      dispatch(
        uiActions.showNotification({
          status: null,
          title: null,
          message: null,
        })
      );
    }
  }, [errorMessage, dispatch]);

  useEffect(() => {
    if (
      notification_edited.message.notebook_name !== null &&
      notification_edited.message._id !== null
    ) {
      if (notification_edited) {
        setNotebook({
          id: notification_edited.message._id,
          name: notification_edited.message.notebook_name,
          cover: notification_edited.message.notebook_cover,
        });
        setNotebookLoaded(true);
      }
    }
  }, [notification_edited]);

  useEffect(() => {
    if (router.pathname) {
      if (router.pathname === "/notebooks") {
        setPageLayout((state) => {
          return "notebooks";
        });
      } else if (router.pathname === "/notebook/[notebookId]") {
        setPageLayout((state) => {
          return "notebook";
        });
      } else if (router.pathname === "/notebook/[notebookId]/[noteId]") {
        setPageLayout((state) => {
          return "note";
        });
      } else if (router.pathname === "/profile") {
        setPageLayout((state) => {
          return "profile";
        });
      } else {
        setPageLayout((state) => {
          return "other";
        });
      }
    }

    if (router.pathname === "/notebooks") {
      resetNotebook();
    }
    if (
      router.pathname === "/notebook/[notebookId]" ||
      router.pathname === "/notebook/[notebookId]/[noteId]"
    ) {
      if (notebookId != undefined) {
        setErrorMessage({ error: false, message: "" });
        try {
          getNotebookFetch(notebookId)
            .then((value) => {
              if (value?.Notebooks?.result) {
                setNotebook({
                  name: value.Notebooks.result.notebook_name,
                  id: value.Notebooks.result._id,
                  cover: value.Notebooks.result.notebook_cover,
                });
                setNotebookLoaded(true);
              }
            })
            .catch(function (error: any) {
              setErrorMessage({ error: true, message: error.message });
            });
        } catch (error: any) {
          setErrorMessage({ error: true, message: error.message });
          return;
        }
      }
    }
  }, [router.pathname, notebookId, pageLayout]);

  const editNotebook = () => {
    dispatch(
      editActions.editStatus({
        status: true,
      })
    );
  };

  const notebooks_title = (
    <span className={classes.breadcrumb_link}>
      <LibraryBooksOutlinedIcon sx={{ mr: 0.5 }} />
      Notebooks
    </span>
  );

  const notebooks_link = (
    <Link href="/notebooks">
      <span className={classes.breadcrumb_link_btn}>{notebooks_title}</span>
    </Link>
  );

  return (
    <Fragment>
      {pageLayout !== "other" && (
        <div>
          <div role="presentation" className={classes.breadcrumb_container}>
            <div aria-label="breadcrumb" className={classes.breadcrumbs_inner}>
              {/* PROFILE */}
              {notebookLoaded &&
                pageLayout === "profile" &&
                notebooks_link &&
                notebooks_link}
              {notebookLoaded && pageLayout === "profile" && notebooks_link && (
                <span className={classes.breadcrumb_link}>
                  <span className={classes.breadcrumb_seperator}>/</span>
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      mr: 0.5,
                      fill: "currentcolor",
                      bgcolor: "#676767",
                    }}
                  />
                  Profile
                </span>
              )}

              {/* NOTEBOOKS */}
              {notebookLoaded && pageLayout === "notebook" && notebooks_link}

              {/* NOTEBOOKS / NOTEBOOK */}
              {notebookLoaded && pageLayout === "notebooks" && notebooks_title}
              {notebookLoaded &&
                pageLayout === "notebook" &&
                notebook &&
                notebook.name && (
                  <span className={classes.breadcrumb_link}>
                    <span className={classes.breadcrumb_link_icon}>
                      <span className={classes.breadcrumb_seperator}>/</span>
                      <StickyNote2OutlinedIcon
                        sx={{ mr: 0.5, fontSize: "1.7rem" }}
                        className={`notebook_cover_${notebook?.cover}`}
                      />
                    </span>
                    {notebook.name && (
                      <span className={classes.breadcrumb_link}>
                        {notebook.name}
                      </span>
                    )}
                  </span>
                )}

              {/* NOTEEBOOKS / NOTEBOOK / NOTE */}
              {notebookLoaded && pageLayout === "note" && notebooks_link}
              {notebookLoaded && notebook?.name && pageLayout === "note" && (
                <Link href={`/notebook/${notebook?.id}`}>
                  <span className={classes.breadcrumb_link}>
                    <span className={classes.breadcrumb_link_icon}>
                      <span className={classes.breadcrumb_seperator}>/</span>
                      <StickyNote2OutlinedIcon
                        sx={{ mr: 0.5, fontSize: "1.7rem" }}
                        className={`notebook_cover_${notebook?.cover}`}
                      />
                    </span>
                    <span className={classes.breadcrumb_link_btn}>
                      {notebookLoaded && notebook?.name}
                    </span>
                  </span>
                </Link>
              )}

              {/* NOTE */}
              {notebookLoaded && notebook?.name && pageLayout === "note" && (
                <Fragment>
                  <span className={classes.breadcrumb_seperator}>/</span>
                  <Typography>
                    <span className={classes.breadcrumb_link}>
                      <NoteOutlinedIcon
                        sx={{ mr: 0.5 }}
                        className={classes.note}
                      />
                      Note
                    </span>
                  </Typography>
                </Fragment>
              )}
            </div>

            {/* EDIT NOTEBOOK BUTTON */}
            {notebookLoaded && pageLayout === "notebook" && (
              <div className={classes.breadcrumb_edit_btn}>
                <Fab
                  size="xsmall"
                  variant="circular"
                  color="default"
                  onClick={editNotebook}
                >
                  <EditIcon
                    sx={{ mr: 0 }}
                    fontSize="small"
                    className={classes.edit_btn}
                  />
                </Fab>
              </div>
            )}
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default Breadcrumb;
