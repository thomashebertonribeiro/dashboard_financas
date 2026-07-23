import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { creditCardController } from '../controllers/creditCardController'

const router = Router()
router.use(authMiddleware)

router.get('/', creditCardController.list)
router.post('/', creditCardController.create)
router.put('/:id', creditCardController.update)
router.delete('/:id', creditCardController.remove)

export default router