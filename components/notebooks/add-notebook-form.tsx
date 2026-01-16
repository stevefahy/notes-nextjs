import React, { Fragment, useRef, useState } from "react";
import dynamic from "next/dynamic";
import classes from "./add-notebook-form.module.css";
import { FolderOptions } from "../../lib/folder-options";
import { NotebookAddEdit } from "../../types";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CancelIcon from "@mui/icons-material/Cancel";

const Button = dynamic(() => import("../ui/button"), {});
const ErrorAlert = dynamic(() => import("../ui/error-alert"), {});

const AddNotebookForm = (props: NotebookAddEdit) => {
  const [error, setError] = useState({ state: false, message: "" });
  const [selectedCover, setSelectedCover] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [formChanged, setFormChanged] = useState(false);

  const notebookNameRef = useRef<HTMLInputElement>(null);

  let notebookName: string = "";
  let notebookCover: string = "default";
  let originalName: string = "";
  let originalCover: string = "";

  if (props.method === "edit" && props.notebook) {
    originalName = notebookName = props.notebook.notebook_name;
    originalCover = notebookCover = props.notebook.notebook_cover;
  } else {
    originalName = notebookName;
    originalCover = notebookCover;
  }

  const checkForm = () => {
    if (!formChanged) {
      return true;
    } else {
      return false;
    }
  };

  const nameChangeHandler = (name: string) => {
    setSelectedName((prev) => name);
    if (selectedCover !== originalCover) {
      setSelectedCover((prev) => originalCover);
    }
    if (name !== originalName || selectedCover !== originalCover) {
      setFormChanged((prev) => true);
    } else {
      setFormChanged((prev) => false);
    }
  };

  const coverChangeHandler = (cover: string) => {
    setSelectedName((prev) => notebookNameRef.current!.value);
    setSelectedCover((prev) => cover);
    if (
      notebookNameRef.current!.value !== originalName ||
      (notebookNameRef.current!.value !== "" && cover !== originalCover)
    ) {
      setFormChanged((prev) => true);
    } else {
      setFormChanged((prev) => false);
    }
  };

  const cancelHandler = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setError({ state: false, message: "" });
    props.onCancel();
  };

  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setError({ state: false, message: "" });
    if (!selectedName || selectedName.length < 3) {
      setError({
        state: true,
        message: "The Notebook name must be at least 3 characters!",
      });
      return;
    }
    if (selectedName.length > 10) {
      setError({
        state: true,
        message: "The Notebook name must be less than 10 characters!",
      });
      return;
    }
    if (!selectedCover || selectedCover.length === 0) {
      setSelectedCover(notebookCover);
    }
    if (!selectedCover || selectedCover.length === 0) {
      setError({ state: true, message: "Please select a cover!" });
      return;
    }

    const notebook_name = notebookNameRef.current!.value;
    if (props.method === "edit" && props.notebook && props.editNotebook) {
      const notebookId = props.notebook._id;
      let updated = new Date().toISOString();
      if (props.notebook.updatedAt) {
        updated = props.notebook.updatedAt;
      }
      props.editNotebook(notebookId, notebook_name, selectedCover, updated);
    } else if (props.method === "create" && props.addNotebook) {
      props.addNotebook(notebook_name, selectedCover);
    }
  };

  return (
    <Fragment>
      <Dialog open={true}>
        <DialogTitle>
          {props.method === "edit" ? "Edit Notebook" : "Add Notebook"}
        </DialogTitle>
        <DialogContent>
          <form className={classes.form}>
            <div className={classes.control}>
              <label htmlFor="new-notebook">Name</label>
              <input
                type="text"
                id="new-notebook"
                ref={notebookNameRef}
                defaultValue={notebookName}
                onChange={(e) => {
                  nameChangeHandler(e.target.value);
                }}
              />
            </div>
            <div className={classes.control}>
              <label htmlFor="new-notebook-cover">Cover</label>
              <select
                name="cars"
                className={classes.select_dialogue}
                id="new-notebook-cover"
                defaultValue={notebookCover}
                onChange={(e) => {
                  coverChangeHandler(e.target.value);
                }}
              >
                {FolderOptions.map((folder) => {
                  return (
                    <option key={folder.value} value={folder.value}>
                      {folder.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </form>
          <div className={classes.button_row}>
            <div
              className={checkForm() ? classes.action_disabled : classes.action}
            >
              {props.method === "create" && (
                <Button
                  disabled={checkForm()}
                  variant="contained"
                  color="secondary"
                  size="medium"
                  onClick={submitHandler}
                >
                  Add
                </Button>
              )}
              {props.method === "edit" && (
                <Button
                  variant="contained"
                  onClick={submitHandler}
                  disabled={checkForm()}
                >
                  Confirm
                </Button>
              )}
            </div>
            <div>
              <Button variant="contained" size="medium" onClick={cancelHandler}>
                <CancelIcon sx={{ mr: 1 }} />
                Cancel
              </Button>
            </div>
          </div>
          {error.state && (
            <ErrorAlert>
              <div>{error.message}</div>
            </ErrorAlert>
          )}
        </DialogContent>
      </Dialog>
    </Fragment>
  );
};

export default AddNotebookForm;
