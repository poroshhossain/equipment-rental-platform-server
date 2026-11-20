import { Router } from "express";
import { getUserProfile, saveUserProfile } from "./p.controller.js";

const profileRouter = Router();

profileRouter.get("/", getUserProfile);
profileRouter.patch("/", saveUserProfile);

export default profileRouter;
