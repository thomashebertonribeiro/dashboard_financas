import { supabase } from '../auth'
import type { OcrLog } from '../types'

export const ocrLogRepository = {
    async findByDocument(userId: string, documentId: string): Promise<OcrLog | null> {
        const { data, error } = await supabase
            .from('ocr_logs')
            .select('*')
            .eq('document_id', documentId)
            .eq('user_id', userId)
            .single()
        if (error && error.code !== 'PGRST116') throw error
        return data
    },

    async create(userId: string, log: Partial<OcrLog>): Promise<OcrLog> {
        const { data, error } = await supabase
            .from('ocr_logs')
            .insert({ ...log, user_id: userId })
            .select()
            .single()
        if (error) throw error
        return data
    },

    async update(userId: string, id: string, log: Partial<OcrLog>): Promise<OcrLog | null> {
        const { data, error } = await supabase
            .from('ocr_logs')
            .update(log)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()
        if (error) throw error
        return data
    },
}