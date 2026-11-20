import type { Request, Response } from "express";
import { connectToMongoDB } from "../../config/db.js";
import { toClient } from "../../config/serialize.js";

const db = await connectToMongoDB();
const categories = db.collection("categories");
const reviews = db.collection("reviews");

const failed = (res: Response, message: string, error: unknown) =>
  res.status(500).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : "Unknown error",
  });

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const items = await categories.find({}).sort({ order: 1 }).toArray();
    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: items.map(toClient),
    });
  } catch (error) {
    failed(res, "Error fetching categories", error);
  }
};

export const getReviews = async (_req: Request, res: Response) => {
  try {
    const items = await reviews.find({}).sort({ createdAt: -1 }).toArray();
    res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: items.map(toClient),
    });
  } catch (error) {
    failed(res, "Error fetching reviews", error);
  }
};
