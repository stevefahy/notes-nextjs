import { Db, ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../lib/db";
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
  const { notebookID } = data;
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

  try {
    const result = await db.collection("notebooks").updateOne(
      {
        user: uID,
        notebooks: {
          $elemMatch: {
            _id: nID,
          },
        },
      },
      {
        $pull: {
          notebooks: {
            _id: nID,
          },
        },
      },
    );
    res.status(200).json({ message: "success", result: { notes: result } });
  } catch {
    res.status(500).json({ error: AC.NOTEBOOK_DELETE_ERROR });
  }
};

export default handler;
