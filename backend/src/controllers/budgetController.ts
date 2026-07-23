import { Request, Response } from 'express'
import { budgetService } from '../services/budgetService'

export const budgetController = {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await budgetService.list(userId)
            return res.json({ data })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao listar orçamentos' })
        }
    },

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await budgetService.create(userId, req.body)
            return res.status(201).json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao criar orçamento' })
        }
    },

    async update(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await budgetService.update(userId, req.params.id, req.body)
            if (!data) return res.status(404).json({ error: 'Orçamento não encontrado' })
            return res.json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao atualizar orçamento' })
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            await budgetService.delete(userId, req.params.id)
            return res.status(204).send()
        } catch (err: any) {
            if (err.message === 'Orçamento não encontrado') {
                return res.status(404).json({ error: err.message })
            }
            return res.status(500).json({ error: err.message || 'Erro ao excluir orçamento' })
        }
    },
}