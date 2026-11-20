import { ObjectId, type Document, type WithId } from "mongodb";

/** MongoDB uses _id; the front-end uses id. */
export function toClient(doc: WithId<Document> | null) {
  if (!doc) return null;

  const { _id, ...rest } = doc;
  return { ...rest, id: String(_id) };
}

/** New records use ObjectId; older seeded records keep a string id. */
export const idFilter = (id: string) =>
  ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
