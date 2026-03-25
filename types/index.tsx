import { ObjectId } from "mongodb";
import { ISODateString } from "next-auth";
import type { NotebookCoverType } from "../lib/folder-options";

export interface Props {
  children?: React.ReactNode;
}

export interface PropsMUI {
  children?: React.ReactNode;
}

// User

export interface User {
  id?: ObjectId;
  _id: ObjectId;
  email: string;
  password?: string;
  username: string;
}

/** Profile API / session details — matches React `IAuthDetails`. */
export interface IAuthDetails {
  authStrategy: string;
  username: string;
  email: string;
  __v: number;
  _id: string;
}

// Note Editor

export interface NoteEditor {
  visible: boolean;
  splitScreen: boolean;
  loadedText: string;
  updateViewText: (updatedView: string | ((prev: string) => string)) => void;
  passUpdatedViewText: string;
}

export interface NoteEditorView {
  visible: boolean;
  splitScreen: boolean;
  viewText: string;
  updatedViewText: (updatedEdit: string | ((prev: string) => string)) => void;
}

export interface ViewNoteMarkdownProps {
  viewText: string;
  scrollView?: number;
  splitScreen?: boolean;
  /** When omitted (e.g. thumbnails), wrapper gets `md-readonly` like Svelte `!onViewTextUpdate`. */
  updatedViewText?: (updatedEdit: string | ((prev: string) => string)) => void;
  disableLinks: boolean;
}

export interface SourcePosition {
  start: { column?: number; line?: number; offset?: number };
  end: { column?: number; line?: number; offset?: number };
}

// Note

export interface NoteSaved {
  notes: {
    modifiedCount?: number;
    matchedCount?: number;
  };
}

export interface NoteEdit {
  data: Note;
  error: string;
}

export interface Note {
  _id: string;
  note: string;
  notebook: string;
  error?: string;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface NoteDBProps {
  data?: Note | null;
  error?: string;
}

export interface Notes {
  notes: Note[] | null;
  error?: string;
}

export interface UserNotes {
  message?: string;
  error?: string;
  result?: Notes | null;
}

export interface UserNote {
  error?: string;
  data?: NoteDB | null;
}

export interface UserNoteDB {
  error?: string;
  data?: Note | null;
}

// Notebook Header

export interface NotebookHeader {
  notebook?: Notebook;
  editNotebookBtnHandler?: () => void;
}

// Notebook

export interface Notebook {
  _id: string;
  notebook_name: string;
  notebook_cover: string;
  /** Populated when listing notebooks (matches React API). */
  noteCount?: number;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface Notebooks {
  _id: string;
  user: string;
  notebooks: Notebook[];
  error?: string;
}

export interface UserNotebooks {
  message?: string;
  error?: string;
  result?: Notebooks | null;
}

export interface UserNotebook {
  message?: string;
  error?: string;
  result?: Notebook | null;
}

export interface NotebooksDB {
  notebooks: UserNotebooks;
  onNotebooksReload?: () => void | Promise<unknown>;
}

/** Single notebook row for `NotebookListItem`. */
export interface NotebookItem {
  notebook_item: Notebook & { noteCount?: number };
}

export interface NotebookSaved {
  notes: {
    modifiedCount?: number;
    matchedCount?: number;
  };
}

export interface CheckedNote {
  id: string;
  selected: boolean;
}
export interface SelectedNote {
  selected: string[];
}

export interface NotesDB {
  notebooks: UserNotebooks;
  notebook: UserNotebook;
  notes: UserNotes;
  onNotesSelected?: (selected: SelectedNote) => void;
}

export interface NoteDB {
  notebooks: UserNotebooks;
  notebook: UserNotebook;
  notes: UserNotes;
  onNotesSelected: (selected: SelectedNote) => void;
}

export interface NotesDBProps {
  notebook?: Notebook;
  notes: Note[];
  onNotesSelected: (selected: SelectedNote) => void;
  onNotesEdit: boolean;
}

export interface NotebookAddEdit {
  method: "edit" | "create";
  notebook?: Notebook;
  onCancel: () => void;
  addNotebook?: (
    notebook_name: string,
    notebook_cover: NotebookCoverType,
  ) => void | Promise<boolean>;
  editNotebook?: (
    notebook_id: string,
    notebook_name: string,
    notebook_cover: NotebookCoverType,
    notebook_updated: string,
  ) => void | Promise<boolean>;
}

// SelectNotebookForm

export interface SelectNotebookFormProps {
  notebooks: Notebook[];
  currentNotebookId: string;
  onCancel: () => void;
  moveNotes: (notebook_id: string) => void;
}

// Notification

export type NotificationStatus = "pending" | "success" | "error" | null;

export interface NotificationInterface {
  status?: NotificationStatus;
  title?: string | null;
  message?: string | null;
}

export interface showNotification {
  state: NotificationInterface;
}

// Alert
export interface AlertInterface {
  error_state?: boolean;
  error_severity?: "error" | "warning" | "info" | "success" | "";
  message?: string;
  children?: React.ReactNode;
}

// UI

export interface ButtonType {
  size?: "small" | "medium" | "large" | undefined;
  variant?: "text" | "contained" | "outlined" | undefined;
  color?: any;
  link?: string;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

// Auth Form

export interface ErrorMessage {
  error: boolean;
  message: string;
}

// Profile Form

export interface ProfileFormProps {
  userName: string | undefined;
  /** Refetch session after username change (NextAuth `update()`). */
  onSessionRefresh?: () => void | Promise<void>;
  userEmail?: string;
  userId?: string;
}

// Breadcrumb

export type PageType = "notebooks" | "notebook" | "note" | "profile" | "other";

export type NotebookType = {
  name: string;
  id: string;
  cover?: string;
};
