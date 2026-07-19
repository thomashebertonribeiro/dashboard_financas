import { supabase } from '../auth'
import type { Goal } from '../types'

export const goalRepository = {
    async findAll(userId: string): Promise<Goal[]> {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data ?? []
    },

    async findById(userId: string, id: string): Promise<Goal | null> {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single()
        if (error) throw error
        return data
    },

    async create(userId: string, goal: Partial<Goal>): Promise<Goal> {
        const { data, error } = await supabase
            .from('goals')
            .insert({ ...goal, user_id: userId })
            .select()
            .single()
        if (error) throw error
        return data
    },

    async update(userId: string, id: string, goal: Partial<Goal>): Promise<Goal | null> {
        const { data, error } = await supabase
            .from('goals')
            .update(goal)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()
        if (error) throw error
        return data
    },

    async delete(userId: string, id: string): Promise<void> {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        if (error) throw error
    },
}