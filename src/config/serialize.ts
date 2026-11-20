import type { Document, WithId } from "mongodb";

/** MongoDB uses _id; the front-end uses id. */
export function toClient(doc: WithId<Document> | null) {
  if (!doc) return null;

  const { _id, ...rest } = doc;
  return { ...rest, id: String(_id) };
}
