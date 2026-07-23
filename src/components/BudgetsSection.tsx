import { useState, useEffect } from 'react'
import {
    fetchBudgets, createBudget, updateBudget, deleteBudget,
    type Budget
} from '../lib/api'
import { PiggyBank, Plus, Pencil, Trash2, X } from 'lucide-react'

function fmt(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const COLORS = ['#00d4aa', '#60a5fa', '#fbbf24', '#ff4d6d', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#22d3ee', '#8b5cf6']

export function BudgetsSection() {
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<Budget | null>(null)

    const load = async () => {
        try {
            const data = await fetchBudgets()
            setBudgets(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (budget: Partial<Budget>) => {
        if (editing) {
            await updateBudget(editing.id!, budget)
        } else {
            await createBudget(budget)
        }
        setShowModal(false)
        setEditing(null)
        load()
    }

    const handleDelete = async (id: string) => {
        if (confirm('Excluir este orçamento?')) {
            await deleteBudget(id)
            load()
        }
    }

    const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0)
    const totalSpent = budgets.reduce((s, b) => s + Number(b.spent || 0), 0)
    const onBudget = budgets.filter(b => (b.pct || 0) <= 100).length
    const overBudget = budgets.filter(b => (b.pct || 0) > 100).length

    return (
        <div className="bg-[#0d1525] border border-[#1e2d45] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-[#00d4aa]" />
                    <h2 className="text-sm font-semibold text-white">Orçamentos</h2>
                    {totalBudget > 0 && (
                        <span className="text-xs text-[#4b5a6e] font-mono">
                            {fmt(totalSpent)} / {fmt(totalBudget)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {overBudget > 0 && (
                        <span className="text-[10px] bg-[#ff4d6d]/10 text-[#ff4d6d] border border-[#ff4d6d]/30 px-2 py-0.5 rounded-full">
                            {overBudget} estourados
                        </span>
                    )}
                    <button
                        onClick={() => { setEditing(null); setShowModal(true) }}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#00d4aa]/10 text-[#00d4aa] hover:bg-[#00d4aa]/20 border border-[#00d4aa]/30 rounded-full transition-all"
                    >
                        <Plus className="w-3 h-3" /> Novo Orçamento
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-24">
                    <div className="w-6 h-6 border-2 border-[#00d4aa]/20 border-t-[#00d4aa] rounded-full animate-spin-slow" />
                </div>
            ) : budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-[#4b5a6e]">
                    <PiggyBank className="w-6 h-6 mb-2 opacity-50" />
                    <p className="text-xs">Nenhum orçamento definido</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Cabeçalho */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">
                        <div className="col-span-3">Categoria</div>
                        <div className="col-span-2 text-right">Orçado</div>
                        <div className="col-span-2 text-right">Gasto</div>
                        <div className="col-span-4">Progresso</div>
                        <div className="col-span-1" />
                    </div>

                    {budgets.map((b, i) => {
                        const pct = Math.min(b.pct || 0, 100)
                        const isOver = (b.pct || 0) > 100
                        const color = isOver ? '#ff4d6d' : COLORS[i % COLORS.length]

                        return (
                            <div key={b.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-xl bg-[#151e2d] border border-[#1e2d45] hover:border-[#2a3a52] transition-all">
                                <div className="col-span-3 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                                    <span className="text-white text-sm truncate">{b.category}</span>
                                </div>
                                <div className="col-span-2 text-right text-white text-sm font-mono">{fmt(b.amount)}</div>
                                <div className={`col-span-2 text-right text-sm font-mono ${isOver ? 'text-[#ff4d6d]' : 'text-[#8899aa]'}`}>
                                    {fmt(b.spent || 0)}
                                </div>
                                <div className="col-span-4 space-y-0.5">
                                    <div className="w-full bg-[#111827] rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(pct, 100)}%`, background: isOver ? '#ff4d6d' : color }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                        <span style={{ color: isOver ? '#ff4d6d' : color }}>{b.pct}%</span>
                                        {isOver && <span className="text-[#ff4d6d]">Excedeu {fmt(Number(b.spent) - Number(b.amount))}</span>}
                                    </div>
                                </div>
                                <div className="col-span-1 flex gap-1 justify-end">
                                    <button onClick={() => { setEditing(b); setShowModal(true) }} className="p-1 rounded hover:bg-[#1e2d45] text-[#4b5a6e] hover:text-[#60a5fa] transition-all">
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => handleDelete(b.id!)} className="p-1 rounded hover:bg-[#1e2d45] text-[#4b5a6e] hover:text-[#ff4d6d] transition-all">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {showModal && (
                <BudgetModal
                    budget={editing}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditing(null) }}
                />
            )}
        </div>
    )
}

function BudgetModal({ budget, onSave, onClose }: { budget: Budget | null; onSave: (b: Partial<Budget>) => void; onClose: () => void }) {
    const [category, setCategory] = useState(budget?.category || '')
    const [amount, setAmount] = useState(String(budget?.amount || ''))
    const [period, setPeriod] = useState(budget?.period || 'monthly')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!category || !amount) return
        onSave({
            category,
            amount: parseFloat(amount),
            period: period as 'monthly' | 'yearly' | 'custom',
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#151e2d] border border-[#1e2d45] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">{budget ? 'Editar Orçamento' : 'Novo Orçamento'}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#1e2d45] text-[#4b5a6e]">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Categoria</label>
                        <input value={category} onChange={e => setCategory(e.target.value)}
                            className="w-full bg-[#0d1525] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50 transition-colors"
                            placeholder="Ex: Alimentação, Transporte..." />
                    </div>
                    <div>
                        <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Valor Mensal</label>
                        <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)}
                            className="w-full bg-[#0d1525] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50 transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Período</label>
                        <select value={period} onChange={e => setPeriod(e.target.value as 'monthly' | 'yearly' | 'custom')}
                            className="w-full bg-[#0d1525] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50 transition-colors">
                            <option value="monthly">Mensal</option>
                            <option value="yearly">Anual</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>
                    <button type="submit"
                        className="w-full bg-gradient-to-r from-[#00d4aa] to-[#60a5fa] text-bg font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all mt-2">
                        {budget ? 'Salvar' : 'Criar Orçamento'}
                    </button>
                </form>
            </div>
        </div>
    )
}