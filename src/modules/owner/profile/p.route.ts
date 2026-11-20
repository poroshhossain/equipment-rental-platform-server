import { Router } from "express";
import { getOwnerProfile, saveOwnerProfile } from "./p.controller.js";

const profileRouter = Router();

profileRouter.get("/", getOwnerProfile);
profileRouter.patch("/", saveOwnerProfile);

export default profileRouter;
