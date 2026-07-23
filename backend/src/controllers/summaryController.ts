import { Request, Response } from 'express'
import { summaryService } from '../services/summaryService'

export const summaryController = {
    async dashboard(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const data = await summaryService.getDashboard(userId)
            return res.json({ data })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao carregar resumo' })
        }
    },

    async monthly(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id
            const months = req.query.months ? parseInt(req.query.months as string, 10) : undefined
            const data = await summaryService.getMonthly(userId, months)
            return res.json({ data })
        } catch (err: any) {
            return res.status(500).json({ error: err.message || 'Erro ao carregar resumo mensal' })
        }
    },
}