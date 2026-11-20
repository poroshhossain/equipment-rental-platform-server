import express from "express";
import cors from "cors";
import userRouter from "./modules/users/user.route.js";
import userProfileRouter from "./modules/users/profile.route.js";
import equipmentRouter from "./modules/owner/equipment/e.route.js";
import rentalRouter from "./modules/owner/rental/r.route.js";
import profileRouter from "./modules/owner/profile/p.route.js";
import revenueRouter from "./modules/owner/revenue/v.route.js";
import contentRouter from "./modules/content/c.route.js";
import favoriteRouter from "./modules/customer/favorite/f.route.js";
import bookingRouter from "./modules/customer/booking/b.route.js";
import adminRouter from "./modules/admin/a.route.js";
import { verifyAdmin } from "./middleware/auth.js";

const app = express();

// Middlewares — origins come from env so production never depends on localhost.
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Origin not allowed"));
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Express TypeScript API",
  });
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/profile", userProfileRouter);
app.use("/api/v1/equipments", equipmentRouter);
app.use("/api/v1/owner/rentals", rentalRouter);
app.use("/api/v1/owner/profile", profileRouter);
app.use("/api/v1/owner/revenue", revenueRouter);
app.use("/api/v1", contentRouter);
app.use("/api/v1/customer/favorites", favoriteRouter);
app.use("/api/v1/customer/bookings", bookingRouter);
app.use("/api/v1/admin", verifyAdmin, adminRouter);

// Export Express app for Vercel
export default app;
