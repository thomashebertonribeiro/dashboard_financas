import { Router } from 'express'
import { authMiddleware } from '../middleware/authMiddleware'
import { accountController } from '../controllers/accountController'

const router = Router()
router.use(authMiddleware)

router.get('/', accountController.list)
router.post('/', accountController.create)
router.put('/:id', accountController.update)
router.delete('/:id', accountController.remove)

export default router