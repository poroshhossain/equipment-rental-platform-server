import { Router } from "express";
import {
  changeUserRole,
  deleteUser,
  getAdminEquipment,
  getAdminRentals,
  getUsers,
  setEquipmentStatus,
  updateRentalStatus,
} from "./a.controller.js";

const adminRouter = Router();

adminRouter.get("/users", getUsers);
adminRouter.patch("/users/:id/role", changeUserRole);
adminRouter.delete("/users/:id", deleteUser);
adminRouter.get("/equipments", getAdminEquipment);
adminRouter.patch("/equipments/:id/status", setEquipmentStatus);
adminRouter.get("/rentals", getAdminRentals);
adminRouter.patch("/rentals/:id/status", updateRentalStatus);

export default adminRouter;
