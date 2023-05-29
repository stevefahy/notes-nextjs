import { Db, MongoClient } from "mongodb";

const connectionString = `mongodb://${process.env.mongodb_username}:${process.env.mongodb_password}@${process.env.mongodb_url}`;
const connectionDatabase = `${process.env.mongodb_database}`;

export const connectToDatabase = async () => {
  let client: MongoClient;
  let db: Db;
  try {
    client = await MongoClient.connect(connectionString);
  } catch (error) {
    throw new Error(`Could not connect to the database client!
     ${error}`);
  }

  try {
    db = client.db(connectionDatabase);
  } catch (error) {
    throw new Error(`Could not connect to the database collection!
     ${error}`);
  }

  return { client, db };
};
