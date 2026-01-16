import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/db";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { Db, MongoClient, ObjectId } from "mongodb";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const data = req.body;
    const { notebookID, notebookName, notebookCover, notebookUpdated } = data;

    if (!notebookID) {
      res.status(500).json({ error: `The notebook ID is missing!` });
      return;
    }
    if (!notebookName) {
      res.status(500).json({ error: `The notebook name is missing!` });
      return;
    }
    if (!notebookCover) {
      res.status(500).json({ error: `The notebook cover is missing!` });
      return;
    }

    const notebookId = new ObjectId(notebookID);

    let nbUpdated: Date;
    if (notebookUpdated === undefined) {
      nbUpdated = new Date();
    } else {
      nbUpdated = notebookUpdated;
    }

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
        }
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
        throw new Error("Failed to edit Notebook!");
      }
    } catch (error) {
      if (error instanceof Error) {
        res
          .status(400)
          .json({ error: error.message || "An unknown error occured!" });
      }
    } finally {
      client.close();
    }
  }
};

export default handler;
