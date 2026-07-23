import { supabase } from '../auth'
import type { MonthlySummary } from '../types'

export const summaryRepository = {
    async getMonthly(userId: string, months?: number): Promise<MonthlySummary[]> {
        let query = supabase
            .from('monthly_summary')
            .select('*')
            .eq('user_id', userId)
            .order('month', { ascending: false })

        if (months) {
            const cutoff = new Date()
            cutoff.setMonth(cutoff.getMonth() - months)
            query = query.gte('month', cutoff.toISOString().slice(0, 10))
        }

        const { data, error } = await query
        if (error) throw error
        return data ?? []
    },

    async getCurrentMonth(userId: string): Promise<MonthlySummary | null> {
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

        const { data, error } = await supabase
            .from('monthly_summary')
            .select('*')
            .eq('user_id', userId)
            .eq('month', firstDay)
            .single()
        if (error && error.code !== 'PGRST116') throw error
        return data ?? null
    },
}