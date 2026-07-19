import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { investmentController } from '../controllers/investmentController'

const router = Router()
router.use(authMiddleware)

router.get('/', investmentController.list)
router.post('/', investmentController.create)
router.put('/:id', investmentController.update)
router.delete('/:id', investmentController.remove)
router.get('/by-type', investmentController.byType)

export default router