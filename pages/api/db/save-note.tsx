import { Db, MongoClient, ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/db";
import { NoteSaved } from "../../../types";

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
    const { notebookID, noteID, note } = data;
    if (!note || note.length === 0) {
      res.status(500).json({ error: `The note is empty!` });
      return;
    }
    if (!notebookID) {
      res.status(500).json({ error: `The notebook ID is missing!` });
      return;
    }
    if (!noteID) {
      res.status(500).json({ error: `The note ID is missing!` });
      return;
    }

    const nbID = new ObjectId(notebookID);
    const nID = new ObjectId(noteID);
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

    const updateNotebook = (uID: ObjectId, nbID: ObjectId) => {
      return new Promise(async (resolve, reject) => {
        try {
          const notebookId = new ObjectId(nbID);
          const result = db
            .collection("notebooks")
            .updateOne(
              {
                user: uID,
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
              }
            )
            .then(
              (res) => {
                if (res === null) {
                  reject(`Could not update the notebook!`);
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
          if (error instanceof Error) {
            res
              .status(400)
              .json({ error: error.message || "An unknown error occured!" });
          }
          return;
        }
      });
    };

    const saveNote = (
      uID: ObjectId,
      nbID: ObjectId,
      nID: ObjectId,
      n: string
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          db.collection("notes")
            .updateOne(
              {
                _id: nID,
                user: uID,
                notebook: nbID,
              },
              {
                $set: {
                  note: n,
                  updatedAt: new Date(),
                },
              }
            )
            .then(
              (res) => {
                if (res === null) {
                  reject(`Could not save the note!`);
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
      const result = (await saveNote(uID, nbID, nID, note)) as NoteSaved;
      const notebookResult = (await updateNotebook(uID, nbID)) as NoteSaved;
      if (result.notes.modifiedCount === 0 && result.notes.matchedCount === 0) {
        throw new Error("No Notes updated!");
      }
      res.status(200).json({ message: "success", result: result });
    } catch (err: any) {
      res.status(500).json({
        error: `Could not save the note!\n${err.message}`,
      });
    } finally {
      client.close();
    }
  }
};

export default handler;
