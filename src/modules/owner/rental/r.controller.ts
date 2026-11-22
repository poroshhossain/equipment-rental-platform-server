import type { Request, Response } from "express";
import { connectToMongoDB } from "../../../config/db.js";
import { toClient } from "../../../config/serialize.js";

const db = connectToMongoDB();
const rentalCollection = db.collection("rentals");
const equipmentCollection = db.collection("equipments");

export const getAllRentals = async (req: Request, res: Response) => {
  try {
    const ownerEmail =
      typeof req.query.ownerEmail === "string" ? req.query.ownerEmail : "";

    let rentals = await rentalCollection.find({}).sort({ createdAt: -1 }).toArray();

    if (ownerEmail) {
      const owned = await equipmentCollection
        .find({ "owner.email": ownerEmail })
        .toArray();
      const ids = new Set(owned.map((item) => String(item._id)));
      rentals = rentals.filter((rental) =>
        ids.has(String(rental.equipmentId)),
      );
    }

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
