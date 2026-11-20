import { Router } from "express";
import { verifyRenter } from "../../../middleware/auth.js";
import { addFavorite, getFavorites, removeFavorite } from "./f.controller.js";

const favoriteRouter = Router();

favoriteRouter.use(verifyRenter);
favoriteRouter.get("/", getFavorites);
favoriteRouter.post("/", addFavorite);
favoriteRouter.delete("/:equipmentId", removeFavorite);

export default favoriteRouter;
