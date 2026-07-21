import { transactionRepository } from '../repositories/transactionRepository'
import { categoryRepository } from '../repositories/categoryRepository'
import type { Transaction } from '../types'

export const transactionService = {
    async list(userId: string): Promise<Transaction[]> {
        return transactionRepository.findAll(userId)
    },

    async create(userId: string, txs: Partial<Transaction> | Partial<Transaction>[]): Promise<Transaction[]> {
        const items = Array.isArray(txs) ? txs : [txs]
        const valid = items.map(t => ({
            date: t.date,
            type: t.type,
            description: t.description || '',
            amount: t.amount,
            category: t.category || '',
            payment_method: t.payment_method || '',
            bank: t.bank || '',
            account_id: t.account_id || null,
            credit_card_id: t.credit_card_id || null,
            invoice_due_date: t.invoice_due_date || null,
            is_recurring: t.is_recurring || false,
            notes: t.notes || '',
        }))

        // Dedup: fetch existing and filter out matches on (date, description, amount, type)
        const existing = await transactionRepository.findAll(userId)
        const existingKeys = new Set(
            existing.map(e => `${e.date}|${e.description}|${e.amount}|${e.type}`)
        )
        const toInsert = valid.filter(v => {
            const key = `${v.date}|${v.description}|${v.amount}|${v.type}`
            return !existingKeys.has(key)
        })

        if (toInsert.length === 0) return []

        return transactionRepository.createMany(userId, toInsert)
    },

    async update(userId: string, id: string, tx: Partial<Transaction>): Promise<Transaction | null> {
        const existing = await transactionRepository.findById(userId, id)
        if (!existing) throw new Error('Transação não encontrada')
        return transactionRepository.update(userId, id, tx)
    },

    async delete(userId: string, id: string): Promise<void> {
        const existing = await transactionRepository.findById(userId, id)
        if (!existing) throw new Error('Transação não encontrada')
        await transactionRepository.delete(userId, id)
    },
}