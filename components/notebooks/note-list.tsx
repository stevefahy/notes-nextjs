import { useEffect, useState, memo, KeyboardEvent, MouseEvent } from "react";
import Link from "next/link";
import { NotesDBProps } from "../../types";
import DateFormat from "../ui/date-format";
import ViewNoteThumb from "../note/viewnotethumb";
import { extractNoteTitle, detectNoteTag } from "../../lib/noteCardUtils";
import { useAppDispatch } from "../../store/hooks";
import { editNotesActions } from "../../store/edit-notes-slice";

type NoteTagKind = ReturnType<typeof detectNoteTag>;

const TAG_CONFIG: Record<NoteTagKind, { classSuffix: string; label: string }> =
  {
    todo: { classSuffix: "tag-todo", label: "Todo" },
    table: { classSuffix: "tag-table", label: "Table" },
    code: { classSuffix: "tag-code", label: "Code" },
    image: { classSuffix: "tag-image", label: "Image" },
    list: { classSuffix: "tag-list", label: "List" },
    text: { classSuffix: "tag-text", label: "Text" },
    empty: { classSuffix: "tag-empty", label: "Empty" },
  };

function NoteTypeTag({ tag }: { tag: NoteTagKind }) {
  const { classSuffix, label } = TAG_CONFIG[tag];
  return <span className={`note-tag ${classSuffix}`}>{label}</span>;
}

const NoteList = (props: NotesDBProps) => {
  const dispatch = useAppDispatch();
  const { notes, onNotesSelected, onNotesEdit } = props;

  const [isChecked, setIsChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const selected = Object.entries(isChecked)
      .filter(([, v]) => v)
      .map(([k]) => k);
    onNotesSelected({ selected });
    dispatch(
      editNotesActions.setActiveAndCount({
        active: !!onNotesEdit,
        selectedCount: selected.length,
      }),
    );
  }, [isChecked, onNotesSelected, onNotesEdit, dispatch]);

  const toggleNote = (noteId: string) => {
    setIsChecked((prev) => ({ ...prev, [noteId]: !prev[noteId] }));
  };

  const handleCardKeydown = (
    e: KeyboardEvent<HTMLDivElement>,
    noteId: string,
  ) => {
    if (onNotesEdit && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      toggleNote(noteId);
    }
  };

  const handleSelectColClick = (e: MouseEvent, noteId: string) => {
    e.stopPropagation();
    toggleNote(noteId);
  };

  return (
    <div className="notebooks-list-wrap">
      <h2 className="page-heading">Your Notes</h2>
      <div className="notes-list-container">
        {notes && (
          <ul className="notes_list">
            {notes.map((note) => {
              const title = extractNoteTitle(note.note);
              const tag = detectNoteTag(note.note);
              const selected = !!isChecked[note._id];

              return (
                <li key={note._id} className="note-card-outer">
                  {!onNotesEdit && (
                    <Link
                      href={`/notebook/${note.notebook}/${note._id}`}
                      className="note-card-link-overlay"
                      aria-label="Open note"
                    />
                  )}
                  <div
                    className="note-card-link"
                    role={onNotesEdit ? "button" : undefined}
                    tabIndex={onNotesEdit ? 0 : undefined}
                    onClick={
                      onNotesEdit ? () => toggleNote(note._id) : undefined
                    }
                    onKeyDown={
                      onNotesEdit
                        ? (e) => handleCardKeydown(e, note._id)
                        : undefined
                    }
                  >
                    <div
                      className={`note-card${selected ? " note-card--selected" : ""}`}
                    >
                      <div
                        className={`note-select-col-wrapper${onNotesEdit ? " is-visible" : ""}`}
                      >
                        <div
                          className="note-select-col"
                          role="checkbox"
                          tabIndex={onNotesEdit ? 0 : -1}
                          aria-checked={selected}
                          onClick={(e) => handleSelectColClick(e, note._id)}
                          onKeyDown={(e) => {
                            if (onNotesEdit) handleCardKeydown(e, note._id);
                          }}
                        >
                          <div
                            className={`sel-circle${selected ? " sel-circle--active" : ""}`}
                          >
                            {selected ? (
                              <svg
                                width="10"
                                height="8"
                                viewBox="0 0 10 8"
                                fill="none"
                                aria-hidden
                              >
                                <path
                                  d="M1 4l3 3 5-6"
                                  stroke="white"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="note-card-body">
                        <div className="note-title">{title}</div>
                        <div className="note-thumb-preview">
                          <ViewNoteThumbMemo text={note.note} />
                        </div>
                        <div className="note-foot">
                          <span className="note-date">
                            <DateFormat dateString={note.updatedAt ?? ""} />
                          </span>
                          <NoteTypeTag tag={tag} />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

const ViewNoteThumbMemo = memo(ViewNoteThumb);
export default memo(NoteList);
