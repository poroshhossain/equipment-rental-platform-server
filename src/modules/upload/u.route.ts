import { Router } from "express";
import { verifyToken } from "../../middleware/auth.js";
import { uploadImage } from "./u.controller.js";

const uploadRouter = Router();

uploadRouter.post("/", verifyToken, uploadImage);

export default uploadRouter;
