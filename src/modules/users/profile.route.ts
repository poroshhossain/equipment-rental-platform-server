import { Router } from "express";
import { verifyToken } from "../../middleware/auth.js";
import { getUserProfile, saveUserProfile } from "./p.controller.js";

const profileRouter = Router();

profileRouter.use(verifyToken);
profileRouter.get("/", getUserProfile);
profileRouter.patch("/", saveUserProfile);

export default profileRouter;
