import Link from "next/link";
import DateFormat from "../ui/date-format";
import { Fragment, useEffect, useState } from "react";
import { NotebookItem } from "../../types";
import { getDisplayCover } from "../../lib/notebookCoverUtils";

const NotebookListItem = (props: NotebookItem) => {
  const { notebook_item } = props;
  const [notebookLoaded, setNotebookLoaded] = useState(false);
  const displayCover = getDisplayCover(notebook_item.notebook_cover);

  useEffect(() => {
    const loadedTimer = window.setTimeout(() => setNotebookLoaded(true), 100);
    return () => clearTimeout(loadedTimer);
  }, [notebook_item]);

  const count = notebook_item.noteCount;

  return (
    <Fragment>
      {!notebookLoaded ? (
        <li className="notebooks_list_bg">
          <div className="vcard">
            <div className="cardcontent" />
            <div className="notebooks_list_outer">
              <div className="notebooks_list_left tab_loading">
                <div className="nb-spine-loading" />
              </div>
              <div className="notebooks_list_right">
                <div>...</div>
              </div>
            </div>
          </div>
        </li>
      ) : (
        <Link
          href={`/notebook/${notebook_item._id}`}
          className="notebook-link"
          key={notebook_item._id}
        >
          <li className="notebooks_list_bg">
            <div className="vcard">
              <div className="cardcontent" />
              <div className="notebooks_list_outer">
                <div className={`notebooks_list_left tab_${displayCover}`}>
                  <div className={`nb-spine-${displayCover}`} />
                </div>
                <div className="notebooks_list_right">
                  <div>{notebook_item.notebook_name}</div>
                  <div className="date_format">
                    <DateFormat dateString={notebook_item.updatedAt!} />
                  </div>
                </div>
                {count !== undefined && (
                  <span className="nb-count">
                    {count} {count === 1 ? "note" : "notes"}
                  </span>
                )}
                <div className="notebooks_list_arrow">›</div>
              </div>
            </div>
          </li>
        </Link>
      )}
    </Fragment>
  );
};

export default NotebookListItem;
