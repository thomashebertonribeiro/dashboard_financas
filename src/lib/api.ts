import { LancamentoRow } from './sheetsParser'

export interface Transaction {
    id?: string
    user_id?: string
    date: string
    type: string
    payment_method: string
    category: string
    description: string
    amount: number
    bank: string
    invoice_due_date?: string | null
    created_at?: string
}

const getHeaders = () => {
    const token = localStorage.getItem('auth_token')
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
}

export async function fetchTransactions(): Promise<LancamentoRow[]> {
    const res = await fetch('/api/transactions', { headers: getHeaders() })
    if (!res.ok) throw new Error('Falha ao carregar transações')
    
    const json = await res.json()
    // Map DB rows to LancamentoRow for compatibility with existing UI components
    return json.data.map((t: Transaction): LancamentoRow => {
        // DB date format is usually YYYY-MM-DD
        // Convert to DD/MM/YYYY if needed for the UI, or just parse it
        const [year, month, day] = t.date.split('-')
        const dataFormatada = `${day}/${month}/${year}`
        
        let vctoFormatado = ''
        if (t.invoice_due_date) {
            const parts = t.invoice_due_date.split('-')
            if (parts.length === 3) {
                const [vYear, vMonth, vDay] = parts
                if (vDay && vMonth && vYear) {
                    vctoFormatado = `${vDay}/${vMonth}/${vYear}`
                } else {
                    vctoFormatado = t.invoice_due_date
                }
            } else {
                vctoFormatado = t.invoice_due_date
            }
        }

        return {
            data: dataFormatada,
            transacao: t.type as 'Saída' | 'Entrada',
            tipoPagamento: t.payment_method || '',
            categoria: t.category || '',
            descricao: t.description || '',
            valor: Number(t.amount),
            banco: t.bank || '',
            vctoFatura: vctoFormatado,
        }
    })
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
}

export interface Investment {
    id?: string
    user_id?: string
    name: string
    type: string
    amount: number
    quantity?: number | null
    unit_price?: number | null
    date?: string | null
    notes?: string
    created_at?: string
}

export async function fetchGoals(): Promise<Goal[]> {
    const res = await fetch('/api/goals', { headers: getHeaders() })
    if (!res.ok) throw new Error('Falha ao carregar metas')
    const json = await res.json()
    return json.data ?? []
}

export async function createGoal(goal: Partial<Goal>): Promise<Goal> {
    const res = await fetch('/api/goals', {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(goal)
    })
    if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Erro ao criar meta') }
    const json = await res.json()
    return json.data
}

export async function updateGoal(id: string, goal: Partial<Goal>): Promise<Goal> {
    const res = await fetch(`/api/goals/${id}`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify(goal)
    })
    if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Erro ao atualizar meta') }
    const json = await res.json()
    return json.data
}

export async function deleteGoal(id: string): Promise<void> {
    const res = await fetch(`/api/goals/${id}`, { method: 'DELETE', headers: getHeaders() })
    if (!res.ok) throw new Error('Erro ao excluir meta')
}

export async function fetchInvestments(): Promise<Investment[]> {
    const res = await fetch('/api/investments', { headers: getHeaders() })
    if (!res.ok) throw new Error('Falha ao carregar investimentos')
    const json = await res.json()
    return json.data ?? []
}

export async function createInvestment(inv: Partial<Investment>): Promise<Investment> {
    const res = await fetch('/api/investments', {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(inv)
    })
    if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Erro ao criar investimento') }
    const json = await res.json()
    return json.data
}

export async function updateInvestment(id: string, inv: Partial<Investment>): Promise<Investment> {
    const res = await fetch(`/api/investments/${id}`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify(inv)
    })
    if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Erro ao atualizar investimento') }
    const json = await res.json()
    return json.data
}

export async function deleteInvestment(id: string): Promise<void> {
    const res = await fetch(`/api/investments/${id}`, { method: 'DELETE', headers: getHeaders() })
    if (!res.ok) throw new Error('Erro ao excluir investimento')
}

export async function importTransactions(transactions: Transaction[]): Promise<void> {
    const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(transactions)
    })
    
    if (!res.ok) {
        let errorMsg = 'Falha ao importar transações'
        try {
            const json = await res.json()
            if (json.error) errorMsg = json.error
        } catch {
            errorMsg = `Erro no servidor: ${res.status} ${res.statusText}`
        }
        throw new Error(errorMsg)
    }
}
