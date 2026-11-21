import type { Request, Response } from "express";
import { connectToMongoDB } from "../../../config/db.js";
import { toClient } from "../../../config/serialize.js";

const db = await connectToMongoDB();
const profileCollection = db.collection("ownerProfiles");

// This demo has a single owner profile.
const PROFILE_KEY = "owner";

export const getOwnerProfile = async (_req: Request, res: Response) => {
  try {
    const profile = await profileCollection.findOne({ key: PROFILE_KEY });

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: toClient(profile),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const saveOwnerProfile = async (req: Request, res: Response) => {
  try {
    await profileCollection.updateOne(
      { key: PROFILE_KEY },
      {
        $set: req.body,
        $setOnInsert: {
          avatar: "",
          joinedAt: new Date().toISOString(),
          verified: false,
        },
      },
      { upsert: true },
    );
    const profile = await profileCollection.findOne({ key: PROFILE_KEY });

    res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      data: toClient(profile),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error saving profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
