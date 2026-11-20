import { Router } from "express";
import { getAllRentals } from "./r.controller.js";

const rentalRouter = Router();

rentalRouter.get("/", getAllRentals);

export default rentalRouter;
