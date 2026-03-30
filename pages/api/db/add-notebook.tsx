import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../lib/db";
import { Db, ObjectId } from "mongodb";
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

  const data = req.body;
  const { notebookName, notebookCover } = data;

  if (!notebookName) {
    res.status(400).json({ error: AC.GENERAL_ERROR });
    return;
  }
  if (!notebookCover) {
    res.status(400).json({ error: AC.NOTEBOOK_COVER_EMPTY });
    return;
  }

  const userID = await requireSessionUserId(req, res, authOptions);
  if (!userID) return;

  let db: Db;
  try {
    db = await getDb();
  } catch {
    res.status(500).json({ error: AC.ERROR_SERVER });
    return;
  }

  try {
    const objectId = new ObjectId();
    const result = await db.collection("notebooks").updateOne(
      { user: userID },
      {
        $push: {
          notebooks: {
            _id: objectId,
            notebook_name: notebookName,
            notebook_cover: notebookCover,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    );

    if (result.modifiedCount > 0) {
      const get_updated = await db.collection("notebooks").findOne({
        user: userID,
      });
      if (!get_updated) {
        res.status(400).json({ error: AC.NOTEBOOK_CREATE_ERROR });
        return;
      }
      const added_notebook =
        get_updated.notebooks[get_updated.notebooks.length - 1];
      res.status(200).json({
        message: "Notebook created",
        acknowledged: true,
        added: added_notebook,
      });
    } else {
      res.status(400).json({ error: AC.NOTEBOOK_CREATE_ERROR });
    }
  } catch {
    res.status(500).json({ error: AC.NOTEBOOK_CREATE_ERROR });
  }
};

export default handler;
