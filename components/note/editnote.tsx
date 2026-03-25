import React, { Fragment, useRef, useEffect, memo } from "react";
import { NoteEditor } from "../../types";

const EditNote = (props: NoteEditor) => {
  const isVisible = props.visible;
  const loaded_text = props.loadedText;
  const splitscreen = props.splitScreen;
  const pass_updated_view_text = props.passUpdatedViewText;
  const showPane = isVisible || splitscreen;

  const noteInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (noteInputRef.current) {
      const current_edit_text = noteInputRef.current.innerText;
      if (current_edit_text !== pass_updated_view_text) {
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

  const editPaneClassName = [
    "edit",
    "editnote_box",
    splitscreen && "view_split",
    splitscreen && "show",
    !splitscreen && showPane && "show",
    !splitscreen && !showPane && "hide",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Fragment>
      <div id="edit" className={editPaneClassName}>
        <div className="edit-note">
          <div className="note-card">
            <article className="v-card-text viewnote_content editor">
              <div
                ref={noteInputRef}
                contentEditable={showPane}
                className="viewnote_content editable"
                onInput={(e) => setText(e)}
                data-placeholder="Start writing..."
                role="textbox"
              ></div>
            </article>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default memo(EditNote);
