import type { Request, Response } from "express";
import { connectToMongoDB } from "../../config/db.js";
import { idFilter, toClient } from "../../config/serialize.js";

const db = connectToMongoDB();
const users = db.collection("user");
const equipment = db.collection("equipments");
const rentals = db.collection("rentals");
const sessions = db.collection("session");
const accounts = db.collection("account");
const bookings = db.collection("bookings");
const payments = db.collection("payments");

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

// MongoDB returns ObjectId and Date objects, not strings.
const asText = (value: unknown): string =>
  value instanceof Date ? value.toISOString() : String(value ?? "");

const ROLES = ["customer", "owner", "admin"];
const PAYMENT_STATUSES = ["paid", "pending", "failed", "refunded"];
const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "active",
  "completed",
  "cancelled",
];

const failed = (res: Response, message: string, error: unknown) =>
  res.status(500).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : "Unknown error",
  });

const publicUser = (doc: Record<string, unknown>) => ({
  id: asText(doc._id) || asText(doc.id),
  name: asText(doc.name),
  email: asText(doc.email),
  role: ROLES.includes(text(doc.role)) ? text(doc.role) : "customer",
  createdAt: asText(doc.createdAt),
});

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const docs = await users.find({}).sort({ createdAt: -1 }).toArray();
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: docs.map(publicUser),
    });
  } catch (error) {
    failed(res, "Error fetching users", error);
  }
};

export const changeUserRole = async (req: Request, res: Response) => {
  try {
    const role = text(req.body.role);
    if (!ROLES.includes(role)) {
      res.status(400).json({ success: false, message: "Invalid role" });
      return;
    }

    const id = text(req.params.id);
    const user = await users.findOneAndUpdate(
      idFilter(id),
      { $set: { role, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" },
    );

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: publicUser(user),
    });
  } catch (error) {
    failed(res, "Error updating role", error);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = text(req.params.id);
    const result = await users.deleteOne(idFilter(id));

    if (result.deletedCount === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Remove the user's auth records too.
    await sessions.deleteMany({ userId: id });
    await accounts.deleteMany({ userId: id });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: { id },
    });
  } catch (error) {
    failed(res, "Error deleting user", error);
  }
};

export const getAdminEquipment = async (_req: Request, res: Response) => {
  try {
    const items = await equipment.find({}).sort({ createdAt: -1 }).toArray();
    res.status(200).json({
      success: true,
      message: "Equipment fetched successfully",
      data: items.map(toClient),
    });
  } catch (error) {
    failed(res, "Error fetching equipment", error);
  }
};

export const setEquipmentStatus = async (req: Request, res: Response) => {
  try {
    const status = text(req.body.status);
    if (!["pending", "approved", "rejected", "paused"].includes(status)) {
      res.status(400).json({ success: false, message: "Invalid status" });
      return;
    }

    const item = await equipment.findOneAndUpdate(
      idFilter(text(req.params.id)),
      { $set: { status } },
      { returnDocument: "after" },
    );

    if (!item) {
      res.status(404).json({ success: false, message: "Equipment not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Equipment status updated",
      data: toClient(item),
    });
  } catch (error) {
    failed(res, "Error updating equipment status", error);
  }
};

export const getAdminRentals = async (_req: Request, res: Response) => {
  try {
    const docs = await rentals.find({}).sort({ createdAt: -1 }).toArray();
    const items = await equipment.find({}).toArray();

    // Owners are stored on the equipment record.
    const owners = new Map<string, Record<string, unknown>>();
    items.forEach((item) => {
      owners.set(asText(item._id), (item.owner ?? {}) as Record<string, unknown>);
      if (item.id) owners.set(asText(item.id), item.owner as Record<string, unknown>);
    });

    const data = docs.map((doc) => {
      const owner = owners.get(text(doc.equipmentId)) ?? {};
      return {
        ...toClient(doc),
        ownerName: text(owner.name) || "Unknown owner",
        ownerEmail: text(owner.email),
      };
    });

    res.status(200).json({
      success: true,
      message: "Rentals fetched successfully",
      data,
    });
  } catch (error) {
    failed(res, "Error fetching rentals", error);
  }
};

export const getAdminAnalytics = async (_req: Request, res: Response) => {
  try {
    const [userCount, equipmentCount, bookingDocs, paymentDocs] =
      await Promise.all([
        users.countDocuments({}),
        equipment.countDocuments({}),
        bookings.find({}).toArray(),
        payments.find({}).toArray(),
      ]);

    const monthly = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - 5 + index, 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleString("en-US", { month: "short" }),
        count: 0,
      };
    });

    bookingDocs.forEach((booking) => {
      const date = new Date(text(booking.createdAt));
      const bucket = monthly.find(
        (item) => item.key === `${date.getFullYear()}-${date.getMonth()}`,
      );
      if (bucket) bucket.count += 1;
    });

    res.status(200).json({
      success: true,
      message: "Admin analytics fetched successfully",
      data: {
        totalUsers: userCount,
        totalEquipment: equipmentCount,
        totalBookings: bookingDocs.length,
        pendingApprovals: await equipment.countDocuments({ status: "pending" }),
        completedRentals: bookingDocs.filter(
          (booking) => text(booking.bookingStatus) === "completed",
        ).length,
        totalRevenue: paymentDocs
          .filter((payment) => text(payment.status) === "paid")
          .reduce((sum, payment) => sum + Number(payment.amount), 0),
        monthlyBookings: monthly.map(({ month, count }) => ({ month, count })),
      },
    });
  } catch (error) {
    failed(res, "Error fetching admin analytics", error);
  }
};

export const updateRentalStatus = async (req: Request, res: Response) => {
  try {
    const set: Record<string, string> = {};
    const paymentStatus = text(req.body.paymentStatus);
    const bookingStatus = text(req.body.bookingStatus);

    if (paymentStatus) {
      if (!PAYMENT_STATUSES.includes(paymentStatus)) {
        res.status(400).json({ success: false, message: "Invalid payment status" });
        return;
      }
      set.paymentStatus = paymentStatus;
    }
    if (bookingStatus) {
      if (!BOOKING_STATUSES.includes(bookingStatus)) {
        res.status(400).json({ success: false, message: "Invalid booking status" });
        return;
      }
      set.bookingStatus = bookingStatus;
    }
    if (Object.keys(set).length === 0) {
      res.status(400).json({ success: false, message: "No status provided" });
      return;
    }

    const rental = await rentals.findOneAndUpdate(
      idFilter(text(req.params.id)),
      { $set: set },
      { returnDocument: "after" },
    );

    if (!rental) {
      res.status(404).json({ success: false, message: "Rental not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Rental status updated",
      data: toClient(rental),
    });
  } catch (error) {
    failed(res, "Error updating rental", error);
  }
};
