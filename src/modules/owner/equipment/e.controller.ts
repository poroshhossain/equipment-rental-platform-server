import type { Request, Response } from "express";
import { connectToMongoDB } from "../../../config/db.js";
import { idFilter, toClient } from "../../../config/serialize.js";

const db = await connectToMongoDB();
const equipmentCollection = db.collection("equipments");

const fail = (res: Response, message: string, error: unknown) =>
  res.status(500).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : "Unknown error",
  });

const queryValue = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

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

export const getAllEquipment = async (req: Request, res: Response) => {
  try {
    const status = queryValue(req.query.status);
    const sort = queryValue(req.query.sort);
    const requestedLimit = Number(queryValue(req.query.limit));
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : 0;

    let cursor = equipmentCollection.find(status ? { status } : {});
    if (sort === "popular") cursor = cursor.sort({ popularity: -1, createdAt: -1 });
    if (sort === "recent") cursor = cursor.sort({ createdAt: -1 });
    if (limit) cursor = cursor.limit(limit);

    const equipments = await cursor.toArray();

    res.status(200).json({
      success: true,
      message: "All equipment retrieved successfully",
      data: equipments.map(toClient),
    });
  } catch (error) {
    fail(res, "Error occurred while retrieving equipment", error);
  }
};

export const getEquipmentById = async (req: Request, res: Response) => {
  try {
    const equipment = await equipmentCollection.findOne(
      idFilter(String(req.params.id ?? "")),
    );

    if (!equipment) {
      res.status(404).json({ success: false, message: "Equipment not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Equipment retrieved successfully",
      data: toClient(equipment),
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
