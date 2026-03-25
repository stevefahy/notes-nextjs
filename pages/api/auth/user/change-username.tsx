import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import APPLICATION_CONSTANTS from "../../../../application_constants/applicationConstants";
import { getDb } from "../../../../lib/db";
import { normalizeErrorToString } from "../../../../lib/errorMessageMap";
import { authOptions } from "../[...nextauth]";

const AC = APPLICATION_CONSTANTS;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?._id || !session.user.email) {
    return res.status(401).json({ error: AC.UNAUTHORIZED });
  }

  const userEmail = session.user.email;
  const raw = req.body?.newUsername;
  const newUsername = typeof raw === "string" ? raw.trim() : "";

  if (!newUsername) {
    return res.status(400).json({ error: AC.CHANGE_USER_GENERAL });
  }
  if (newUsername.length < AC.USERNAME_MIN) {
    return res.status(400).json({ error: AC.CHANGE_USER_TOO_FEW });
  }
  if (newUsername.length > AC.USERNAME_MAX) {
    return res.status(400).json({ error: AC.CHANGE_USER_TOO_MANY });
  }

  let db;
  try {
    db = await getDb();
  } catch {
    return res.status(500).json({ error: AC.ERROR_SERVER });
  }

  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne({ email: userEmail });

  if (!user) {
    return res.status(404).json({ error: AC.ERROR_NOT_FOUND });
  }

  if (user.username === newUsername) {
    return res.status(200).json({ message: "User Name updated!" });
  }

  const taken = await usersCollection.findOne({
    username: newUsername,
    email: { $ne: userEmail },
  });
  if (taken) {
    return res.status(400).json({ error: AC.CHANGE_USER_UNIQUE });
  }

  try {
    const result = await usersCollection.updateOne(
      { email: userEmail },
      { $set: { username: newUsername } },
    );
    if (result.modifiedCount > 0) {
      return res.status(200).json({ message: "User Name updated!" });
    }
    return res.status(400).json({ error: AC.CHANGE_USER_ERROR });
  } catch (error: unknown) {
    const code = (error as { code?: number })?.code;
    if (code === 11000) {
      return res.status(400).json({ error: AC.CHANGE_USER_UNIQUE });
    }
    return res.status(400).json({
      error: normalizeErrorToString(error, AC.CHANGE_USER_ERROR),
    });
  }
};

export default handler;
