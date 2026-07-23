import { Request, Response } from 'express'
import { accountService } from '../services/accountService'

export const accountController = {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await accountService.list(userId)
            return res.json({ data })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao listar contas' })
        }
    },

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await accountService.create(userId, req.body)
            return res.status(201).json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao criar conta' })
        }
    },

    async update(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await accountService.update(userId, req.params.id, req.body)
            if (!data) return res.status(404).json({ error: 'Conta não encontrada' })
            return res.json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao atualizar conta' })
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            await accountService.delete(userId, req.params.id)
            return res.status(204).send()
        } catch (err: any) {
            if (err.message === 'Conta não encontrada') {
                return res.status(404).json({ error: err.message })
            }
            return res.status(500).json({ error: err.message || 'Erro ao excluir conta' })
        }
    },
}