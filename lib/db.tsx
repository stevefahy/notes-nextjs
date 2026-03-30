import { Db, MongoClient } from "mongodb";

const connectionString = `mongodb://${process.env.mongodb_username}:${process.env.mongodb_password}@${process.env.mongodb_url}`;
const connectionDatabase = `${process.env.mongodb_database}`;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = MongoClient.connect(connectionString);
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = MongoClient.connect(connectionString);
}

export const getDb = async (): Promise<Db> => {
  const client = await clientPromise;
  return client.db(connectionDatabase);
};
