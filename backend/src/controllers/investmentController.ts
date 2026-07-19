import { Request, Response } from 'express'
import { investmentService } from '../services/investmentService'

export const investmentController = {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await investmentService.list(userId)
            return res.json({ data })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao listar investimentos' })
        }
    },

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await investmentService.create(userId, req.body)
            return res.status(201).json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao criar investimento' })
        }
    },

    async update(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await investmentService.update(userId, req.params.id, req.body)
            if (!data) return res.status(404).json({ error: 'Investimento não encontrado' })
            return res.json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao atualizar investimento' })
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            await investmentService.delete(userId, req.params.id)
            return res.status(204).send()
        } catch (err: any) {
            if (err.message === 'Investimento não encontrado') {
                return res.status(404).json({ error: err.message })
            }
            return res.status(500).json({ error: err.message || 'Erro ao excluir investimento' })
        }
    },

    async byType(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await investmentService.getByType(userId)
            return res.json({ data })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao agrupar investimentos' })
        }
    },
}