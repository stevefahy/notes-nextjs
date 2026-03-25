import { memo, useEffect, useState } from "react";
import matter from "../../lib/matter";
import { truncateMarkdownPreview } from "../../lib/truncateMarkdownPreview";
import classes from "./viewnotethumb.module.css";
import { SkeletonBlock } from "../ui/skeleton-block";
import ViewNoteMarkdown from "./viewnote_markdown";

type ViewNoteThumbProps = { text: string };

const ViewNoteThumb = (props: ViewNoteThumbProps) => {
  const { content: rawContent } = matter(props.text);
  const content = truncateMarkdownPreview(rawContent);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadedTimer = window.setTimeout(() => {
      setLoaded(true);
    }, 600);
    return () => {
      clearTimeout(loadedTimer);
    };
  }, [content]);

  return !loaded ? (
    <SkeletonBlock height={15} />
  ) : (
    <div className={classes.box}>
      <article className="viewnote_content viewnote_thumb">
        <ViewNoteMarkdown viewText={content} disableLinks={true} />
      </article>
    </div>
  );
};

export default memo(ViewNoteThumb);
