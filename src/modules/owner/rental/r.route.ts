import { Router } from "express";
import { verifyOwner } from "../../../middleware/auth.js";
import { getAllRentals } from "./r.controller.js";

const rentalRouter = Router();

rentalRouter.get("/", verifyOwner, getAllRentals);

export default rentalRouter;
