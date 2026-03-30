import { Db, ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../lib/db";
import APPLICATION_CONSTANTS from "../../../application_constants/applicationConstants";
import {
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
  const { notes } = data;

  if (!notes) {
    res.status(400).json({ error: AC.NOTES_ERROR });
    return;
  }

  if (!Array.isArray(notes) || notes.length === 0) {
    res.status(400).json({ error: AC.NOTES_ERROR });
    return;
  }

  const notesArray: ObjectId[] = [];
  for (let i = 0; i < notes.length; i++) {
    const id = notes[i];
    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      res.status(400).json({ error: AC.NOTES_ERROR });
      return;
    }
    notesArray.push(new ObjectId(id));
  }

  let db: Db;
  try {
    db = await getDb();
  } catch {
    res.status(500).json({ error: AC.ERROR_SERVER });
    return;
  }

  try {
    const result = await db.collection("notes").deleteMany({
      _id: { $in: notesArray },
    });
    res.status(200).json({ message: "success", result: { notes: result } });
  } catch {
    res.status(500).json({ error: AC.NOTES_DELETE_ERROR });
  }
};

export default handler;
