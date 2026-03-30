import { NextApiRequest, NextApiResponse } from "next";
import { hashPassword } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { Db, ObjectId } from "mongodb";
import APPLICATION_CONSTANTS from "../../../application_constants/applicationConstants";
import WELCOME_NOTE from "./../../../public/assets/markdown/welcome_markdown.md";
import { respondMethodNotAllowedPost } from "../../../lib/apiRouteHelpers";

const AC = APPLICATION_CONSTANTS;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    respondMethodNotAllowedPost(res);
    return;
  }

  const data = req.body;
  const { email, password, username } = data;

  if (!email || !email.includes("@")) {
    res.status(422).json({
      error: AC.SIGNUP_INVALID_EMAIL,
    });
    return;
  }

  if (!password || password.trim().length < 7) {
    res.status(422).json({
      error: AC.SIGNUP_INVALID_PASSWORD,
    });
    return;
  }

  if (!username || username.trim().length < 2) {
    res.status(422).json({
      error: AC.SIGNUP_INVALID_USERNAME,
    });
    return;
  }

  let db: Db;
  try {
    db = await getDb();
  } catch {
    res.status(500).json({ error: AC.ERROR_SERVER });
    return;
  }

  let existingUser = null;
  try {
    existingUser = await db.collection("users").findOne({ email: email });
  } catch {
    res.status(500).json({ error: AC.ERROR_SERVER });
    return;
  }

  if (existingUser !== null) {
    res
      .status(422)
      .json({ error: AC.SIGNUP_EMAIL_REGISTERED });
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
  } catch {
    res.status(422).json({ error: AC.CREATE_USER_ERROR });
    return;
  }

  if (!user_result.acknowledged) {
    res.status(422).json({
      error: AC.GENERAL_ERROR,
    });
    return;
  }

  let userID: ObjectId;
  let notebookID: ObjectId;
  try {
    userID = user_result.insertedId;
    notebookID = new ObjectId();

    await db.collection("notebooks").insertOne({
      user: userID,
      notebooks: [
        {
          _id: notebookID,
          notebook_name: "Welcome",
          notebook_cover: "default",
        },
      ],
    });
  } catch {
    res
      .status(422)
      .json({ error: AC.CREATE_NOTEBOOK_ERROR });
    return;
  }

  try {
    const welcomeResult = await db.collection("notes").insertOne({
      notebook: notebookID,
      user: userID,
      note: WELCOME_NOTE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (!welcomeResult.acknowledged) {
      res.status(422).json({ error: AC.CREATE_NOTE_ERROR });
      return;
    }
    res.status(201).json({
      message: "Created welcome note!",
      data: { notebookID: notebookID, noteID: welcomeResult.insertedId },
    });
  } catch {
    res.status(422).json({ error: AC.CREATE_NOTE_ERROR });
  }
};

export default handler;
