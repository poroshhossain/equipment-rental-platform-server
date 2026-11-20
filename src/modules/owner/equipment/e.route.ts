import { Router } from "express";
import {
  deleteEquipment,
  getAllEquipment,
  postEquipment,
  updateEquipment,
} from "./e.controller.js";

const eRouter = Router();

eRouter.post("/", postEquipment);
eRouter.get("/", getAllEquipment);
eRouter.patch("/:id", updateEquipment);
eRouter.delete("/:id", deleteEquipment);

export default eRouter;
