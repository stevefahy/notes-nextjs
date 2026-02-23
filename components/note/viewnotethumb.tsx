import { memo } from "react";
import dynamic from "next/dynamic";
import matter from "gray-matter";
import { truncateMarkdownPreview } from "../../lib/truncateMarkdownPreview";
import classes from "./viewnotethumb.module.css";

const ViewNoteMarkdown = dynamic(() => import("./viewnote_markdown"));

const ViewNoteThumb = (props: any) => {
  const { content: rawContent } = matter(props.text);
  const content = truncateMarkdownPreview(rawContent);

  const updateViewText = (a: any) => {
    props.updatedViewText(a);
  };

  return (
    <div className={classes.box}>
      <article className="viewnote_content viewnote_thumb">
        <ViewNoteMarkdown
          viewText={content}
          updatedViewText={updateViewText}
          disableLinks={true}
        />
      </article>
    </div>
  );
};

export default memo(ViewNoteThumb);
