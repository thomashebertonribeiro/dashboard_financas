import { summaryRepository } from '../repositories/summaryRepository'
import { transactionRepository } from '../repositories/transactionRepository'
import type { MonthlySummary } from '../types'

export const summaryService = {
    async getMonthly(userId: string, months?: number): Promise<MonthlySummary[]> {
        return summaryRepository.getMonthly(userId, months)
    },

    async getDashboard(userId: string) {
        const summaries = await summaryRepository.getMonthly(userId, 6)
        const currentMonth = summaries[0] ?? null

        const txs = await transactionRepository.findAll(userId)

        const totalEntries = txs.filter(t => t.type === 'Entrada').reduce((s, t) => s + Number(t.amount), 0)
        const totalExpenses = txs.filter(t => t.type === 'Saída').reduce((s, t) => s + Number(t.amount), 0)
        const balance = totalEntries - totalExpenses

        const creditSpending = txs
            .filter(t => t.type === 'Saída' && t.credit_card_id)
            .reduce((s, t) => s + Number(t.amount), 0)

        return {
            currentMonth: currentMonth
                ? { month: currentMonth.month, entries: currentMonth.total_entries, expenses: currentMonth.total_expenses, balance: currentMonth.balance }
                : null,
            totalEntries,
            totalExpenses,
            balance,
            creditSpending,
            monthlyHistory: summaries,
        }
    },
}