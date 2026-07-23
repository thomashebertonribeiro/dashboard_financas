import { Request, Response } from 'express'
import { creditCardService } from '../services/creditCardService'

export const creditCardController = {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await creditCardService.list(userId)
            return res.json({ data })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao listar cartões' })
        }
    },

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await creditCardService.create(userId, req.body)
            return res.status(201).json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao criar cartão' })
        }
    },

    async update(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await creditCardService.update(userId, req.params.id, req.body)
            if (!data) return res.status(404).json({ error: 'Cartão não encontrado' })
            return res.json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao atualizar cartão' })
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            await creditCardService.delete(userId, req.params.id)
            return res.status(204).send()
        } catch (err: any) {
            if (err.message === 'Cartão não encontrado') {
                return res.status(404).json({ error: err.message })
            }
            return res.status(500).json({ error: err.message || 'Erro ao excluir cartão' })
        }
    },
}