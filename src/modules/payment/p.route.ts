import { Router } from "express";
import { createCheckout, getPayment, stripeWebhook } from "./p.controller.js";

const paymentRouter = Router();

paymentRouter.post("/checkout", createCheckout);
paymentRouter.get("/", getPayment);
paymentRouter.post("/webhook", stripeWebhook);

export default paymentRouter;
