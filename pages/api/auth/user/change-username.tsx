import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
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
  const newUsername = req.body.newUsername;

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
    res.status(404).json({ error: "User not found!" });
    client.close();
    return;
  }

  try {
    const result = await usersCollection.updateOne(
      { email: userEmail },
      { $set: { username: newUsername } }
    );
    client.close();
    if (result.modifiedCount > 0) {
      res.status(200).json({ message: "User Name updated!" });
    } else {
      res.status(400).json({ error: "Failed to update the User Name!" });
      return;
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        error:
          error.message || "An unknown error occured updating the User Name!",
      });
      return;
    }
  }
};

export default handler;
