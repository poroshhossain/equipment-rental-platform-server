import express from "express";
import cors from "cors";
import userRouter from "./modules/users/user.route.js";


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

// user routes endpoint
app.use('/api/v1/users', userRouter)




// Export Express app for Vercel
export default app;