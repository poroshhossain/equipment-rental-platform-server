import { Router } from "express";
import { verifyAdmin } from "../../middleware/auth.js";
import { getAllUsers } from "./user.controller.js";

const router = Router();

router.get("/", verifyAdmin, getAllUsers);

export default router;
