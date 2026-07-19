import { investmentRepository } from '../repositories/investmentRepository'
import type { Investment } from '../types'

export const investmentService = {
    async list(userId: string): Promise<Investment[]> {
        return investmentRepository.findAll(userId)
    },

    async create(userId: string, data: Partial<Investment>): Promise<Investment> {
        if (!data.name) throw new Error('Nome do investimento é obrigatório')
        if (data.amount === undefined || data.amount === null) throw new Error('Valor é obrigatório')

        return investmentRepository.create(userId, {
            name: data.name,
            type: data.type || 'other',
            amount: data.amount,
            quantity: data.quantity ?? null,
            unit_price: data.unit_price ?? null,
            date: data.date || null,
            notes: data.notes || '',
        })
    },

    async update(userId: string, id: string, data: Partial<Investment>): Promise<Investment | null> {
        const existing = await investmentRepository.findById(userId, id)
        if (!existing) throw new Error('Investimento não encontrado')
        return investmentRepository.update(userId, id, data)
    },

    async delete(userId: string, id: string): Promise<void> {
        const existing = await investmentRepository.findById(userId, id)
        if (!existing) throw new Error('Investimento não encontrado')
        await investmentRepository.delete(userId, id)
    },

    async getByType(userId: string): Promise<{ type: string; total: number }[]> {
        const all = await investmentRepository.findAll(userId)
        const map = new Map<string, number>()
        for (const inv of all) {
            map.set(inv.type, (map.get(inv.type) || 0) + Number(inv.amount))
        }
        return Array.from(map.entries()).map(([type, total]) => ({ type, total }))
    },
}