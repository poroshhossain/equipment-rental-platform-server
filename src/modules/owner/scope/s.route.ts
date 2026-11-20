import { Router } from "express";
import { getOwnerAnalytics, getOwnerEquipment } from "./s.controller.js";

const scopeRouter = Router();

scopeRouter.get("/equipments", getOwnerEquipment);
scopeRouter.get("/analytics", getOwnerAnalytics);

export default scopeRouter;
