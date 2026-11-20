import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { connectToMongoDB } from "../../../config/db.js";
import { toClient } from "../../../config/serialize.js";

const db = await connectToMongoDB();
const equipmentCollection = db.collection("equipments");

const fail = (res: Response, message: string, error: unknown) =>
  res.status(500).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : "Unknown error",
  });

const idFilter = (id: string) =>
  ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };

export const postEquipment = async (req: Request, res: Response) => {
  try {
    const result = await equipmentCollection.insertOne({
      ...req.body,
      totalQuantity: req.body.totalQuantity ?? req.body.availableQuantity,
      status: req.body.status ?? "pending",
      createdAt: req.body.createdAt ?? new Date().toISOString(),
    });
    const equipment = await equipmentCollection.findOne({
      _id: result.insertedId,
    });

    res.status(201).json({
      success: true,
      message: "Equipment posted successfully",
      data: toClient(equipment),
    });
  } catch (error) {
    fail(res, "Error occurred while posting equipment", error);
  }
};

export const getAllEquipment = async (_req: Request, res: Response) => {
  try {
    const equipments = await equipmentCollection.find({}).toArray();

    res.status(200).json({
      success: true,
      message: "All equipment retrieved successfully",
      data: equipments.map(toClient),
    });
  } catch (error) {
    fail(res, "Error occurred while retrieving equipment", error);
  }
};

export const updateEquipment = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? "");
    const equipment = await equipmentCollection.findOneAndUpdate(
      idFilter(id),
      { $set: req.body },
      { returnDocument: "after" },
    );

    if (!equipment) {
      res.status(404).json({ success: false, message: "Equipment not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Equipment updated successfully",
      data: toClient(equipment),
    });
  } catch (error) {
    fail(res, "Error occurred while updating equipment", error);
  }
};

export const deleteEquipment = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? "");
    const result = await equipmentCollection.deleteOne(idFilter(id));

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: "Equipment not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Equipment deleted successfully",
      data: { id },
    });
  } catch (error) {
    fail(res, "Error occurred while deleting equipment", error);
  }
};
