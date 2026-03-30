import { Db, ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../lib/db";
import { NoteSaved } from "../../../types";
import APPLICATION_CONSTANTS from "../../../application_constants/applicationConstants";
import {
  parseObjectIdFromBody,
  requireSessionUserId,
  respondMethodNotAllowedPost,
} from "../../../lib/apiRouteHelpers";
import { authOptions } from "../auth/[...nextauth]";

const AC = APPLICATION_CONSTANTS;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    respondMethodNotAllowedPost(res);
    return;
  }

  const userID = await requireSessionUserId(req, res, authOptions);
  if (!userID) return;

  const data = req.body;
  const { notebookID, noteID, note } = data;

  if (!note || note.length === 0) {
    res.status(400).json({ error: AC.NOTE_SAVE_ERROR });
    return;
  }
  if (!notebookID) {
    res.status(400).json({ error: AC.NOTEBOOK_ERROR });
    return;
  }
  if (!noteID) {
    res.status(400).json({ error: AC.NOTE_ERROR });
    return;
  }

  const nbID = parseObjectIdFromBody(notebookID, res, AC.NOTEBOOK_ERROR);
  if (!nbID) return;
  const nID = parseObjectIdFromBody(noteID, res, AC.NOTE_ERROR);
  if (!nID) return;
  const uID = userID;

  let db: Db;
  try {
    db = await getDb();
  } catch {
    res.status(500).json({ error: AC.ERROR_SERVER });
    return;
  }

  const updateNotebook = (uid: ObjectId, notebookId: ObjectId) => {
    return new Promise<NoteSaved>((resolve, reject) => {
      db.collection("notebooks")
        .updateOne(
          {
            user: uid,
            notebooks: {
              $elemMatch: {
                _id: notebookId,
              },
            },
          },
          {
            $set: {
              "notebooks.$.updatedAt": new Date(),
            },
          },
        )
        .then(
          (r) => {
            if (r === null) {
              reject(new Error("notebook update"));
            } else {
              resolve({ notes: r });
            }
          },
          (err) => {
            reject(err);
          },
        );
    });
  };

  const saveNote = (
    uid: ObjectId,
    notebookId: ObjectId,
    noteObjectId: ObjectId,
    n: string,
  ) => {
    return new Promise<NoteSaved>((resolve, reject) => {
      db.collection("notes")
        .updateOne(
          {
            _id: noteObjectId,
            user: uid,
            notebook: notebookId,
          },
          {
            $set: {
              note: n,
              updatedAt: new Date(),
            },
          },
        )
        .then(
          (r) => {
            if (r === null) {
              reject(new Error("note save"));
            } else {
              resolve({ notes: r });
            }
          },
          (err) => reject(err),
        );
    });
  };

  try {
    const result = (await saveNote(uID, nbID, nID, note)) as NoteSaved;
    await updateNotebook(uID, nbID);
    if (result.notes.modifiedCount === 0 && result.notes.matchedCount === 0) {
      res.status(500).json({ error: AC.NOTE_SAVE_ERROR });
      return;
    }
    res.status(200).json({ message: "success", result: result });
  } catch {
    res.status(500).json({ error: AC.NOTE_SAVE_ERROR });
  }
};

export default handler;
