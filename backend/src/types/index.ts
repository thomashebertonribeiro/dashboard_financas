export interface Transaction {
    id?: string
    user_id?: string
    date: string
    type: 'Saída' | 'Entrada'
    description?: string
    amount: number
    category?: string
    payment_method?: string
    bank?: string
    account_id?: string | null
    credit_card_id?: string | null
    invoice_due_date?: string | null
    is_recurring?: boolean
    notes?: string
    created_at?: string
    updated_at?: string
}

export interface Category {
    id?: string
    user_id?: string
    name: string
    type: 'Saída' | 'Entrada'
    color?: string
    icon?: string
    created_at?: string
}

export interface Account {
    id?: string
    user_id?: string
    name: string
    type: 'checking' | 'savings' | 'cash' | 'investment' | 'other'
    balance?: number
    color?: string
    created_at?: string
    updated_at?: string
}

export interface CreditCard {
    id?: string
    user_id?: string
    name: string
    brand?: string
    closing_day: number
    due_day: number
    limit_amount?: number
    color?: string
    created_at?: string
    updated_at?: string
}

export interface Budget {
    id?: string
    user_id?: string
    category: string
    amount: number
    period: 'monthly' | 'yearly' | 'custom'
    start_date?: string | null
    end_date?: string | null
    created_at?: string
    updated_at?: string
}

export interface Goal {
    id?: string
    user_id?: string
    name: string
    target_amount: number
    current_amount?: number
    deadline?: string | null
    icon?: string
    color?: string
    created_at?: string
    updated_at?: string
}

export interface Investment {
    id?: string
    user_id?: string
    name: string
    type: 'stock' | 'fund' | 'treasury' | 'crypto' | 'fixed_income' | 'property' | 'other'
    amount: number
    quantity?: number | null
    unit_price?: number | null
    date?: string | null
    notes?: string
    created_at?: string
    updated_at?: string
}

export interface MonthlySummary {
    user_id: string
    month: string
    entries_count: number
    expenses_count: number
    total_entries: number
    total_expenses: number
    balance: number
}

export interface Document {
    id?: string
    user_id?: string
    transaction_id?: string | null
    file_name: string
    file_path: string
    file_size?: number | null
    mime_type?: string | null
    created_at?: string
}

export interface OcrLog {
    id?: string
    user_id?: string
    document_id?: string
    raw_text?: string | null
    parsed_data?: Record<string, unknown> | null
    confidence?: number | null
    status: 'pending' | 'processing' | 'completed' | 'failed'
    error_message?: string | null
    processing_time_ms?: number | null
    created_at?: string
}

export interface ApiResponse<T = unknown> {
    data?: T
    error?: string
}