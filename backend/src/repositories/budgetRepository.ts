import { supabase } from '../auth'
import type { Budget } from '../types'

export const budgetRepository = {
    async findAll(userId: string): Promise<Budget[]> {
        const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data ?? []
    },

    async findById(userId: string, id: string): Promise<Budget | null> {
        const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single()
        if (error) throw error
        return data
    },

    async create(userId: string, budget: Partial<Budget>): Promise<Budget> {
        const { data, error } = await supabase
            .from('budgets')
            .insert({ ...budget, user_id: userId })
            .select()
            .single()
        if (error) throw error
        return data
    },

    async update(userId: string, id: string, budget: Partial<Budget>): Promise<Budget | null> {
        const { data, error } = await supabase
            .from('budgets')
            .update(budget)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()
        if (error) throw error
        return data
    },

    async delete(userId: string, id: string): Promise<void> {
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        if (error) throw error
    },

    async getSpendingByCategory(userId: string, startDate: string, endDate: string): Promise<{ category: string; total: number }[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('category, amount')
            .eq('user_id', userId)
            .eq('type', 'Saída')
            .gte('date', startDate)
            .lte('date', endDate)
        if (error) throw error

        const map = new Map<string, number>()
        for (const row of data ?? []) {
            map.set(row.category, (map.get(row.category) || 0) + Number(row.amount))
        }
        return Array.from(map.entries()).map(([category, total]) => ({ category, total }))
    },
}