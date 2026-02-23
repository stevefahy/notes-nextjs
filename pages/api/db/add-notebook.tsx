import { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../../lib/db";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { Db, ObjectId } from "mongodb";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const data = req.body;
    const { notebookName, notebookCover } = data;

    if (!notebookName) {
      res.status(500).json({ error: `The notebook name is missing!` });
      return;
    }
    if (!notebookCover) {
      res.status(500).json({ error: `The notebook cover is missing!` });
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

    let db: Db;
    try {
      db = await getDb();
    } catch (error: any) {
      res.status(500).json({ error: `${error}` });
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
        }
      );

      if (result.modifiedCount > 0) {
        let get_updated;
        try {
          get_updated = await db
            .collection("notebooks")
            .findOne({ user: userID });
          if (!get_updated || get_updated === null) {
            throw new Error("Failed to create the Notebook!");
          }
        } catch (error) {
          if (error instanceof Error) {
            res
              .status(400)
              .json({ error: error.message || "An unknown error occured!" });
            return;
          }
        }
        const added_notebook =
          get_updated?.notebooks[get_updated.notebooks.length - 1];
        res.status(200).json({
          message: "Notebook created",
          acknowledged: true,
          added: added_notebook,
        });
      } else {
        throw new Error("Failed to add Notebook!");
      }
    } catch (error) {
      if (error instanceof Error) {
        res
          .status(400)
          .json({ error: error.message || "An unknown error occured!" });
      }
      return;
    }
  }
};

export default handler;
