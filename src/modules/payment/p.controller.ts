import type { Request, Response } from "express";
import Stripe from "stripe";
import { connectToMongoDB } from "../../config/db.js";
import { idFilter } from "../../config/serialize.js";

const db = await connectToMongoDB();
const bookings = db.collection("bookings");
const rentals = db.collection("rentals");
const payments = db.collection("payments");

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

/** Creates a Stripe Checkout session for an existing booking. */
export const createCheckout = async (req: Request, res: Response) => {
  try {
    const booking = await bookings.findOne(idFilter(text(req.body.bookingId)));
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    // Demo mode: the UI shows the summary and explains that keys are missing.
    if (!stripeKey) {
      res.status(200).json({
        success: true,
        message: "Stripe is not configured",
        data: { url: null },
      });
      return;
    }

    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: text(booking.equipmentName) },
            unit_amount: Math.round(Number(booking.totalAmount) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${clientUrl}/payment/success?booking=${String(booking._id)}`,
      cancel_url: `${clientUrl}/payment?booking=${String(booking._id)}`,
      metadata: { bookingId: String(booking._id) },
    });

    res.status(200).json({
      success: true,
      message: "Checkout session created",
      data: { url: session.url },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not start Stripe Checkout",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/** Stripe calls this after payment; raw body is required for signature checks. */
export const stripeWebhook = async (req: Request, res: Response) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const signature = req.header("Stripe-Signature") ?? "";

  try {
    if (!secret || !stripeKey) {
      res.status(200).json({ received: true, message: "Stripe not configured" });
      return;
    }

    const stripe = new Stripe(stripeKey);
    const event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      secret,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingId = text(session.metadata?.bookingId);

      await bookings.updateOne(idFilter(bookingId), {
        $set: { paymentStatus: "paid", bookingStatus: "confirmed" },
      });
      await rentals.updateOne(
        { bookingId },
        { $set: { paymentStatus: "paid", bookingStatus: "confirmed" } },
      );
      await payments.updateOne(
        { stripeSessionId: session.id },
        {
          $set: {
            stripeSessionId: session.id,
            bookingId,
            amount: (session.amount_total ?? 0) / 100,
            currency: session.currency ?? "usd",
            status: "paid",
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true },
      );
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({
      received: false,
      message: error instanceof Error ? error.message : "Invalid webhook",
    });
  }
};

export const getPayment = async (req: Request, res: Response) => {
  try {
    const payment = await payments.findOne({
      bookingId: text(req.query.bookingId),
    });
    res.status(200).json({
      success: true,
      message: "Payment fetched successfully",
      data: payment
        ? {
            id: String(payment._id),
            bookingId: payment.bookingId,
            amount: payment.amount,
            status: payment.status,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
