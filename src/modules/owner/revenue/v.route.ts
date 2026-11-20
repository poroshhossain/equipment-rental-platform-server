import { Router } from "express";
import { verifyOwner } from "../../../middleware/auth.js";
import { getRevenue } from "./v.controller.js";

const revenueRouter = Router();

revenueRouter.get("/", verifyOwner, getRevenue);

export default revenueRouter;
