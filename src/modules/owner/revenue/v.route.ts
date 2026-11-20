import { Router } from "express";
import { getRevenue } from "./v.controller.js";

const revenueRouter = Router();

revenueRouter.get("/", getRevenue);

export default revenueRouter;
