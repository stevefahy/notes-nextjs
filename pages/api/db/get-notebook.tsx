import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/db";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { Db, MongoClient, ObjectId } from "mongodb";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(500).json({ error: `A POST method is required!` });
    return;
  }

  if (req.method === "POST") {
    const data = req.body;
    const { notebookID } = data;

    if (!notebookID) {
      res.status(500).json({ error: `The notebook ID is missing!` });
      return;
    }

    let notebookObject = new ObjectId(notebookID);

    let session: Session | null;
    let userID: ObjectId;
    try {
      session = await getServerSession(req, res, authOptions);
      if (session && session.user) {
        userID = session.user._id;
      } else {
        res.status(500).json({ error: `User is not authenticated!` });
        return;
      }
    } catch (error: any) {
      res.status(500).json({ error: `${error}` });
      return;
    }

    let client: MongoClient;
    let db: Db;
    try {
      const dbConnection = await connectToDatabase();
      client = dbConnection.client;
      db = dbConnection.db;
    } catch (error: any) {
      res.status(500).json({ error: `${error}` });
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
    } catch (error) {
      res.status(500).json({
        error: `Could not load the notebooks!
      ${error}`,
      });
    } finally {
      client.close();
    }
  }
};

export default handler;
