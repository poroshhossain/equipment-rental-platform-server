import { MongoClient, type Db } from "mongodb";

/**
 * Vercel evaluates modules during the build, when environment variables are
 * not guaranteed to be present. Creating a MongoClient is cheap and does NOT
 * open a socket — the driver connects lazily on the first query — so this
 * module must never throw or await at import time.
 */
const uri = process.env.DB_URL;

if (!uri) {
  console.warn(
    "DB_URL is not defined. Database requests will fail until it is configured.",
  );
}

const client = new MongoClient(uri ?? "mongodb://127.0.0.1:27017");

/** Shared database handle. The connection itself is opened on first use. */
export function connectToMongoDB(): Db {
  return client.db("equipment-rental-platform");
}
