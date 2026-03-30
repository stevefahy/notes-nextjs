import { Db, ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../lib/db";
import type { NotebookSaved } from "../../../types";
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
  const { notebookID, note } = data;

  if (!note || note.length === 0) {
    res.status(400).json({ error: AC.NOTE_CREATE_ERROR });
    return;
  }
  if (!notebookID) {
    res.status(400).json({ error: AC.NOTEBOOK_ERROR });
    return;
  }

  const nID = parseObjectIdFromBody(notebookID, res, AC.NOTEBOOK_ERROR);
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
    return new Promise<NotebookSaved>((resolve, reject) => {
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
          (err) => reject(err),
        );
    });
  };

  try {
    const insertResult = await db.collection("notes").insertOne({
      notebook: nID,
      user: uID,
      note: note,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await updateNotebook(uID, nID);
    res.status(200).json({
      message: "success",
      result: { notes: insertResult },
    });
  } catch {
    res.status(500).json({ error: AC.NOTE_CREATE_ERROR });
  }
};

export default handler;
