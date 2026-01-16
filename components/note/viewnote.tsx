import React, { useState, useEffect, Fragment, memo } from "react";
import dynamic from "next/dynamic";
import matter from "gray-matter";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import classesShared from "./editviewnote_shared.module.css";
import { NoteEditorView } from "../../types";

const ViewNoteMarkdown = dynamic(() => import("./viewnote_markdown"));

const ViewNote = (props: NoteEditorView) => {
  const splitscreen = props.splitScreen;
  const isVisible = props.visible;

  const { data, content } = matter(props.viewText);
  const [contextView, setContextView] = useState("");
  const [isSplitScreen, setIsSplitScreen] = useState(splitscreen);

  const updateViewText = (a: any) => {
    props.updatedViewText(a);
  };

  useEffect(() => {
    if (content !== contextView) {
      setContextView((prev) => content);
      return () => {
        // component unmount
      };
    }
  }, [content, contextView]);

  useEffect(() => {
    setIsSplitScreen(splitscreen);
  }, [splitscreen]);

  return (
    <Fragment>
      <div
        id="view"
        className={`view ${
          isSplitScreen ? `view_split ${classesShared.show}` : ""
        } ${classesShared.editnote_box} ${
          isVisible ? classesShared.show : classesShared.hide
        }`}
      >
        <Card sx={{ width: "100%" }}>
          <CardContent>
            <article
              id="viewnote_id"
              className={`viewnote_content viewer ${classesShared.viewnote_content}`}
            >
              <ViewNoteMarkdown
                splitScreen={splitscreen}
                viewText={contextView}
                updatedViewText={updateViewText}
                disableLinks={false}
              />
            </article>
          </CardContent>
        </Card>
      </div>
    </Fragment>
  );
};
export default memo(ViewNote);
