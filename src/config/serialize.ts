import { ObjectId, type Document, type Filter, type WithId } from "mongodb";

/** MongoDB uses _id; the front-end uses id. */
export function toClient(doc: WithId<Document> | null) {
  if (!doc) return null;

  const { _id, ...rest } = doc;
  return { ...rest, id: String(_id) };
}

/** Handles ObjectId values, string _id values and legacy string id fields. */
export const idFilter = (id: string) => {
  const byId = ObjectId.isValid(id)
    ? [{ _id: new ObjectId(id) }, { _id: id }, { id }]
    : [{ _id: id }, { id }];

  return { $or: byId } as Filter<Document>;
};
