import { supabase } from '../auth'
import type { Account } from '../types'

export const accountRepository = {
    async findAll(userId: string): Promise<Account[]> {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', userId)
            .order('name')
        if (error) throw error
        return data ?? []
    },

    async findById(userId: string, id: string): Promise<Account | null> {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single()
        if (error) throw error
        return data
    },

    async create(userId: string, acc: Partial<Account>): Promise<Account> {
        const { data, error } = await supabase
            .from('accounts')
            .insert({ ...acc, user_id: userId })
            .select()
            .single()
        if (error) throw error
        return data
    },

    async update(userId: string, id: string, acc: Partial<Account>): Promise<Account | null> {
        const { data, error } = await supabase
            .from('accounts')
            .update(acc)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()
        if (error) throw error
        return data
    },

    async delete(userId: string, id: string): Promise<void> {
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        if (error) throw error
    },
}