import { NextApiRequest, NextApiResponse } from "next";
import { hashPassword } from "../../../lib/auth";
import { connectToDatabase } from "../../../lib/db";
import { MongoClient, Db, ObjectId } from "mongodb";
import APPLICATION_CONSTANTS from "../../../application_constants/applicationConstants";
import WELCOME_NOTE from "./../../../application_constants/welcome_markdown.md";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return;
  }
  const data = req.body;
  const { email, password, username } = data;

  if (!email || !email.includes("@")) {
    res.status(422).json({
      error: APPLICATION_CONSTANTS.SIGNUP_INVALID_EMAIL,
    });
    return;
  }

  if (!password || password.trim().length < 7) {
    res.status(422).json({
      error: APPLICATION_CONSTANTS.SIGNUP_INVALID_PASSWORD,
    });
    return;
  }

  if (!username || username.trim().length < 2) {
    res.status(422).json({
      error: APPLICATION_CONSTANTS.SIGNUP_INVALID_USERNAME,
    });
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

  let existingUser = null;
  try {
    existingUser = await db.collection("users").findOne({ email: email });
  } catch (error: any) {
    res.status(500).json({ error: `${error}` });
    return;
  }

  // email already exists
  if (existingUser !== null) {
    res
      .status(422)
      .json({ error: APPLICATION_CONSTANTS.SIGNUP_EMAIL_REGISTERED });
    client.close();
    return;
  }

  const hashedPassword = await hashPassword(password);

  let user_result;
  try {
    user_result = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      username,
    });
  } catch (error: any) {
    res.status(422).json({ error: APPLICATION_CONSTANTS.CREATE_USER_ERROR });
    client.close();
    return;
  }

  if (!user_result.acknowledged) {
    res.status(422).json({
      error: APPLICATION_CONSTANTS.GENERAL_ERROR,
    });
    client.close();
    return;
  }

  let userID: ObjectId;
  let notebookID: ObjectId;
  try {
    userID = user_result.insertedId;
    notebookID = new ObjectId();

    const initialnotebook = await db.collection("notebooks").insertOne({
      user: userID,
      notebooks: [
        {
          _id: notebookID,
          notebook_name: "Welcome",
          notebook_cover: "default",
        },
      ],
    });
  } catch (error: any) {
    res
      .status(422)
      .json({ error: APPLICATION_CONSTANTS.CREATE_NOTEBOOK_ERROR });
    client.close();
    return;
  }

  try {
    const welcome_note = await db
      .collection("notes")
      .insertOne({
        notebook: notebookID,
        user: userID,
        note: WELCOME_NOTE,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .then(
        (result) => {
          if (result === null) {
            res.status(422).json({ error: `Could not create the note!` });
            client.close();
            return;
          } else {
            res.status(201).json({
              message: "Created welcome note!",
              data: { notebookID: notebookID, noteID: result.insertedId },
            });
          }
        },
        (err) => {
          if (err) {
            res.status(422).json({ error: `Could not create the note!` });
            client.close();
            return;
          }
        }
      );
  } catch (error: any) {
    res.status(422).json({ error: APPLICATION_CONSTANTS.CREATE_NOTE_ERROR });
    client.close();
    return;
  }
};

export default handler;
