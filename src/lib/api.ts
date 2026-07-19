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
            const [vYear, vMonth, vDay] = t.invoice_due_date.split('-')
            vctoFormatado = `${vDay}/${vMonth}/${vYear}`
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

export async function importTransactions(transactions: Transaction[]): Promise<void> {
    const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(transactions)
    })
    
    if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Falha ao importar transações')
    }
}
