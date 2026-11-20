import { Router } from "express";
import { createBooking, getBooking, getUserBookings } from "./b.controller.js";

const bookingRouter = Router();

bookingRouter.post("/", createBooking);
bookingRouter.get("/", getUserBookings);
bookingRouter.get("/:id", getBooking);

export default bookingRouter;
