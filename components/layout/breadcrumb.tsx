import { Fragment, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { NotebookType } from "../../types";
import { getDisplayCover } from "../../lib/notebookCoverUtils";
import { getNotebookFetch } from "../../lib/fetch-helpers";
import { dispatchErrorSnack } from "../../lib/dispatchSnack";
import { useAppDispatch } from "../../store/hooks";
import { editActions } from "../../store/edit-slice";
import { useAppSelector } from "../../store/hooks";

const EMPTY_NOTEBOOK: NotebookType = { id: "", name: "", cover: "sage" };

const Breadcrumb = () => {
  const dispatch = useAppDispatch();
  const notification_edited = useAppSelector((state) => state.edit.edited);

  const router = useRouter();
  const notebookId = router.query.notebookId?.toString();

  const pageLayout = useMemo(() => {
    const p = router.pathname;
    if (p === "/notebooks") return "notebooks";
    if (p === "/notebook/[notebookId]/[noteId]") return "note";
    if (p === "/notebook/[notebookId]") return "notebook";
    if (p.startsWith("/profile")) return "profile";
    return "other";
  }, [router.pathname]);

  const editedNotebook = useMemo((): NotebookType | null => {
    const m = notification_edited.message;
    if (m?.notebook_name && m?._id) {
      return {
        id: m._id,
        name: m.notebook_name,
        cover: getDisplayCover(m.notebook_cover ?? undefined),
      };
    }
    return null;
  }, [notification_edited]);

  const [fetchedNotebook, setFetchedNotebook] = useState<NotebookType>(
    EMPTY_NOTEBOOK,
  );

  const notebook = useMemo((): NotebookType => {
    if (router.pathname === "/notebooks") return EMPTY_NOTEBOOK;
    if (editedNotebook) return editedNotebook;
    return fetchedNotebook;
  }, [router.pathname, editedNotebook, fetchedNotebook]);

  useEffect(() => {
    if (
      (router.pathname === "/notebook/[notebookId]" ||
        router.pathname === "/notebook/[notebookId]/[noteId]") &&
      notebookId
    ) {
      getNotebookFetch(notebookId)
        .then((value) => {
          const res = value?.Notebooks?.result;
          if (res) {
            setFetchedNotebook({
              name: res.notebook_name,
              id: res._id,
              cover: getDisplayCover(res.notebook_cover),
            });
          }
        })
        .catch((err: unknown) => {
          dispatchErrorSnack(dispatch, err, false);
        });
    }
  }, [router.pathname, notebookId, dispatch]);

  const sectionClasses = useMemo(() => {
    const base = "breadcrumb_container";
    if (pageLayout === "notebooks")
      return `${base} breadcrumb--notebooks breadcrumb--section`;
    if (pageLayout === "profile") return `${base} breadcrumb--section`;
    return base;
  }, [pageLayout]);

  const editNotebook = () => {
    dispatch(editActions.editStatus({ status: true }));
  };

  const notebooksLink = (
    <Link href="/notebooks" className="no_link">
      <span className="breadcrumb_group">
        <span className="breadcrumb_link_btn">Notebooks</span>
      </span>
    </Link>
  );

  return (
    <Fragment>
      {pageLayout !== "other" && (
        <div role="presentation" className={sectionClasses}>
          <div aria-label="breadcrumb" className="breadcrumbs_inner">
            {pageLayout === "profile" && (
              <Fragment>
                {notebooksLink}
                <span className="breadcrumb_link">
                  <span className="breadcrumb_link_icon">
                    <span className="breadcrumb_seperator">›</span>
                  </span>
                  Profile
                </span>
              </Fragment>
            )}

            {pageLayout === "notebooks" && (
              <span className="breadcrumb_group">
                <span className="breadcrumb_link">Notebooks</span>
              </span>
            )}

            {pageLayout === "notebook" && (
              <Fragment>
                {notebooksLink}
                {notebook.name ? (
                  <span className="breadcrumb_link">
                    <span className="breadcrumb_link_icon">
                      <span className="breadcrumb_seperator">›</span>
                    </span>
                    <span className="breadcrumb_link">{notebook.name}</span>
                  </span>
                ) : null}
                <div className="breadcrumb_edit_btn">
                  <button
                    type="button"
                    className="breadcrumb_edit_fab material-icons edit_icon edit_icon_small"
                    onClick={editNotebook}
                    aria-label="Edit notebook"
                  >
                    edit
                  </button>
                </div>
              </Fragment>
            )}

            {pageLayout === "note" && (
              <Fragment>
                {notebooksLink}
                {notebook.name ? (
                  <Link
                    href={`/notebook/${notebook.id}`}
                    className="breadcrumb_link"
                  >
                    <span className="breadcrumb_link_icon">
                      <span className="breadcrumb_seperator">›</span>
                    </span>
                    <span className="breadcrumb_link_btn">{notebook.name}</span>
                  </Link>
                ) : null}
                {notebook.name ? (
                  <span className="breadcrumb_link">
                    <span className="breadcrumb_link_icon">
                      <span className="breadcrumb_seperator">›</span>
                    </span>
                    Note
                  </span>
                ) : null}
              </Fragment>
            )}
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default Breadcrumb;
