import { categoryRepository } from '../repositories/categoryRepository'
import type { Category } from '../types'

export const categoryService = {
    async list(userId: string): Promise<Category[]> {
        return categoryRepository.findAll(userId)
    },

    async create(userId: string, data: Partial<Category>): Promise<Category> {
        if (!data.name || !data.type) {
            throw new Error('Nome e tipo são obrigatórios')
        }
        if (!['Saída', 'Entrada'].includes(data.type)) {
            throw new Error('Tipo deve ser Saída ou Entrada')
        }
        return categoryRepository.create(userId, data)
    },

    async update(userId: string, id: string, data: Partial<Category>): Promise<Category | null> {
        const existing = await categoryRepository.findById(userId, id)
        if (!existing) throw new Error('Categoria não encontrada')
        return categoryRepository.update(userId, id, data)
    },

    async delete(userId: string, id: string): Promise<void> {
        const existing = await categoryRepository.findById(userId, id)
        if (!existing) throw new Error('Categoria não encontrada')
        await categoryRepository.delete(userId, id)
    },
}