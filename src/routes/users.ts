import { UserController } from "controllers/users";
import express from "express";
import { authenticate } from "middleware/auth";

const router = express.Router();

const controller = new UserController()

router.get("/", controller.findMany);
router.get("/:id", controller.find);
router.put("/:id", authenticate, controller.update);

export default router;
