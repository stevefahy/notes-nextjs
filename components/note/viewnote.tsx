import { useState, useEffect, Fragment, memo } from "react";
import matter from "../../lib/matter";
import { NoteEditorView } from "../../types";
import { SkeletonBlock } from "../ui/skeleton-block";
import ViewNoteMarkdown from "./viewnote_markdown";

const ViewNote = (props: NoteEditorView) => {
  const splitscreen = props.splitScreen;

  const { content } = matter(props.viewText);
  const [contextView, setContextView] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const updateViewText = (a: string | ((prev: string) => string)): void => {
    props.updatedViewText(a);
  };

  useEffect(() => {
    if (content !== contextView) {
      setContextView(content);
    }
    setIsLoaded(true);
    return () => {};
  }, [content, contextView]);

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
              {!isLoaded ? (
                <SkeletonBlock
                  className="skeleton-view-placeholder"
                  height={50}
                />
              ) : (
                <ViewNoteMarkdown
                  splitScreen={splitscreen}
                  viewText={contextView}
                  updatedViewText={updateViewText}
                  disableLinks={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default memo(ViewNote);
