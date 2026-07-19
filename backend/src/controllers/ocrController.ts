import { Request, Response } from 'express'
import { ocrService } from '../services/ocrService'

export const ocrController = {
    async upload(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const file = req.file
            if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado' })

            const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
            if (!allowed.includes(file.mimetype)) {
                return res.status(400).json({ error: 'Formato não suportado. Use JPEG, PNG, WebP ou PDF' })
            }

            const result = await ocrService.upload(userId, file)
            return res.status(201).json({ data: result })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao fazer upload' })
        }
    },

    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await ocrService.listDocuments(userId)
            return res.json({ data })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao listar documentos' })
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await ocrService.getDocumentWithOcr(userId, req.params.id)
            if (!data) return res.status(404).json({ error: 'Documento não encontrado' })
            return res.json({ data })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao buscar documento' })
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            await ocrService.deleteDocument(userId, req.params.id)
            return res.status(204).send()
        } catch (err: any) {
            if (err.message === 'Documento não encontrado') {
                return res.status(404).json({ error: err.message })
            }
            return res.status(500).json({ error: err.message || 'Erro ao excluir documento' })
        }
    },
}