import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { goalController } from '../controllers/goalController'

const router = Router()
router.use(authMiddleware)

router.get('/', goalController.list)
router.post('/', goalController.create)
router.put('/:id', goalController.update)
router.delete('/:id', goalController.remove)

export default router