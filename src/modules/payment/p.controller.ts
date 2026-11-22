import type { Request, Response } from "express";
import type { Document } from "mongodb";
import type Stripe from "stripe";

import { connectToMongoDB } from "../../config/db.js";
import { idFilter } from "../../config/serialize.js";
import { stripeClient } from "../../config/stripe.js";

const db = connectToMongoDB();
const bookings = db.collection("bookings");
const rentals = db.collection("rentals");
const payments = db.collection("payments");
const equipments = db.collection("equipments");

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

const clientUrl = () => process.env.CLIENT_URL ?? "http://localhost:3000";

const failed = (res: Response, message: string, error: unknown) =>
  res.status(500).json({
    success: false,
    message,
    error: error instanceof Error ? error.message : "Unknown error",
  });

/** Shape returned to the UI for a stored transaction. */
const paymentView = (doc: Document) => ({
  id: String(doc._id),
  bookingId: text(doc.bookingId),
  amount: Number(doc.amount ?? 0),
  currency: text(doc.currency) || "usd",
  status: text(doc.status),
  stripeSessionId: text(doc.stripeSessionId),
  stripePaymentIntentId: text(doc.stripePaymentIntentId),
  customerEmail: text(doc.customerEmail),
  createdAt:
    doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : text(doc.createdAt),
});

/**
 * Idempotent settlement shared by the Stripe webhook and the success-page
 * verification endpoint, so payment status never depends on one callback.
 */
