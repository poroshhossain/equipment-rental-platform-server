import type { Request, Response } from "express";
import { connectToMongoDB } from "../../../config/db.js";
import { toClient } from "../../../config/serialize.js";

const db = await connectToMongoDB();
const rentalCollection = db.collection("rentals");

export const getAllRentals = async (_req: Request, res: Response) => {
  try {
    const rentals = await rentalCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Rentals fetched successfully",
      data: rentals.map(toClient),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching rentals",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
