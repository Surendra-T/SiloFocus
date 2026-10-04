import { MongoClient, Db, Collection } from "mongodb";
import { StudySession, COLLECTIONS } from "./models";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please add your Mongo URI to .env.local");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 });
      global._mongoClientPromise = client.connect().catch(err => {
        global._mongoClientPromise = undefined;
        throw err;
      });
    }
    clientPromise = global._mongoClientPromise;
  } else {
    const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 });
    clientPromise = client.connect();
  }
  
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB || "silofocus";
  return client.db(dbName);
}

export async function getSessionsCollection(): Promise<Collection<StudySession>> {
  const db = await getDb();
  const collection = db.collection<StudySession>(COLLECTIONS.sessions);
  // Ensure basic index on first access (in production, should be done explicitly in migrations)
  await collection.createIndex({ subject: 1, completedAt: -1 }).catch(() => {});
  return collection;
}
