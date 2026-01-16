import { Db, MongoClient, ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/db";
import { Notebook } from "../../../types";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(500).json({ error: `A POST method is required!` });
    return;
  }

  if (req.method === "POST") {
    const data = req.body;
    const { notes, notebookID, latestUpdatedNote } = data;

    if (!notes) {
      res.status(500).json({ error: `The notes are missing!` });
      return;
    }
    if (!notebookID) {
      res.status(500).json({ error: `The notebook ID is missing!` });
      return;
    }
    if (!latestUpdatedNote) {
      res.status(500).json({ error: `The latest updated note is missing!` });
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

    const uID = new ObjectId(userID);
    const nbID = new ObjectId(notebookID);

    let client: MongoClient;
    let db: Db;

    let objectArray: ObjectId[] = [];
    for (let i = 0, length = notes.length; i < length; i++) {
      objectArray.push(new ObjectId(notes[i]));
    }

    const new_notebook: ObjectId = new ObjectId(notebookID);

    try {
      const dbConnection = await connectToDatabase();
      client = dbConnection.client;
      db = dbConnection.db;
    } catch (error: any) {
      res.status(500).json({ error: `${error}` });
      return;
    }

    const getNotebook = (uID: ObjectId, nbId: ObjectId) => {
      return new Promise(async (resolve, reject) => {
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
                  "notebooks._id": nbId,
                },
              },
              {
                $replaceRoot: {
                  newRoot: "$notebooks",
                },
              },
            ])
            .toArray();
          resolve(result[0]);
        } catch (error) {
          reject(`Could not load the notebook! ${error}`);
        }
      });
    };

    const updateNotebook = (uID: ObjectId, nbID: ObjectId, date: Date) => {
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
                    _id: nbID,
                  },
                },
              },
              {
                $set: {
                  "notebooks.$.updatedAt": date,
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
            reject(`Could not update the notebook! ${error}`);
          }
          return;
        }
      });
    };

    const moveNotes = (notes: ObjectId[]) => {
      const bulk_array = notes.map((note) => {
        return {
          updateOne: {
            filter: { _id: note, user: userID },
            update: { $set: { notebook: new_notebook } },
          },
        };
      });
      return new Promise(async (resolve, reject) => {
        try {
          const bulk = await db
            .collection("notes")
            .bulkWrite(bulk_array)
            .then(
              (res) => {
                if (res === null) {
                  reject(`Could not move the notes!`);
                } else if (!res.ok) {
                  reject(`Could not move the notes!`);
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
      const notebook = (await getNotebook(userID, new_notebook)) as Notebook;
      const result = await moveNotes(objectArray);

      if (notebook.updatedAt) {
        if (new Date(notebook.updatedAt) < new Date(latestUpdatedNote)) {
          try {
            const notebookResult = await updateNotebook(
              uID,
              nbID,
              new Date(latestUpdatedNote)
            );
          } catch (err: any) {
            throw new Error("Could not update the Notebook!");
          }
        }
      }
      res.status(200).json({ message: "success", result: result });
    } catch (error) {
      res.status(500).json({
        error: `Could not move the notes!
        ${error}`,
      });
    } finally {
      client.close();
    }
  }
};

export default handler;