async function settlePaidSession(session: Stripe.Checkout.Session) {
  const bookingId =
    text(session.metadata?.bookingId) || text(session.client_reference_id);
  if (!bookingId) return null;

  const booking = await bookings.findOne(idFilter(bookingId));
  if (!booking) return null;

  const now = new Date().toISOString();
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? "");

  await bookings.updateOne(idFilter(bookingId), {
    $set: { paymentStatus: "paid", bookingStatus: "confirmed", paidAt: now },
  });

  // Keep the owner-facing rental row in sync even if the mirror is missing.
  await rentals.updateOne(
    { bookingId },
    {
      $set: { paymentStatus: "paid", bookingStatus: "confirmed", paidAt: now },
      $setOnInsert: {
        bookingId,
        customer: booking.customer ?? {},
        equipmentId: booking.equipmentId,
        equipmentName: booking.equipmentName,
        equipmentImage: booking.equipmentImage,
        startDate: booking.startDate,
        endDate: booking.endDate,
        rentalType: booking.rentalType,
        quantity: booking.quantity,
        bookingAmount: booking.totalAmount,
        createdAt: booking.createdAt ?? now,
      },
    },
    { upsert: true },
  );

  await payments.updateOne(
    { stripeSessionId: session.id },
    {
      $set: {
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntent,
        bookingId,
        amount:
          session.amount_total != null
            ? session.amount_total / 100
            : Number(booking.totalAmount),
        currency: session.currency ?? "usd",
        paymentStatus: session.payment_status,
        status: "paid",
        customerEmail:
          session.customer_details?.email ?? text(booking.customer?.email),
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  return payments.findOne({ stripeSessionId: session.id });
}

/**
 * Releases the units reserved when the booking was created. Used when a
 * Checkout session expires or its async payment fails, so stock is never lost.
 * The `inventoryRestored` flag makes repeated webhook deliveries harmless.
 */
async function releaseInventoryForSession(
  session: Stripe.Checkout.Session,
  status: "expired" | "failed",
) {
  const bookingId =
    text(session.metadata?.bookingId) || text(session.client_reference_id);
  if (!bookingId) return;

  const booking = await bookings.findOne(idFilter(bookingId));
  if (!booking || text(booking.paymentStatus) === "paid") return;

  const now = new Date().toISOString();
  const quantity = Number(booking.quantity ?? 0);
  const equipmentId = text(booking.equipmentId);

  // Atomically claim this session. A missing document is inserted so the
  // cancellation is still traceable; an already-restored one is left alone.
  const previous = await payments.findOneAndUpdate(
    { stripeSessionId: session.id, inventoryRestored: { $ne: true } },
    {
      $set: {
        bookingId,
        stripeSessionId: session.id,
        status,
        inventoryRestored: true,
        amount: Number(booking.totalAmount ?? 0),
        currency: "usd",
        customerEmail: text(booking.customer?.email),
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { returnDocument: "before" },
  );

  if (!previous) {
    const existing = await payments.findOne({ stripeSessionId: session.id });
    if (existing) return; // already restored by another delivery
    await payments.insertOne({
      bookingId,
      stripeSessionId: session.id,
      status,
      inventoryRestored: true,
      amount: Number(booking.totalAmount ?? 0),
      currency: "usd",
      createdAt: now,
      updatedAt: now,
    });
  }

  if (equipmentId && Number.isFinite(quantity) && quantity > 0) {
    await equipments.updateOne(idFilter(equipmentId), {
      $inc: { availableQuantity: quantity },
    });
  }

  await bookings.updateOne(
    { ...idFilter(bookingId), paymentStatus: "pending" },
    {
      $set: {
        paymentStatus: status,
        bookingStatus: "cancelled",
        updatedAt: now,
      },
    },
  );

  await rentals.updateOne(
    { bookingId, paymentStatus: "pending" },
    {
      $set: {
        paymentStatus: status,
        bookingStatus: "cancelled",
        updatedAt: now,
      },
    },
  );
}

/**
 * Creates a Stripe Checkout session for a confirmed (pending) booking.
 * The amount comes from the server-computed booking total — never the client.
 */
export const createCheckout = async (req: Request, res: Response) => {
  try {
    const bookingId = text(req.body?.bookingId);
    if (!bookingId) {
      res.status(400).json({ success: false, message: "Missing booking id." });
      return;
    }

    const booking = await bookings.findOne(idFilter(bookingId));
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found." });
      return;
    }

    const amount = Number(booking.totalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({
        success: false,
        message: "This booking has no payable amount.",
      });
      return;
    }

    const successUrl = `${clientUrl()}/payment/success?booking=${encodeURIComponent(bookingId)}`;

    if (booking.paymentStatus === "paid") {
      res.status(200).json({
        success: true,
        message: "Booking is already paid.",
        data: { url: `${successUrl}&paid=1`, paid: true },
      });
      return;
    }

    if (!stripeClient) {
      res.status(503).json({
        success: false,
        message:
          "Stripe is not configured. Add STRIPE_SECRET_KEY to the server environment.",
        data: { url: null },
      });
      return;
    }

    // Never trust a client-supplied user id for the payment's metadata.
    const userId = text(booking.userId);

    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      client_reference_id: bookingId,
      ...(text(booking.customer?.email)
        ? { customer_email: text(booking.customer?.email) }
        : {}),
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: text(booking.equipmentName) || "Equipment rental",
              description: `${text(booking.startDate)} – ${text(booking.endDate)}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: { metadata: { bookingId, userId } },
      metadata: { bookingId, userId },
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl()}/payment/cancel?booking=${encodeURIComponent(bookingId)}`,
      // Retrying the same checkout returns the same session instead of
      // creating duplicates that could settle twice.
    }, { idempotencyKey: `checkout-${bookingId}` });

    // Trace every checkout attempt in the payments collection.
    const now = new Date().toISOString();
    await payments.updateOne(
      { stripeSessionId: session.id },
      {
        $set: {
          bookingId,
          stripeSessionId: session.id,
          amount,
          currency: "usd",
          status: "pending",
          userId,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    res.status(200).json({
      success: true,
      message: "Checkout session created.",
      data: { url: session.url, sessionId: session.id },
    });
  } catch (error) {
    failed(res, "Could not start Stripe Checkout", error);
  }
};

/**
 * Stripe calls this after payment. The raw signed body is parsed by a
 * dedicated middleware mounted before express.json() in app.ts.
 */
export const stripeWebhook = async (req: Request, res: Response) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeClient || !secret) {
    // 503 makes Stripe retry and surfaces the misconfiguration in the logs.
    // A 200 would silently drop every payment event.
    res.status(503).json({
      received: false,
      message: "Stripe webhook is not configured on the server.",
    });
    return;
  }

  try {
    const event = stripeClient.webhooks.constructEvent(
      req.body as Buffer,
      req.header("stripe-signature") ?? "",
      secret,
    );
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await settlePaidSession(event.data.object);
    } else if (event.type === "checkout.session.expired") {
      await releaseInventoryForSession(event.data.object, "expired");
    } else if (event.type === "checkout.session.async_payment_failed") {
      await releaseInventoryForSession(event.data.object, "failed");
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({
      received: false,
      message:
        error instanceof Error ? error.message : "Invalid webhook payload.",
    });
  }
};

/**
 * Fallback confirmation for the success page: asks Stripe directly, then runs
 * the same settlement as the webhook. Safe to call repeatedly.
 */
export const verifyCheckout = async (req: Request, res: Response) => {
  try {
    const sessionId = text(req.body?.sessionId);
    const requestedBookingId = text(req.body?.bookingId);
    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: "Missing Stripe session id.",
      });
      return;
    }
    if (!stripeClient) {
      res.status(503).json({
        success: false,
        message: "Stripe is not configured.",
      });
      return;
    }

    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    const sessionBookingId =
      text(session.metadata?.bookingId) || text(session.client_reference_id);
    if (
      requestedBookingId &&
      sessionBookingId &&
      requestedBookingId !== sessionBookingId
    ) {
      res.status(400).json({
        success: false,
        message: "This Checkout session belongs to a different booking.",
      });
      return;
    }

    if (session.payment_status !== "paid" || session.status !== "complete") {
      res.status(200).json({
        success: true,
        data: { paid: false, status: session.payment_status },
      });
      return;
    }

    const payment = await settlePaidSession(session);
    if (!payment) {
      res.status(404).json({
        success: false,
        message: "The booking for this payment no longer exists.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { paid: true, payment: paymentView(payment) },
    });
  } catch (error) {
    failed(res, "Could not verify payment", error);
  }
};

export const getPayment = async (req: Request, res: Response) => {
  try {
    const bookingId = text(req.query.bookingId);
    if (!bookingId) {
      res.status(400).json({ success: false, message: "Missing booking id." });
      return;
    }

    const payment = await payments.findOne({ bookingId });
    res.status(200).json({
      success: true,
      message: "Payment fetched successfully",
      data: payment ? paymentView(payment) : null,
    });
  } catch (error) {
    failed(res, "Error fetching payment", error);
  }
};
