import { useState, useEffect } from 'react'
import {
    fetchInvestments, createInvestment, updateInvestment, deleteInvestment,
    type Investment
} from '../lib/api'
import { TrendingUp, Plus, Pencil, Trash2, X, PieChart } from 'lucide-react'
import { ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Tooltip } from 'recharts'
import { useToast } from '../context/ToastContext'
import { PieTooltip } from './PieTooltip'

function fmt(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const TYPE_LABELS: Record<string, string> = {
    stocks: 'Ações',
    reits: 'FIIs',
    crypto: 'Cripto',
    fixed_income: 'Renda Fixa',
    mutual_fund: 'Fundos',
    international: 'Internacional',
    pension: 'Previdência',
    other: 'Outros',
}

const TYPE_COLORS: Record<string, string> = {
    stocks: '#60a5fa',
    reits: '#00d4aa',
    crypto: '#fbbf24',
    fixed_income: '#a78bfa',
    mutual_fund: '#34d399',
    international: '#fb923c',
    pension: '#f472b6',
    other: '#4b5a6e',
}

function InvestmentRow({ inv, onEdit, onDelete }: { inv: Investment; onEdit: (i: Investment) => void; onDelete: (id: string) => void }) {
    return (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-surface border border-border hover:border-[#2a3a52] transition-all">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: TYPE_COLORS[inv.type] || '#4b5a6e' }} />
                <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{inv.name}</p>
                    <p className="text-muted text-[10px]">{TYPE_LABELS[inv.type] || inv.type}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                    <p className="text-white text-sm font-mono font-semibold">{fmt(Number(inv.amount))}</p>
                    {inv.quantity && inv.unit_price && (
                        <p className="text-muted text-[10px]">{inv.quantity} × {fmt(Number(inv.unit_price))}</p>
                    )}
                </div>
                <div className="flex gap-1">
                    <button onClick={() => onEdit(inv)} className="p-1.5 rounded-lg hover:bg-border text-muted hover:text-info transition-all">
                        <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDelete(inv.id!)} className="p-1.5 rounded-lg hover:bg-border text-muted hover:text-danger transition-all">
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export function InvestmentsSection() {
    const [investments, setInvestments] = useState<Investment[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<Investment | null>(null)
    const { addToast } = useToast()

    const load = async () => {
        try {
            const data = await fetchInvestments()
            setInvestments(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (inv: Partial<Investment>) => {
        if (editing) {
            await updateInvestment(editing.id!, inv)
        } else {
            await createInvestment(inv)
        }
        setShowModal(false)
        setEditing(null)
        load()
    }

    const handleDelete = async (id: string) => {
        await deleteInvestment(id)
        load()
        addToast('warning', 'Investimento excluído')
    }

    const totalInvestido = investments.reduce((s, i) => s + Number(i.amount), 0)

    const byType = investments.reduce<Record<string, number>>((acc, inv) => {
        acc[inv.type] = (acc[inv.type] || 0) + Number(inv.amount)
        return acc
    }, {})

    const pieData = Object.entries(byType).map(([type, value]) => ({
        name: TYPE_LABELS[type] || type,
        value,
    }))

    return (
        <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    <h2 className="text-sm font-semibold text-white">Investimentos</h2>
                    <span className="text-xs text-muted font-mono">Total: {fmt(totalInvestido)}</span>
                </div>
                <button
                    onClick={() => { setEditing(null); setShowModal(true) }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-accent-dim text-accent hover:bg-accent/20 border border-accent/30 rounded-full transition-all"
                >
                    <Plus className="w-3 h-3" /> Novo Investimento
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-24">
                    <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin-slow" />
                </div>
            ) : investments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-muted">
                    <TrendingUp className="w-6 h-6 mb-2 opacity-50" />
                    <p className="text-xs">Nenhum investimento registrado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    {/* Lista */}
                    <div className="xl:col-span-2 space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                        {investments.map(inv => (
                            <InvestmentRow key={inv.id} inv={inv} onEdit={(i) => { setEditing(i); setShowModal(true) }} onDelete={handleDelete} />
                        ))}
                    </div>

                    {/* Gráfico por tipo */}
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <PieChart className="w-4 h-4 text-accent" />
                            <span className="text-xs text-subtle font-medium">Por Tipo</span>
                        </div>
                        {pieData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={160}>
                                    <RPieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" paddingAngle={3}>
                                            {pieData.map((_, i) => {
                                                const type = Object.keys(byType)[i]
                                                return <Cell key={i} fill={TYPE_COLORS[type] || '#4b5a6e'} stroke="transparent" />
                                            })}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </RPieChart>
                                </ResponsiveContainer>
                                <div className="space-y-1.5 mt-2">
                                    {pieData.map((item, i) => {
                                        const type = Object.keys(byType)[i]
                                        return (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[type] || '#4b5a6e' }} />
                                                    <span className="text-subtle">{item.name}</span>
                                                </div>
                                                <span className="text-white font-mono">{fmt(item.value)}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-40 text-muted text-xs">Sem dados</div>
                        )}
                    </div>
                </div>
            )}

            {showModal && (
                <InvestmentModal
                    investment={editing}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditing(null) }}
                />
            )}
        </div>
    )
}

function InvestmentModal({ investment, onSave, onClose }: { investment: Investment | null; onSave: (i: Partial<Investment>) => void; onClose: () => void }) {
    const [name, setName] = useState(investment?.name || '')
    const [type, setType] = useState(investment?.type || 'stocks')
    const [amount, setAmount] = useState(String(investment?.amount || ''))
    const [quantity, setQuantity] = useState(String(investment?.quantity || ''))
    const [unitPrice, setUnitPrice] = useState(String(investment?.unit_price || ''))
    const [date, setDate] = useState(investment?.date?.split('T')[0] || '')
    const [notes, setNotes] = useState(investment?.notes || '')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !amount) return
        onSave({
            name,
            type,
            amount: parseFloat(amount),
            quantity: quantity ? parseFloat(quantity) : null,
            unit_price: unitPrice ? parseFloat(unitPrice) : null,
            date: date || null,
            notes,
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">{investment ? 'Editar Investimento' : 'Novo Investimento'}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-border text-muted">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Nome</label>
                        <input value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Tipo</label>
                        <select value={type} onChange={e => setType(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors">
                            {Object.entries(TYPE_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Valor Total</label>
                        <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Quantidade</label>
                            <input type="number" step="any" min="0" value={quantity} onChange={e => setQuantity(e.target.value)}
                                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors" />
                        </div>
                        <div>
                            <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Preço Unit.</label>
                            <input type="number" step="0.01" min="0" value={unitPrice} onChange={e => setUnitPrice(e.target.value)}
                                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Data (opcional)</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Observações</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors resize-none" />
                    </div>
                    <button type="submit"
                        className="w-full bg-gradient-to-r from-accent to-info text-bg font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all mt-2">
                        {investment ? 'Salvar' : 'Criar Investimento'}
                    </button>
                </form>
            </div>
        </div>
    )
}