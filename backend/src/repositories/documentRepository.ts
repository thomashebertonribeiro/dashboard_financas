import { supabase } from '../auth'
import type { Document } from '../types'

export const documentRepository = {
    async findAll(userId: string): Promise<Document[]> {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return data ?? []
    },

    async findById(userId: string, id: string): Promise<Document | null> {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single()
        if (error) throw error
        return data
    },

    async create(userId: string, doc: Partial<Document>): Promise<Document> {
        const { data, error } = await supabase
            .from('documents')
            .insert({ ...doc, user_id: userId })
            .select()
            .single()
        if (error) throw error
        return data
    },

    async update(userId: string, id: string, doc: Partial<Document>): Promise<Document | null> {
        const { data, error } = await supabase
            .from('documents')
            .update(doc)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()
        if (error) throw error
        return data
    },

    async delete(userId: string, id: string): Promise<void> {
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        if (error) throw error
    },
}