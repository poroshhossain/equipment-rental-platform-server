import { Router } from "express";
import { uploadImage } from "./u.controller.js";

const uploadRouter = Router();

uploadRouter.post("/", uploadImage);

export default uploadRouter;
