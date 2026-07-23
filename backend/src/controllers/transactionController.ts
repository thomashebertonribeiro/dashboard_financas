import { Request, Response } from 'express'
import { transactionService } from '../services/transactionService'

export const transactionController = {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await transactionService.list(userId)
            return res.json({ data })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao listar transações' })
        }
    },

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await transactionService.create(userId, req.body)
            return res.status(201).json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao criar transação' })
        }
    },

    async update(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await transactionService.update(userId, req.params.id, req.body)
            if (!data) return res.status(404).json({ error: 'Transação não encontrada' })
            return res.json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao atualizar transação' })
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            await transactionService.delete(userId, req.params.id)
            return res.status(204).send()
        } catch (err: any) {
            if (err.message === 'Transação não encontrada') {
                return res.status(404).json({ error: err.message })
            }
            return res.status(500).json({ error: err.message || 'Erro ao excluir transação' })
        }
    },
}