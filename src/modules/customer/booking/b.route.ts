import { Router } from "express";
import { verifyRenter } from "../../../middleware/auth.js";
import { createBooking, getBooking, getUserBookings } from "./b.controller.js";

const bookingRouter = Router();

bookingRouter.use(verifyRenter);
bookingRouter.post("/", createBooking);
bookingRouter.get("/", getUserBookings);
bookingRouter.get("/:id", getBooking);

export default bookingRouter;
