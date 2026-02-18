import { getUserController, getUsersController, updateUserController } from "controllers/users";
import express from "express";
import { authenticate } from "middleware/auth";

const router = express.Router();

router.get('/', getUsersController)
router.get('/:id', getUserController)
router.put('/:id', authenticate, updateUserController)

export default router;
