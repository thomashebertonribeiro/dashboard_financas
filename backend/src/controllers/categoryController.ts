import { Request, Response } from 'express'
import { categoryService } from '../services/categoryService'

export const categoryController = {
    async list(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await categoryService.list(userId)
            return res.json({ data })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao listar categorias' })
        }
    },

    async create(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await categoryService.create(userId, req.body)
            return res.status(201).json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao criar categoria' })
        }
    },

    async update(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await categoryService.update(userId, req.params.id, req.body)
            if (!data) return res.status(404).json({ error: 'Categoria não encontrada' })
            return res.json({ data })
        } catch (err: any) {
            return res.status(400).json({ error: err.message || 'Erro ao atualizar categoria' })
        }
    },

    async remove(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            await categoryService.delete(userId, req.params.id)
            return res.status(204).send()
        } catch (err: any) {
            if (err.message === 'Categoria não encontrada') {
                return res.status(404).json({ error: err.message })
            }
            return res.status(500).json({ error: err.message || 'Erro ao excluir categoria' })
        }
    },
}