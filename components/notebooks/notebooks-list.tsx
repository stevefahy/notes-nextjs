import { Fragment, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Notebook, NotebooksDB } from "../../types";
import classes from "./notebooks-list.module.css";
import { uiActions } from "../../store/ui-slice";
import { useAppDispatch } from "../../store/hooks";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Fab from "@mui/material/Fab";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { addNotebookFetch } from "../../lib/fetch-helpers";
import DateFormat from "../ui/date-format";

const AddNotebookForm = dynamic(() => import("./add-notebook-form"));
const Footer = dynamic(() => import("../layout/footer"));

const NotebooksList = (props: NotebooksDB) => {
  const dispatch = useAppDispatch();

  const [addNotebook, setAddNotebook] = useState(false);
  const [notebooks, setNotebooks] = useState<Notebook[] | []>([]);

  useEffect(() => {
    if (props.notebooks.result && props.notebooks.result.notebooks) {
      const noteBooksArray = props.notebooks.result.notebooks;
      setNotebooks(noteBooksArray);
    }
    if (props.notebooks.error) {
      dispatch(
        uiActions.showNotification({
          status: "error",
          title: "Error!",
          message: props.notebooks.error,
        })
      );
    }
  }, [props.notebooks, dispatch]);

  const addNotebookFormHandler = () => {
    setAddNotebook(true);
  };

  const cancelHandler = () => {
    setAddNotebook(false);
  };

  const errorMessage = (msg: string) => {
    dispatch(
      uiActions.showNotification({
        status: "error",
        title: "Error!",
        message: msg,
      })
    );
  };

  const addNotebookHandler = async (
    notebook_name: string,
    notebook_cover: string
  ) => {
    try {
      addNotebookFetch(notebook_name, notebook_cover)
        .then((response) => {
          if (!response || !response.success) {
            errorMessage(`An error occured creating the notebook!`);
            return;
          }
          if (response.success) {
            let notebook = response.notebook;
            setNotebooks((prevNotebooks) => [
              {
                _id: notebook.id,
                notebook_name: notebook.name,
                notebook_cover: notebook.cover,
                updatedAt: notebook.updatedAt,
                createdAt: notebook.createdAt,
              },
              ...prevNotebooks,
            ]);
            setAddNotebook(false);
          }
        })
        .catch(function (error: any) {
          errorMessage(
            error.message || `An error occured creating the notebook!`
          );
        });
    } catch (error: any) {
      errorMessage(error.message || `An error occured creating the notebook!`);
      return;
    }
  };

  return (
    <Fragment>
      <div>
        {!notebooks && <p>Loading...</p>}
        {notebooks && (
          <ul className={classes.notebooks_list}>
            {notebooks.map((note) => (
              <Link href={`/notebook/${note._id}`} key={note._id}>
                <li className={`${classes.notebooks_list_bg}`}>
                  <Card sx={{ width: "100%" }}>
                    <CardContent className={classes.cardcontent}>
                      <div className={classes.notebooks_list_outer}>
                        <div
                          className={`${classes.notebooks_list_left}  ${
                            classes["tab_" + note.notebook_cover]
                          }`}
                        ></div>
                        <div className={classes.notebooks_list_right}>
                          <div>{note.notebook_name}</div>
                          <div className="date_format">
                            <DateFormat dateString={note.updatedAt!} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              </Link>
            ))}
          </ul>
        )}
        {addNotebook && (
          <AddNotebookForm
            method="create"
            addNotebook={addNotebookHandler}
            onCancel={cancelHandler}
          />
        )}
      </div>
      <Footer>
        {notebooks && (
          <Fab
            variant="extended"
            color="secondary"
            size="medium"
            onClick={addNotebookFormHandler}
          >
            <AddCircleIcon sx={{ mr: 1 }} />
            Add Notebook
          </Fab>
        )}
      </Footer>
    </Fragment>
  );
};

export default NotebooksList;
