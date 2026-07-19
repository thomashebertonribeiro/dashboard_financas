import { supabase } from '../auth'
import type { Investment } from '../types'

export const investmentRepository = {
    async findAll(userId: string): Promise<Investment[]> {
        const { data, error } = await supabase
            .from('investments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data ?? []
    },

    async findById(userId: string, id: string): Promise<Investment | null> {
        const { data, error } = await supabase
            .from('investments')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single()
        if (error) throw error
        return data
    },

    async create(userId: string, inv: Partial<Investment>): Promise<Investment> {
        const { data, error } = await supabase
            .from('investments')
            .insert({ ...inv, user_id: userId })
            .select()
            .single()
        if (error) throw error
        return data
    },

    async update(userId: string, id: string, inv: Partial<Investment>): Promise<Investment | null> {
        const { data, error } = await supabase
            .from('investments')
            .update(inv)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()
        if (error) throw error
        return data
    },

    async delete(userId: string, id: string): Promise<void> {
        const { error } = await supabase
            .from('investments')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        if (error) throw error
    },
}