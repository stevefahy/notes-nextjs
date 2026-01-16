import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { hashPassword, verifyPassword } from "../../../../lib/auth";
import { connectToDatabase } from "../../../../lib/db";
import { authOptions } from "../[...nextauth]";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user._id) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  const userID = session.user._id;

  if (req.method !== "PATCH") {
    return;
  }
  const userEmail = session.user.email;
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;

  let client;
  let db;
  try {
    const dbConnection = await connectToDatabase();
    client = dbConnection.client;
    db = dbConnection.db;
  } catch (error: any) {
    throw new Error(`Could not connect to the database!
        ${error}`);
  }

  const usersCollection = db.collection("users");

  const user = await usersCollection.findOne({ email: userEmail });

  if (!user) {
    res.status(404).json({ message: "User not found!" });
    client.close();
    return;
  }

  const currentPassword = user.password;

  const passwordsAreEqual = await verifyPassword(oldPassword, currentPassword);

  if (!passwordsAreEqual) {
    res.status(403).json({
      error: `The old and new passwords are the same. 
    Try a new password!`,
    });
    client.close();
    return;
  }

  const hashedPasswpord = await hashPassword(newPassword);

  const result = await usersCollection.updateOne(
    { email: userEmail },
    { $set: { password: hashedPasswpord } }
  );

  client.close();
  res.status(200).json({ message: "Password updated!" });
};

export default handler;
