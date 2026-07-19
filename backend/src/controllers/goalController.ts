import { Request, Response } from 'express'
import { goalService } from '../services/goalService'

export const goalController = {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await goalService.list(userId)
            return res.json({ data })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao listar metas' })
        }
    },

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await goalService.create(userId, req.body)
            return res.status(201).json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao criar meta' })
        }
    },

    async update(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await goalService.update(userId, req.params.id, req.body)
            if (!data) return res.status(404).json({ error: 'Meta não encontrada' })
            return res.json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao atualizar meta' })
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            await goalService.delete(userId, req.params.id)
            return res.status(204).send()
        } catch (err: any) {
            if (err.message === 'Meta não encontrada') {
                return res.status(404).json({ error: err.message })
            }
            return res.status(500).json({ error: err.message || 'Erro ao excluir meta' })
        }
    },
}