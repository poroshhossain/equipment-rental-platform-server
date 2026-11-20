import { Router } from "express";
import { verifyOwner } from "../../../middleware/auth.js";
import { getOwnerAnalytics, getOwnerEquipment } from "./s.controller.js";

const scopeRouter = Router();

scopeRouter.get("/equipments", verifyOwner, getOwnerEquipment);
scopeRouter.get("/analytics", verifyOwner, getOwnerAnalytics);

export default scopeRouter;
