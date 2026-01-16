import React, { Fragment, useRef, useEffect, memo } from "react";
import { NoteEditor } from "../../types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import classesShared from "./editviewnote_shared.module.css";

const EditNote = (props: NoteEditor) => {
  const isVisible = props.visible;
  const loaded_text = props.loadedText;
  const splitscreen = props.splitScreen;
  const pass_updated_view_text = props.passUpdatedViewText;

  const noteInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (noteInputRef.current) {
      const current_edit_text = noteInputRef.current.innerText;
      if (current_edit_text != pass_updated_view_text) {
        noteInputRef.current.innerText = pass_updated_view_text;
      }
    }
  }, [pass_updated_view_text]);

  useEffect(() => {
    if (loaded_text === "" && noteInputRef.current) {
      noteInputRef.current.focus();
    }
    if (loaded_text && noteInputRef.current) {
      noteInputRef.current.innerText = loaded_text;
    }
  }, [noteInputRef, loaded_text]);

  const setText = (event: React.FormEvent<HTMLDivElement>) => {
    props.updateViewText(event.currentTarget.innerText);
  };

  return (
    <Fragment>
      <div
        id="edit"
        className={`edit ${classesShared.editnote_box} ${
          isVisible
            ? classesShared.show && classesShared.editting
            : splitscreen
            ? classesShared.show
            : classesShared.hide
        }`}
      >
        <Card>
          <CardContent>
            <article className="viewnote_content editor">
              <div
                ref={noteInputRef}
                // set contentEditable to false when not in view
                // to stop soft keyboard popping up on mobile
                contentEditable={isVisible || splitscreen}
                className={`viewnote_content ${classesShared.editable}`}
                onInput={(e) => setText(e)}
                data-placeholder="Start writing..."
              ></div>
            </article>
          </CardContent>
        </Card>
      </div>
    </Fragment>
  );
};

export default memo(EditNote);
