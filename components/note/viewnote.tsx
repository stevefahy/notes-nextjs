import { Fragment, memo } from "react";
import matter from "../../lib/matter";
import { NoteEditorView } from "../../types";
import ViewNoteMarkdown from "./viewnote_markdown";

const ViewNote = (props: NoteEditorView) => {
  const splitscreen = props.splitScreen;

  const { content } = matter(props.viewText);

  const updateViewText = (a: string | ((prev: string) => string)): void => {
    props.updatedViewText(a);
  };

  const viewPaneClassName = [
    "note-pane",
    "note-pane--view",
    "view",
    "editnote_box",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Fragment>
      <div id="view" className={viewPaneClassName}>
        <div className="note-pane-scroll">
          <div className="note-card">
            <div
              id="viewnote_id"
              className="v-card-text cardcontent viewnote_content"
            >
              <ViewNoteMarkdown
                splitScreen={splitscreen}
                viewText={content}
                updatedViewText={updateViewText}
                disableLinks={false}
              />
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default memo(ViewNote);
