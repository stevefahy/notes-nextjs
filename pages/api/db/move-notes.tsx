import { Db, ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../lib/db";
import { Notebook } from "../../../types";
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
  const { notes, notebookID, latestUpdatedNote } = data;

  if (!notes) {
    res.status(400).json({ error: AC.NOTES_ERROR });
    return;
  }
  if (!notebookID) {
    res.status(400).json({ error: AC.NOTEBOOK_ERROR });
    return;
  }
  if (!latestUpdatedNote) {
    res.status(400).json({ error: AC.NOTES_ERROR });
    return;
  }

  const nbID = parseObjectIdFromBody(notebookID, res, AC.NOTEBOOK_ERROR);
  if (!nbID) return;

  if (!Array.isArray(notes) || notes.length === 0) {
    res.status(400).json({ error: AC.NOTES_ERROR });
    return;
  }

  const objectArray: ObjectId[] = [];
  for (let i = 0; i < notes.length; i++) {
    const id = notes[i];
    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      res.status(400).json({ error: AC.NOTES_ERROR });
      return;
    }
    objectArray.push(new ObjectId(id));
  }

  const new_notebook = nbID;

  let db: Db;
  try {
    db = await getDb();
  } catch {
    res.status(500).json({ error: AC.ERROR_SERVER });
    return;
  }

  const getNotebook = async (uID: ObjectId, nbId: ObjectId) => {
    const result = await db
      .collection("notebooks")
      .aggregate([
        {
          $match: {
            user: uID,
          },
        },
        {
          $unwind: "$notebooks",
        },
        {
          $match: {
            "notebooks._id": nbId,
          },
        },
        {
          $replaceRoot: {
            newRoot: "$notebooks",
          },
        },
      ])
      .toArray();
    return result[0] as Notebook | undefined;
  };

  const updateNotebook = async (
    uID: ObjectId,
    notebookId: ObjectId,
    date: Date,
  ) => {
    return db.collection("notebooks").updateOne(
      {
        user: uID,
        notebooks: {
          $elemMatch: {
            _id: notebookId,
          },
        },
      },
      {
        $set: {
          "notebooks.$.updatedAt": date,
        },
      },
    );
  };

  const moveNotes = async (noteIds: ObjectId[]) => {
    const bulk_array = noteIds.map((note) => ({
      updateOne: {
        filter: { _id: note, user: userID },
        update: { $set: { notebook: new_notebook } },
      },
    }));
    return db.collection("notes").bulkWrite(bulk_array);
  };

  try {
    const notebook = await getNotebook(userID, new_notebook);
    const result = await moveNotes(objectArray);

    if (notebook?.updatedAt) {
      if (new Date(notebook.updatedAt) < new Date(latestUpdatedNote)) {
        await updateNotebook(userID, nbID, new Date(latestUpdatedNote));
      }
    }
    res.status(200).json({ message: "success", result: { notes: result } });
  } catch {
    res.status(500).json({ error: AC.NOTES_ERROR });
  }
};

export default handler;
