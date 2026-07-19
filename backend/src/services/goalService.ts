import { goalRepository } from '../repositories/goalRepository'
import type { Goal } from '../types'

export const goalService = {
    async list(userId: string): Promise<Goal[]> {
        return goalRepository.findAll(userId)
    },

    async create(userId: string, data: Partial<Goal>): Promise<Goal> {
        if (!data.name || !data.target_amount) {
            throw new Error('Nome e valor da meta são obrigatórios')
        }
        return goalRepository.create(userId, {
            name: data.name,
            target_amount: data.target_amount,
            current_amount: data.current_amount ?? 0,
            deadline: data.deadline || null,
            icon: data.icon,
            color: data.color,
        })
    },

    async update(userId: string, id: string, data: Partial<Goal>): Promise<Goal | null> {
        const existing = await goalRepository.findById(userId, id)
        if (!existing) throw new Error('Meta não encontrada')
        return goalRepository.update(userId, id, data)
    },

    async delete(userId: string, id: string): Promise<void> {
        const existing = await goalRepository.findById(userId, id)
        if (!existing) throw new Error('Meta não encontrada')
        await goalRepository.delete(userId, id)
    },
}