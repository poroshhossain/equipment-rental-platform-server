import { Router } from "express";
import { verifyOwner } from "../../../middleware/auth.js";
import {
  deleteEquipment,
  getAllEquipment,
  getEquipmentById,
  postEquipment,
  updateEquipment,
} from "./e.controller.js";

const eRouter = Router();

// Public reads, owner-only writes.
eRouter.get("/", getAllEquipment);
eRouter.get("/:id", getEquipmentById);
eRouter.post("/", verifyOwner, postEquipment);
eRouter.patch("/:id", verifyOwner, updateEquipment);
eRouter.delete("/:id", verifyOwner, deleteEquipment);

export default eRouter;
