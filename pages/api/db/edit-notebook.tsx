import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../lib/db";
import { Db, ObjectId } from "mongodb";
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

  const data = req.body;
  const { notebookID, notebookName, notebookCover, notebookUpdated } = data;

  if (!notebookID) {
    res.status(400).json({ error: AC.NOTEBOOK_ERROR });
    return;
  }
  if (!notebookName) {
    res.status(400).json({ error: AC.GENERAL_ERROR });
    return;
  }
  if (!notebookCover) {
    res.status(400).json({ error: AC.NOTEBOOK_COVER_EMPTY });
    return;
  }

  const notebookId = parseObjectIdFromBody(notebookID, res, AC.NOTEBOOK_ERROR);
  if (!notebookId) return;

  let nbUpdated: Date;
  if (notebookUpdated === undefined) {
    nbUpdated = new Date();
  } else {
    nbUpdated = notebookUpdated;
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
    const result = await db.collection("notebooks").updateOne(
      {
        user: userID,
        notebooks: {
          $elemMatch: {
            _id: notebookId,
          },
        },
      },
      {
        $set: {
          "notebooks.$.notebook_name": notebookName,
          "notebooks.$.notebook_cover": notebookCover,
          "notebooks.$.updatedAt": nbUpdated,
        },
      },
    );
    if (result.modifiedCount > 0) {
      const edited_notebook = {
        _id: notebookID,
        notebook_name: notebookName,
        notebook_cover: notebookCover,
      };
      res.status(200).json({
        message: "Notebook edited",
        acknowledged: true,
        edited: edited_notebook,
      });
    } else {
      res.status(400).json({ error: AC.GENERAL_ERROR });
    }
  } catch {
    res.status(500).json({ error: AC.GENERAL_ERROR });
  }
};

export default handler;
