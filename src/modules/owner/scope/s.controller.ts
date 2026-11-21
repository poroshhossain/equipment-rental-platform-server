import type { Request, Response } from "express";
import { connectToMongoDB } from "../../../config/db.js";
import { toClient } from "../../../config/serialize.js";

const db = await connectToMongoDB();
const equipment = db.collection("equipments");
const bookings = db.collection("bookings");

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

const failed = (res: Response, message: string, error: unknown) =>
  res.status(500).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : "Unknown error",
  });

const months = () =>
  Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - 5 + index, 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: date.toLocaleString("en-US", { month: "short" }),
      amount: 0,
    };
  });

/** Only listings whose saved owner email matches the signed-in owner. */
export const getOwnerEquipment = async (req: Request, res: Response) => {
  try {
    const email = text(req.query.ownerEmail);
    const items = email
      ? await equipment.find({ "owner.email": email }).toArray()
      : await equipment.find({}).toArray();

    res.status(200).json({
      success: true,
      message: "Owner equipment fetched successfully",
      data: items.map(toClient),
    });
  } catch (error) {
    failed(res, "Error fetching owner equipment", error);
  }
};

export const getOwnerAnalytics = async (req: Request, res: Response) => {
  try {
    const email = text(req.query.ownerEmail);
    const items = email
      ? await equipment.find({ "owner.email": email }).toArray()
      : await equipment.find({}).toArray();
    const ids = new Set(items.map((item) => String(item._id)));
    const records = (await bookings.find({}).toArray()).filter((booking) =>
      ids.has(text(booking.equipmentId)),
    );
    const monthly = months();

    records.forEach((booking) => {
      const date = new Date(text(booking.createdAt));
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = monthly.find((item) => item.key === key);
      if (bucket) bucket.amount += Number(booking.totalAmount) || 0;
    });

    res.status(200).json({
      success: true,
      message: "Owner analytics fetched successfully",
      data: {
        totalEquipment: items.length,
        completedRentals: records.filter(
          (booking) => text(booking.bookingStatus) === "completed",
        ).length,
        totalEarnings: records
          .filter((booking) => text(booking.paymentStatus) === "paid")
          .reduce((sum, booking) => sum + Number(booking.totalAmount), 0),
        monthlyEarnings: monthly.map(({ month, amount }) => ({ month, amount })),
      },
    });
  } catch (error) {
    failed(res, "Error fetching owner analytics", error);
  }
};
