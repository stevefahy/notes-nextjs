import { Db, MongoClient, ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../../lib/db";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(500).json({ error: `A POST method is required!` });
    return;
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

  if (req.method === "POST") {
    const data = req.body;
    const { notebookID } = data;
    if (!notebookID) {
      res.status(500).json({ error: `The notebook ID is missing!` });
      return;
    }

    const nID = new ObjectId(notebookID);
    const uID = new ObjectId(userID);

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

    const deleteNote = (notebookID: ObjectId, userID: ObjectId) => {
      return new Promise(async (resolve, reject) => {
        try {
          db.collection("notebooks")
            .updateOne(
              {
                user: userID,
                notebooks: {
                  $elemMatch: {
                    _id: notebookID,
                  },
                },
              },
              {
                $pull: {
                  notebooks: {
                    _id: notebookID,
                  },
                },
              }
            )
            .then(
              (res) => {
                if (res === null) {
                  reject(`Could not delete the note!`);
                } else {
                  resolve({ notes: res });
                }
              },
              (err) => {
                if (err) {
                  reject(err);
                }
              }
            );
        } catch (error) {
          reject(error);
        }
      });
    };

    try {
      // const userID = session?.user?._id;
      // const nID = new ObjectId(notebookID);
      // const uID = new ObjectId(userID);
      const result = await deleteNote(nID, uID);
      res.status(200).json({ message: "success", result: result });
    } catch (error) {
      res.status(500).json({
        error: `Could not delete the Notebook!
        ${error}`,
      });
    } finally {
      client.close();
    }
  }
};

export default handler;
