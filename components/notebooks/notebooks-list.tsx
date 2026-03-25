import { Fragment, useEffect, useMemo, useState, useCallback } from "react";
import { Notebook, NotebooksDB } from "../../types";
import APPLICATION_CONSTANTS from "../../application_constants/applicationConstants";
import { dispatchErrorSnack } from "../../lib/dispatchSnack";
import { useAppDispatch } from "../../store/hooks";
import Footer from "../layout/footer";
import LoadingScreen from "../ui/loading-screen";
import { addNotebookFetch } from "../../lib/fetch-helpers";
import {
  toLegacyCover,
  type NotebookCoverType,
} from "../../lib/folder-options";
import { sortNotebooksLatestFirst } from "../../lib/sortNotebooks";
import AddNotebookForm from "./add-notebook-form";
import NotebookListItem from "./notebook-list-item";

const AC = APPLICATION_CONSTANTS;

const NotebooksList = (props: NotebooksDB) => {
  const dispatch = useAppDispatch();
  const { onNotebooksReload } = props;

  const [enableAddNotebook, setEnableAddNotebook] = useState(false);

  const notebooks = useMemo((): Notebook[] | null => {
    const payload = props.notebooks;
    if (!payload) return null;
    const list = payload.result?.notebooks;
    if (!list?.length) return list ?? [];
    return sortNotebooksLatestFirst(list);
  }, [props.notebooks]);

  const reportError = useCallback(
    (err: unknown, fromServer?: boolean) => {
      dispatchErrorSnack(dispatch, err, fromServer);
    },
    [dispatch],
  );

  useEffect(() => {
    if (props.notebooks?.error) {
      dispatchErrorSnack(dispatch, props.notebooks.error);
    }
  }, [props.notebooks?.error, dispatch]);

  const addNotebookFormHandler = () => {
    setEnableAddNotebook(true);
  };

  const cancelHandler = () => {
    setEnableAddNotebook(false);
  };

  const addNotebookHandler = async (
    notebook_name: string,
    notebook_cover: NotebookCoverType,
  ): Promise<boolean> => {
    const response = await addNotebookFetch(
      notebook_name,
      toLegacyCover(notebook_cover),
    );
    if (!response?.success) {
      throw new Error(AC.NOTEBOOK_CREATE_ERROR);
    }
    setEnableAddNotebook(false);
    await onNotebooksReload?.();
    return true;
  };

  return (
    <Fragment>
      <div>
        {notebooks === null && <LoadingScreen />}
        {notebooks !== null && (
          <div className="notebooks-list-wrap">
            <h2 className="page-heading">Your Notebooks</h2>
            <ul className="notebooks_list">
              {notebooks.map((notebook) => (
                <NotebookListItem key={notebook._id} notebook_item={notebook} />
              ))}
            </ul>
          </div>
        )}
        {enableAddNotebook && (
          <AddNotebookForm
            method="create"
            addNotebook={addNotebookHandler}
            onCancel={cancelHandler}
          />
        )}
      </div>
      <Footer>
        {notebooks !== null && (
          <div className="fab-row">
            <button
              type="button"
              className="fab"
              onClick={addNotebookFormHandler}
              aria-label="New notebook"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 1v10M1 6h10"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              New Notebook
            </button>
          </div>
        )}
      </Footer>
    </Fragment>
  );
};

export default NotebooksList;
