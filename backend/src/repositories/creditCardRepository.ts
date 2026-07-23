import { supabase } from '../auth'
import type { CreditCard } from '../types'

export const creditCardRepository = {
    async findAll(userId: string): Promise<CreditCard[]> {
        const { data, error } = await supabase
            .from('credit_cards')
            .select('*')
            .eq('user_id', userId)
            .order('name', { ascending: true })
        if (error) throw error
        return data ?? []
    },

    async findById(userId: string, id: string): Promise<CreditCard | null> {
        const { data, error } = await supabase
            .from('credit_cards')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single()
        if (error) throw error
        return data
    },

    async create(userId: string, card: Partial<CreditCard>): Promise<CreditCard> {
        const { data, error } = await supabase
            .from('credit_cards')
            .insert({ ...card, user_id: userId })
            .select()
            .single()
        if (error) throw error
        return data
    },

    async update(userId: string, id: string, card: Partial<CreditCard>): Promise<CreditCard | null> {
        const { data, error } = await supabase
            .from('credit_cards')
            .update(card)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()
        if (error) throw error
        return data
    },

    async delete(userId: string, id: string): Promise<void> {
        const { error } = await supabase
            .from('credit_cards')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
        if (error) throw error
    },
}