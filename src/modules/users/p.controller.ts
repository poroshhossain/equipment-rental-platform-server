import type { Request, Response } from "express";
import { connectToMongoDB } from "../../config/db.js";
import { idFilter } from "../../config/serialize.js";

const db = connectToMongoDB();
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
    const user = saved ? null : await users.findOne(idFilter(userId));

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

    await users.updateOne(idFilter(text(userId)), {
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
