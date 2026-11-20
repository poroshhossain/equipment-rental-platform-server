import express from "express";
import cors from "cors";
import userRouter from "./modules/users/user.route.js";
import equipmentRouter from "./modules/owner/equipment/e.route.js";
import rentalRouter from "./modules/owner/rental/r.route.js";
import profileRouter from "./modules/owner/profile/p.route.js";
import revenueRouter from "./modules/owner/revenue/v.route.js";

const app = express();

// Middlewares
app.use(cors());
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
app.use("/api/v1/equipments", equipmentRouter);
app.use("/api/v1/owner/rentals", rentalRouter);
app.use("/api/v1/owner/profile", profileRouter);
app.use("/api/v1/owner/revenue", revenueRouter);

// Export Express app for Vercel
export default app;
