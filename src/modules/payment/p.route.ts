import { Router } from "express";
import { verifyRenter, verifyToken } from "../../middleware/auth.js";
import { createCheckout, getPayment, stripeWebhook } from "./p.controller.js";

const paymentRouter = Router();

paymentRouter.post("/checkout", verifyRenter, createCheckout);
paymentRouter.get("/", verifyToken, getPayment);
paymentRouter.post("/webhook", stripeWebhook);

export default paymentRouter;
