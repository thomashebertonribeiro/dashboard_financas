import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { transactionController } from '../controllers/transactionController'

const router = Router()
router.use(authMiddleware)

router.get('/', transactionController.list)
router.post('/', transactionController.create)
router.put('/:id', transactionController.update)
router.delete('/:id', transactionController.remove)

export default router