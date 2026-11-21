import { Router } from "express";

import {
  createCheckout,
  getPayment,
  stripeWebhook,
  verifyCheckout,
} from "./p.controller.js";

const paymentRouter = Router();

paymentRouter.post("/checkout", createCheckout);
paymentRouter.post("/verify", verifyCheckout);
paymentRouter.get("/", getPayment);
paymentRouter.post("/webhook", stripeWebhook);

export default paymentRouter;
