import { AuthenticationController } from 'controllers_new/auth';
import express from 'express'
import { authenticate } from 'middleware/auth';

const router = express.Router();

const controller = new AuthenticationController()

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/logout', authenticate, controller.logout);
router.get('/whoami', authenticate, controller.whoami)

export default router;
