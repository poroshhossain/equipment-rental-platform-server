import express from "express";
import cors from "cors";
import userProfileRouter from "./modules/users/profile.route.js";
import equipmentRouter from "./modules/owner/equipment/e.route.js";
import rentalRouter from "./modules/owner/rental/r.route.js";
import profileRouter from "./modules/owner/profile/p.route.js";
import revenueRouter from "./modules/owner/revenue/v.route.js";
import scopeRouter from "./modules/owner/scope/s.route.js";
import contentRouter from "./modules/content/c.route.js";
import favoriteRouter from "./modules/customer/favorite/f.route.js";
import bookingRouter from "./modules/customer/booking/b.route.js";
import adminRouter from "./modules/admin/a.route.js";
import paymentRouter from "./modules/payment/p.route.js";

const app = express();

// Stripe signs the raw payload, so this route must be parsed before express.json().
app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));

// Local development should work on any host/port without CORS errors.
const allowedOrigins = [
  process.env.CLIENT_URL ?? "",
  ...(process.env.CORS_ORIGINS ?? "").split(",").map((origin) => origin.trim()),
].filter(Boolean);

// Vercel gives every deployment (including previews) its own hostname, so a
// static allowlist alone cannot cover the deployed frontend. Allow any
// *.vercel.app origin in addition to the explicitly configured ones.
const isVercelOrigin = (origin: string): boolean => {
  try {
    return new URL(origin).hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        process.env.NODE_ENV !== "production" ||
        allowedOrigins.includes(origin) ||
        isVercelOrigin(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed"));
      }
    },
  }),
);
app.use(express.json());

// Routes
app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use("/api/v1/profile", userProfileRouter);
app.use("/api/v1/equipments", equipmentRouter);
app.use("/api/v1/owner/rentals", rentalRouter);
app.use("/api/v1/owner/profile", profileRouter);
app.use("/api/v1/owner/revenue", revenueRouter);
app.use("/api/v1/owner", scopeRouter);
app.use("/api/v1", contentRouter);
app.use("/api/v1/customer/favorites", favoriteRouter);
app.use("/api/v1/customer/bookings", bookingRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/payment", paymentRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// Never let Express's default HTML error handler run inside a serverless
// function: it leaks stack traces and can leave the invocation in a bad state.
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).json({ success: false, message: "Internal server error." });
  },
);

// Export Express app for Vercel
export default app;
