
import { MongoClient, Db } from "mongodb";

const uri = process.env.DB_URL as string;

if (!uri) {
  throw new Error("DB_URL is not defined in environment variables");
}

const client = new MongoClient(uri);

let db: Db;

export async function connectToMongoDB(): Promise<Db> {
  try {
    if (db) {
      return db;
    }

    await client.connect();

    db = client.db("equipment-rental-platform");

    console.log("MongoDB connected successfully!");

    return db;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}
