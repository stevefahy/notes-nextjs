import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../lib/db";
import { Db } from "mongodb";
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

  const notebookObject = parseObjectIdFromBody(notebookID, res, AC.NOTEBOOK_ERROR);
  if (!notebookObject) return;

  let db: Db;
  try {
    db = await getDb();
  } catch {
    res.status(500).json({ error: AC.ERROR_SERVER });
    return;
  }

  try {
    const result = await db
      .collection("notebooks")
      .aggregate([
        {
          $match: {
            user: userID,
          },
        },
        {
          $unwind: "$notebooks",
        },
        {
          $match: {
            "notebooks._id": notebookObject,
          },
        },
        {
          $replaceRoot: {
            newRoot: "$notebooks",
          },
        },
      ])
      .toArray();
    res
      .status(200)
      .json({ message: "Notebook retrieved", result: result[0] });
  } catch {
    res.status(500).json({ error: AC.NOTEBOOK_ERROR });
  }
};

export default handler;
