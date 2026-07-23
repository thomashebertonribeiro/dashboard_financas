import { accountRepository } from '../repositories/accountRepository'
import type { Account } from '../types'

export const accountService = {
    async list(userId: string): Promise<Account[]> {
        return accountRepository.findAll(userId)
    },

    async create(userId: string, data: Partial<Account>): Promise<Account> {
        if (!data.name) throw new Error('Nome é obrigatório')
        return accountRepository.create(userId, {
            name: data.name,
            type: data.type || 'checking',
            balance: data.balance ?? 0,
            color: data.color,
        })
    },

    async update(userId: string, id: string, data: Partial<Account>): Promise<Account | null> {
        const existing = await accountRepository.findById(userId, id)
        if (!existing) throw new Error('Conta não encontrada')
        return accountRepository.update(userId, id, data)
    },

    async delete(userId: string, id: string): Promise<void> {
        const existing = await accountRepository.findById(userId, id)
        if (!existing) throw new Error('Conta não encontrada')
        await accountRepository.delete(userId, id)
    },
}