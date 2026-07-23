import { supabase } from '../auth'
import type { Category } from '../types'

export const categoryRepository = {
    async findAll(userId: string): Promise<Category[]> {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .order('name')
        if (error) throw error
        return data ?? []
    },

    async findById(userId: string, id: string): Promise<Category | null> {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single()
        if (error) throw error
        return data
    },

    async create(userId: string, cat: Partial<Category>): Promise<Category> {
        const { data, error } = await supabase
            .from('categories')
            .insert({ ...cat, user_id: userId })
            .select()
            .single()
        if (error) throw error
        return data
    },

    async update(userId: string, id: string, cat: Partial<Category>): Promise<Category | null> {
        const { data, error } = await supabase
            .from('categories')
            .update(cat)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()
        if (error) throw error
        return data
    },

    async delete(userId: string, id: string): Promise<void> {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        if (error) throw error
    },
}