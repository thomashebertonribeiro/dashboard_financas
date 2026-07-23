import { creditCardRepository } from '../repositories/creditCardRepository'
import type { CreditCard } from '../types'

const VALID_BRANDS = ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'diners', 'other']

export const creditCardService = {
    async list(userId: string): Promise<CreditCard[]> {
        return creditCardRepository.findAll(userId)
    },

    async create(userId: string, data: Partial<CreditCard>): Promise<CreditCard> {
        if (!data.name) throw new Error('Nome do cartão é obrigatório')
        if (!data.closing_day || data.closing_day < 1 || data.closing_day > 31) {
            throw new Error('Dia de fechamento deve ser entre 1 e 31')
        }
        if (!data.due_day || data.due_day < 1 || data.due_day > 31) {
            throw new Error('Dia de vencimento deve ser entre 1 e 31')
        }
        if (data.brand && !VALID_BRANDS.includes(data.brand)) {
            throw new Error('Bandeira inválida')
        }

        return creditCardRepository.create(userId, {
            name: data.name,
            brand: data.brand || 'other',
            closing_day: data.closing_day,
            due_day: data.due_day,
            limit_amount: data.limit_amount || 0,
            color: data.color,
        })
    },

    async update(userId: string, id: string, data: Partial<CreditCard>): Promise<CreditCard | null> {
        const existing = await creditCardRepository.findById(userId, id)
        if (!existing) throw new Error('Cartão não encontrado')

        if (data.closing_day && (data.closing_day < 1 || data.closing_day > 31)) {
            throw new Error('Dia de fechamento deve ser entre 1 e 31')
        }
        if (data.due_day && (data.due_day < 1 || data.due_day > 31)) {
            throw new Error('Dia de vencimento deve ser entre 1 e 31')
        }

        return creditCardRepository.update(userId, id, data)
    },

    async delete(userId: string, id: string): Promise<void> {
        const existing = await creditCardRepository.findById(userId, id)
        if (!existing) throw new Error('Cartão não encontrado')
        await creditCardRepository.delete(userId, id)
    },
}