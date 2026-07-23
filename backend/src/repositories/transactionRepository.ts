import { supabase } from '../auth'
import type { Transaction } from '../types'

export const transactionRepository = {
    async findAll(userId: string): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
        if (error) throw error
        return data ?? []
    },

    async findById(userId: string, id: string): Promise<Transaction | null> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single()
        if (error) throw error
        return data
    },

    async create(userId: string, tx: Partial<Transaction>): Promise<Transaction> {
        const { data, error } = await supabase
            .from('transactions')
            .insert({ ...tx, user_id: userId })
            .select()
            .single()
        if (error) throw error
        return data
    },

    async createMany(userId: string, txs: Partial<Transaction>[]): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .insert(txs.map(t => ({ ...t, user_id: userId })))
            .select()
        if (error) throw error
        return data ?? []
    },

    async update(userId: string, id: string, tx: Partial<Transaction>): Promise<Transaction | null> {
        const { data, error } = await supabase
            .from('transactions')
            .update(tx)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()
        if (error) throw error
        return data
    },

    async delete(userId: string, id: string): Promise<void> {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        if (error) throw error
    },
}