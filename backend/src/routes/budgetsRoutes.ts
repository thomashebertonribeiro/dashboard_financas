import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { budgetController } from '../controllers/budgetController'

const router = Router()
router.use(authMiddleware)

router.get('/', budgetController.list)
router.post('/', budgetController.create)
router.put('/:id', budgetController.update)
router.delete('/:id', budgetController.remove)

export default router