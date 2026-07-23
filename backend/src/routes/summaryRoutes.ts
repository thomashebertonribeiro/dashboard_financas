import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { summaryController } from '../controllers/summaryController'

const router = Router()
router.use(authMiddleware)

router.get('/dashboard', summaryController.dashboard)
router.get('/monthly', summaryController.monthly)

export default router