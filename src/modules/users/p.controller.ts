import type { Request, Response } from "express";
import type { Document, Filter } from "mongodb";
import { connectToMongoDB } from "../../config/db.js";

const db = await connectToMongoDB();
const profiles = db.collection("userProfiles");
const users = db.collection("user");

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

const failed = (res: Response, message: string, error: unknown) =>
  res.status(500).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : "Unknown error",
  });

// better-auth stores ids as strings in the _id field.
const userFilter = (userId: string) =>
  ({ $or: [{ _id: userId }, { id: userId }] }) as Filter<Document>;

const toProfile = (doc: Record<string, unknown> | null, userId: string) =>
  doc
    ? {
        userId,
        name: text(doc.name),
        email: text(doc.email),
        image: text(doc.image),
        phone: text(doc.phone),
        address: text(doc.address),
      }
    : null;

// Falls back to the better-auth user so the form starts with real account data.
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = text(req.query.userId);
    if (!userId) {
      res.status(400).json({ success: false, message: "userId is required" });
      return;
    }

    const saved = await profiles.findOne({ userId });
    const user = saved ? null : await users.findOne(userFilter(userId));

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: toProfile(saved ?? user, userId),
    });
  } catch (error) {
    failed(res, "Error fetching profile", error);
  }
};

export const saveUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId, name, email, image, phone, address } = req.body;
    if (!userId || !name || !email) {
      res
        .status(400)
        .json({ success: false, message: "userId, name and email are required" });
      return;
    }

    await users.updateOne(userFilter(text(userId)), {
      $set: { name: text(name), email: text(email), image: text(image) },
    });

    await profiles.updateOne(
      { userId: text(userId) },
      {
        $set: {
          name: text(name),
          email: text(email),
          image: text(image),
          phone: text(phone),
          address: text(address),
        },
      },
      { upsert: true },
    );

    const profile = await profiles.findOne({ userId: text(userId) });

    res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      data: toProfile(profile, text(userId)),
    });
  } catch (error) {
    failed(res, "Error saving profile", error);
  }
};
