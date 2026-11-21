import Stripe from "stripe";

/**
 * A missing key must not crash the API at import time — callers return a clear
 * 503 response instead and the rest of the app keeps working.
 */
const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripeClient = secretKey ? new Stripe(secretKey) : null;
