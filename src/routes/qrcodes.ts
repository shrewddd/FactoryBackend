import { QRCodeController } from "controllers/qrcodes";
import express from "express"
import { authenticate } from "middleware/auth";

const router = express.Router()

const controller = new QRCodeController();

router.get('/', authenticate, controller.findMany)
router.get('/:id', controller.find)
router.post('/', authenticate, controller.create)
router.post('/bulk', authenticate, controller.createMany)
// router.put('/:id', authenticate, controller.update) WIP
// router.delete('/:id', authenticate, controller.delete) WIP
router.patch('/:id/link', authenticate, controller.link)
router.get('/:id/scan', controller.scan)

export default router;
