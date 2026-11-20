import { Router } from "express";
import { addFavorite, getFavorites, removeFavorite } from "./f.controller.js";

const favoriteRouter = Router();

favoriteRouter.get("/", getFavorites);
favoriteRouter.post("/", addFavorite);
favoriteRouter.delete("/:equipmentId", removeFavorite);

export default favoriteRouter;
