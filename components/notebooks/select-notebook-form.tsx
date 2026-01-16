import React, { ChangeEvent, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import classes from "./select-notebook-form.module.css";
import { Notebook, NotebookType, SelectNotebookFormProps } from "../../types";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CancelIcon from "@mui/icons-material/Cancel";

const Button = dynamic(() => import("../ui/button"));
const ErrorAlert = dynamic(() => import("../ui/error-alert"));

const SelectNotebookForm = (props: SelectNotebookFormProps) => {
  const router = useRouter();

  const [error, setError] = useState({ error_state: false, message: "" });
  const [selectedNotebook, setSelectedNotebook] = useState("");
  const [formIsValid, setFormIsValid] = useState(false);
  const [notebooksSorted, setNotebooksSorted] = useState<Notebook[]>();

  let notebook_object: Notebook;
  const { notebooks } = props;
  const { notebookId } = router.query;

  const findNotebook = (notebook_id: string) => {
    const index = notebooks.findIndex((x) => x._id === notebook_id);
    return notebooks[index];
  };

  const sortNotes = useCallback((notebooks: Notebook[]) => {
    // Add an update date for sorting if one does not exist
    notebooks.map((x) => {
      if (x.updatedAt === "No date" || undefined) {
        x.updatedAt = "December 17, 1995 03:24:00";
      }
    });
    notebooks
      .sort((a, b) => {
        if (a.updatedAt !== undefined && b.updatedAt !== undefined) {
          return new Date(a.updatedAt) > new Date(b.updatedAt) ? 1 : -1;
        } else {
          return a.updatedAt !== undefined ? 1 : -1;
        }
      })
      .reverse();
    return notebooks;
  }, []);

  useEffect(() => {
    if (notebooks) {
      let sorted = sortNotes(notebooks);
      setNotebooksSorted(sorted);
    }
  }, [notebooks, sortNotes]);

  const cancelHandler = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (error.error_state) {
      setError((prevState) => ({
        ...prevState,
        error_state: false,
        message: "",
      }));
    }
    props.onCancel();
  };

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (error.error_state) {
      setError((prevState) => ({
        ...prevState,
        error_state: false,
        message: "",
      }));
    }
    notebook_object = findNotebook(selectedNotebook);

    if (!selectedNotebook) {
      setFormIsValid(false);
      return;
    }
    props.moveNotes(selectedNotebook);
  };

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedNotebook((prev) => event.target.value);
    if (event.target.value === "default") {
      setFormIsValid(false);
    } else {
      setFormIsValid(true);
    }
  };

  return (
    <Dialog open={true} fullWidth={true}>
      <DialogTitle>Move to Notebook</DialogTitle>
      <DialogContent>
        <form className={classes.form}>
          <div className={classes.control}>
            <label htmlFor="new-notebook-cover">Name</label>
            <select
              name="notebooks"
              id="notebooks"
              value={selectedNotebook}
              onChange={handleChange}
            >
              <option defaultValue="true" value="default">
                Select a notebook...
              </option>
              {notebooks &&
                notebooksSorted &&
                notebooksSorted.map((notebook) => {
                  if (notebook._id !== notebookId) {
                    return (
                      <option value={notebook._id} key={notebook._id}>
                        {notebook.notebook_name}
                      </option>
                    );
                  } else {
                    return;
                  }
                })}
            </select>
          </div>
        </form>

        <div className={classes.button_row}>
          <div className={classes.action}>
            <div className={classes.move}>
              <Button
                disabled={!formIsValid}
                variant="contained"
                color="secondary"
                size="medium"
                onClick={submitHandler}
              >
                Move Note
              </Button>
            </div>
            <div className={classes.cancel}>
              <Button variant="contained" size="medium" onClick={cancelHandler}>
                <CancelIcon sx={{ mr: 1 }} />
                Cancel
              </Button>
            </div>
          </div>
        </div>
        {error.error_state && (
          <ErrorAlert>
            <div>{error.message}</div>
          </ErrorAlert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SelectNotebookForm;
