import { Router } from "express";
import { verifyOwner } from "../../../middleware/auth.js";
import { getOwnerProfile, saveOwnerProfile } from "./p.controller.js";

const profileRouter = Router();

profileRouter.get("/", verifyOwner, getOwnerProfile);
profileRouter.patch("/", verifyOwner, saveOwnerProfile);

export default profileRouter;
