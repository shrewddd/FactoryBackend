import { ProductController } from 'controllers_new/products';
import express from 'express'
import { authenticate } from 'middleware/auth';

const router = express.Router();

const controller = new ProductController()

router.get('/', authenticate, controller.findMany)
router.get('/quantities', authenticate, controller.findQuantities)
router.get('/:id', controller.find)
// router.post('/', authenticate, controller.create) WIP
router.put('/:id', authenticate, controller.update)

export default router;
