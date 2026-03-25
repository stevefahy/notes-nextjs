import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import APPLICATION_CONSTANTS from "../../../../application_constants/applicationConstants";
import { hashPassword, verifyPassword } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
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
  const oldPassword =
    typeof req.body?.oldPassword === "string" ? req.body.oldPassword : "";
  const newPassword =
    typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: AC.CHANGE_PASS_ERROR });
  }

  if (newPassword === oldPassword) {
    return res.status(400).json({ error: AC.CHANGE_PASS_UNIQUE });
  }

  if (newPassword.length < AC.PASSWORD_MIN) {
    return res.status(400).json({ error: AC.CHANGE_PASS_TOO_FEW });
  }
  if (newPassword.length > AC.PASSWORD_MAX) {
    return res.status(400).json({ error: AC.CHANGE_PASS_TOO_MANY });
  }

  let db;
  try {
    db = await getDb();
  } catch {
    return res.status(500).json({ error: AC.ERROR_SERVER });
  }

  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne({ email: userEmail });

  if (!user?.password) {
    return res.status(404).json({ error: AC.ERROR_NOT_FOUND });
  }

  const currentPasswordValid = await verifyPassword(oldPassword, user.password);

  if (!currentPasswordValid) {
    return res.status(403).json({ error: AC.CHANGE_PASS_INCORRECT_CURRENT });
  }

  const hashedPassword = await hashPassword(newPassword);

  await usersCollection.updateOne(
    { email: userEmail },
    { $set: { password: hashedPassword } },
  );

  return res.status(200).json({ message: "Password updated!" });
};

export default handler;
