import { Db, MongoClient, ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/db";

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
    const { notes } = data;

    if (!notes) {
      res.status(500).json({ error: `The notes are missing!` });
      return;
    }

    let notesArray = [];
    for (let i = 0, length = notes.length; i < length; i++) {
      notesArray.push(new ObjectId(notes[i]));
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

    const deleteNotes = (notes: ObjectId[]) => {
      return new Promise(async (resolve, reject) => {
        try {
          db.collection("notes")
            .deleteMany({ _id: { $in: notes } })
            .then(
              (res) => {
                if (res === null) {
                  reject(`Could not delete the notes!`);
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
      const result = await deleteNotes(notesArray);
      res.status(200).json({ message: "success", result: result });
    } catch (error) {
      res.status(500).json({
        error: `Could not delete the notes!
        ${error}`,
      });
    } finally {
      client.close();
    }
  }
};

export default handler;
