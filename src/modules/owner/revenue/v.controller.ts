import type { Request, Response } from "express";
import { connectToMongoDB } from "../../../config/db.js";

const db = await connectToMongoDB();
const rentalCollection = db.collection("rentals");

/** Paid bookings grouped into the last six calendar months. */
export const getRevenue = async (_req: Request, res: Response) => {
  try {
    const rentals = await rentalCollection
      .find({ paymentStatus: "paid" })
      .toArray();
    const now = new Date();

    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1),
      );

      return {
        key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`,
        month: date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
        amount: 0,
      };
    });

    for (const rental of rentals) {
      const createdAt = new Date(rental.createdAt);
      if (Number.isNaN(createdAt.getTime())) continue;

      const key = `${createdAt.getUTCFullYear()}-${createdAt.getUTCMonth()}`;
      const month = months.find((item) => item.key === key);
      if (month) {
        month.amount += Number(rental.bookingAmount) || 0;
      }
    }

    res.status(200).json({
      success: true,
      message: "Revenue fetched successfully",
      data: months.map(({ month, amount }) => ({ month, amount })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching revenue",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
