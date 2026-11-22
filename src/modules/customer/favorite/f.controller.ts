import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { connectToMongoDB } from "../../../config/db.js";
import { toClient } from "../../../config/serialize.js";

const db = connectToMongoDB();
const favorites = db.collection("favorites");
const equipment = db.collection("equipments");

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

const failed = (res: Response, message: string, error: unknown) =>
  res.status(500).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : "Unknown error",
  });

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const userId = text(req.query.userId);
    if (!userId) {
      res.status(400).json({ success: false, message: "userId is required" });
      return;
    }

    const saved = await favorites.find({ userId }).toArray();
    const ids = saved.map((item) => text(item.equipmentId));
    const objectIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));
    const items = await equipment
      .find({ $or: [{ _id: { $in: objectIds } }, { id: { $in: ids } }] })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Favorites fetched successfully",
      data: items.map(toClient),
    });
  } catch (error) {
    failed(res, "Error fetching favorites", error);
  }
};

export const addFavorite = async (req: Request, res: Response) => {
  try {
    const { userId, equipmentId } = req.body;
    if (!userId || !equipmentId) {
      res.status(400).json({
        success: false,
        message: "userId and equipmentId are required",
      });
      return;
    }

    await favorites.updateOne(
      { userId, equipmentId },
      { $set: { userId, equipmentId, createdAt: new Date().toISOString() } },
      { upsert: true },
    );

    res.status(200).json({
      success: true,
      message: "Added to favorites",
      data: { equipmentId },
    });
  } catch (error) {
    failed(res, "Error adding favorite", error);
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  try {
    await favorites.deleteOne({
      userId: text(req.query.userId),
      equipmentId: text(req.params.equipmentId),
    });

    res.status(200).json({
      success: true,
      message: "Removed from favorites",
      data: { equipmentId: text(req.params.equipmentId) },
    });
  } catch (error) {
    failed(res, "Error removing favorite", error);
  }
};
