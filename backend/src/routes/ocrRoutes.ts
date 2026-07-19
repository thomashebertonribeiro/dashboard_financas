import { Router } from 'express'
import multer from 'multer'
import { authMiddleware } from '../middleware/authMiddleware'
import { ocrController } from '../controllers/ocrController'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const router = Router()
router.use(authMiddleware)

router.post('/upload', upload.single('file'), ocrController.upload)
router.get('/documents', ocrController.list)
router.get('/documents/:id', ocrController.getById)
router.delete('/documents/:id', ocrController.remove)

export default router