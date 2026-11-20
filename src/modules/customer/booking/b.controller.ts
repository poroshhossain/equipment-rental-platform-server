import type { Request, Response } from "express";
import { connectToMongoDB } from "../../../config/db.js";
import { idFilter, toClient } from "../../../config/serialize.js";

const db = await connectToMongoDB();
const bookings = db.collection("bookings");
const rentals = db.collection("rentals");
const equipment = db.collection("equipments");

const DAYS_PER_UNIT = { daily: 1, weekly: 7, monthly: 30 } as const;
const DAY_MS = 24 * 60 * 60 * 1000;

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

const failed = (res: Response, message: string, error: unknown) =>
  res.status(500).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : "Unknown error",
  });

export const createBooking = async (req: Request, res: Response) => {
  try {
    const {
      equipmentId,
      userId,
      startDate,
      endDate,
      quantity,
      contactNumber,
      deliveryAddress,
      notes,
      customer,
    } = req.body;

    const amount = Number(quantity);
    if (
      !equipmentId ||
      !userId ||
      !startDate ||
      !endDate ||
      !contactNumber ||
      !deliveryAddress ||
      !Number.isInteger(amount) ||
      amount < 1
    ) {
      res.status(400).json({ success: false, message: "Please fill all required fields." });
      return;
    }

    const item = await equipment.findOne(idFilter(text(equipmentId)));
    if (!item) {
      res.status(404).json({ success: false, message: "Equipment not found" });
      return;
    }
    if (amount > item.availableQuantity) {
      res.status(409).json({
        success: false,
        message: `Only ${item.availableQuantity} unit(s) available.`,
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      res.status(400).json({ success: false, message: "Invalid rental dates." });
      return;
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / DAY_MS);
    const rentalType =
      text(item.rentalType) in DAYS_PER_UNIT ? text(item.rentalType) : "daily";
    const units = Math.ceil(
      days / DAYS_PER_UNIT[rentalType as keyof typeof DAYS_PER_UNIT],
    );
    const totalAmount = units * Number(item.rentalPrice) * amount;

    const now = new Date().toISOString();
    const booking = {
      equipmentId: text(equipmentId),
      equipmentName: item.name,
      equipmentImage: item.image,
      userId: text(userId),
      customer: customer ?? {},
      startDate: text(startDate),
      endDate: text(endDate),
      quantity: amount,
      rentalType,
      days,
      totalAmount,
      contactNumber: text(contactNumber),
      deliveryAddress: text(deliveryAddress),
      notes: text(notes),
      bookingStatus: "pending",
      paymentStatus: "pending",
      createdAt: now,
    };

    const result = await bookings.insertOne(booking);

    // Owners see this booking in their rental table.
    await rentals.insertOne({
      customer: {
        name: text(customer?.name) || "Customer",
        email: text(customer?.email),
        phone: text(contactNumber),
      },
      equipmentId: text(equipmentId),
      equipmentName: item.name,
      equipmentCategory: item.category,
      equipmentImage: item.image,
      startDate: text(startDate),
      endDate: text(endDate),
      rentalType,
      quantity: amount,
      bookingAmount: totalAmount,
      paymentStatus: "pending",
      bookingStatus: "pending",
      createdAt: now,
      bookingId: String(result.insertedId),
    });

    await equipment.updateOne(
      { _id: item._id },
      { $inc: { availableQuantity: -amount } },
    );

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: { ...booking, id: String(result.insertedId) },
    });
  } catch (error) {
    failed(res, "Error creating booking", error);
  }
};

export const getBooking = async (req: Request, res: Response) => {
  try {
    const booking = await bookings.findOne(idFilter(text(req.params.id)));
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Booking fetched successfully",
      data: toClient(booking),
    });
  } catch (error) {
    failed(res, "Error fetching booking", error);
  }
};

export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const items = await bookings
      .find({ userId: text(req.query.userId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data: items.map(toClient),
    });
  } catch (error) {
    failed(res, "Error fetching bookings", error);
  }
};
