import cron from "node-cron";
import { connectToMongoDB } from "../config/db.js";

const resendKey = process.env.RESEND_API_KEY ?? "";
const fromEmail = process.env.NOTIFICATION_FROM ?? "EquipRent <onboarding@resend.dev>";

async function notifyCompletedRentals() {
  if (!resendKey) return;

  const db = await connectToMongoDB();
  const rentals = db.collection("rentals");
  const pending = await rentals
    .find({ bookingStatus: "completed", notified: { $ne: true } })
    .toArray();

  for (const rental of pending) {
    const email = String(rental.customer?.email ?? "");
    if (!email) continue;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `Your ${rental.equipmentName} rental is complete`,
        text: `Hi ${rental.customer?.name ?? "there"}, your rental of ${rental.equipmentName} has been completed. Thank you for using EquipRent.`,
      }),
    });

    await rentals.updateOne({ _id: rental._id }, { $set: { notified: true } });
  }
}

/** Runs hourly: marks finished rentals completed and sends emails when configured. */
export function startCronJobs() {
  cron.schedule("0 * * * *", async () => {
    try {
      const db = await connectToMongoDB();
      const now = new Date().toISOString();
      const openStatuses = { $in: ["pending", "confirmed", "active"] };

      await db.collection("rentals").updateMany(
        { endDate: { $lt: now }, bookingStatus: openStatuses },
        { $set: { bookingStatus: "completed" } },
      );
      await db.collection("bookings").updateMany(
        { endDate: { $lt: now }, bookingStatus: openStatuses },
        { $set: { bookingStatus: "completed" } },
      );

      await notifyCompletedRentals();
    } catch (error) {
      console.error("Cron job failed:", error);
    }
  });

  console.log("Cron jobs started");
}
