import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/db";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { Db, MongoClient, ObjectId } from "mongodb";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const data = req.body;
    const { notebookID, notebookUpdated } = data;

    if (!notebookID) {
      res.status(500).json({ error: `The notebook ID is missing!` });
      return;
    }

    let nbUpated: Date;
    if (notebookUpdated === undefined) {
      nbUpated = new Date();
    } else {
      nbUpated = notebookUpdated;
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

    const editDateNotebook = (
      userID: ObjectId,
      nbID: ObjectId,
      nbUpated: Date
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          if (userID === null || nbID === null || nbUpated === null) {
            throw new Error("Failed to update the Notebook Date!");
          }
          const result = await db.collection("notebooks").updateOne(
            {
              user: userID,
              notebooks: {
                $elemMatch: {
                  _id: nbID,
                },
              },
            },
            {
              $set: {
                "notebooks.$.updatedAt": nbUpated,
              },
            }
          );
          if (result.modifiedCount > 0 || result.matchedCount > 0) {
            const edited_notebook = {
              _id: notebookID,
              notebookUpdated,
            };
            res.status(200).json({
              message: "Notebook edited",
              acknowledged: true,
              edited: edited_notebook,
            });
          } else {
            res.status(400).json({ error: "An unknown error occured!!!" });
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
      });
    };

    try {
      if (userID === null || notebookID === null || nbUpated === null) {
        throw new Error("Failed to update the Notebook Date!");
      }
      const uID = new ObjectId(userID);
      const nbID = new ObjectId(notebookID);
      const result = await editDateNotebook(uID, nbID, nbUpated);
    } catch (err: any) {
      res.status(500).json({
        error: `Could not update the notebook date!\n${err.message}`,
      });
      throw new Error("Failed to update the Notebook Date!");
    } finally {
      client.close();
    }
  }
};

export default handler;
