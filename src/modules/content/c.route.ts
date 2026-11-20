import { Router } from "express";
import { getCategories, getReviews } from "./c.controller.js";

const contentRouter = Router();

contentRouter.get("/categories", getCategories);
contentRouter.get("/reviews", getReviews);

export default contentRouter;
