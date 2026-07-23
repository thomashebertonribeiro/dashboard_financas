import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { categoryController } from '../controllers/categoryController'

const router = Router()
router.use(authMiddleware)

router.get('/', categoryController.list)
router.post('/', categoryController.create)
router.put('/:id', categoryController.update)
router.delete('/:id', categoryController.remove)

export default router