import { budgetRepository } from '../repositories/budgetRepository'
import type { Budget } from '../types'

export const budgetService = {
    async list(userId: string): Promise<(Budget & { spent: number; pct: number })[]> {
        const budgets = await budgetRepository.findAll(userId)
        if (budgets.length === 0) return []

        const now = new Date()
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

        const spending = await budgetRepository.getSpendingByCategory(userId, startDate, endDate)
        const spendingMap = new Map(spending.map(s => [s.category, s.total]))

        return budgets.map(b => {
            const spent = spendingMap.get(b.category) || 0
            const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0
            return { ...b, spent, pct }
        })
    },

    async create(userId: string, data: Partial<Budget>): Promise<Budget> {
        if (!data.category) throw new Error('Categoria é obrigatória')
        if (!data.amount || data.amount <= 0) throw new Error('Valor deve ser maior que zero')

        return budgetRepository.create(userId, {
            category: data.category,
            amount: data.amount,
            period: data.period || 'monthly',
            start_date: data.start_date || null,
            end_date: data.end_date || null,
        })
    },

    async update(userId: string, id: string, data: Partial<Budget>): Promise<Budget | null> {
        const existing = await budgetRepository.findById(userId, id)
        if (!existing) throw new Error('Orçamento não encontrado')
        return budgetRepository.update(userId, id, data)
    },

    async delete(userId: string, id: string): Promise<void> {
        const existing = await budgetRepository.findById(userId, id)
        if (!existing) throw new Error('Orçamento não encontrado')
        await budgetRepository.delete(userId, id)
    },
}