import { useState, useEffect } from 'react'
import {
    fetchCreditCards, createCreditCard, updateCreditCard, deleteCreditCard,
    type CreditCard
} from '../lib/api'
import { CreditCard as CreditCardIcon, Plus, Pencil, Trash2, X } from 'lucide-react'

const BRAND_LABELS: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    elo: 'Elo',
    amex: 'Amex',
    hipercard: 'Hipercard',
    diners: 'Diners',
    other: 'Outra',
}

function fmt(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CreditCardsSection() {
    const [cards, setCards] = useState<CreditCard[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<CreditCard | null>(null)

    const load = async () => {
        try {
            const data = await fetchCreditCards()
            setCards(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (card: Partial<CreditCard>) => {
        if (editing) {
            await updateCreditCard(editing.id!, card)
        } else {
            await createCreditCard(card)
        }
        setShowModal(false)
        setEditing(null)
        load()
    }

    const handleDelete = async (id: string) => {
        if (confirm('Excluir este cartão?')) {
            await deleteCreditCard(id)
            load()
        }
    }

    const totalLimits = cards.reduce((s, c) => s + Number(c.limit_amount || 0), 0)

    return (
        <div className="bg-[#0d1525] border border-[#1e2d45] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CreditCardIcon className="w-4 h-4 text-[#00d4aa]" />
                    <h2 className="text-sm font-semibold text-white">Cartões de Crédito</h2>
                    {totalLimits > 0 && (
                        <span className="text-xs text-[#4b5a6e] font-mono">Limite total: {fmt(totalLimits)}</span>
                    )}
                </div>
                <button
                    onClick={() => { setEditing(null); setShowModal(true) }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#00d4aa]/10 text-[#00d4aa] hover:bg-[#00d4aa]/20 border border-[#00d4aa]/30 rounded-full transition-all"
                >
                    <Plus className="w-3 h-3" /> Novo Cartão
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-24">
                    <div className="w-6 h-6 border-2 border-[#00d4aa]/20 border-t-[#00d4aa] rounded-full animate-spin-slow" />
                </div>
            ) : cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-[#4b5a6e]">
                    <CreditCardIcon className="w-6 h-6 mb-2 opacity-50" />
                    <p className="text-xs">Nenhum cartão cadastrado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {cards.map(card => {
                        const usedPct = card.limit_amount && card.limit_amount > 0
                            ? Math.min(100, Math.round((0 / card.limit_amount) * 100)) : 0
                        return (
                            <div key={card.id} className="bg-[#151e2d] border border-[#1e2d45] rounded-2xl p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${card.color || '#60a5fa'}20` }}>
                                            <CreditCardIcon className="w-4 h-4" style={{ color: card.color || '#60a5fa' }} />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-semibold">{card.name}</p>
                                            <p className="text-[#4b5a6e] text-[10px]">{BRAND_LABELS[card.brand || 'other']}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditing(card); setShowModal(true) }} className="p-1.5 rounded-lg hover:bg-[#1e2d45] text-[#4b5a6e] hover:text-[#60a5fa] transition-all">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDelete(card.id!)} className="p-1.5 rounded-lg hover:bg-[#1e2d45] text-[#4b5a6e] hover:text-[#ff4d6d] transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-[#0d1525] rounded-xl p-2.5">
                                        <p className="text-[#4b5a6e] text-[10px]">Fechamento</p>
                                        <p className="text-white font-mono font-semibold">Dia {card.closing_day}</p>
                                    </div>
                                    <div className="bg-[#0d1525] rounded-xl p-2.5">
                                        <p className="text-[#4b5a6e] text-[10px]">Vencimento</p>
                                        <p className="text-white font-mono font-semibold">Dia {card.due_day}</p>
                                    </div>
                                </div>

                                {card.limit_amount && card.limit_amount > 0 && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#8899aa]">Limite</span>
                                            <span className="text-white font-mono">{fmt(card.limit_amount)}</span>
                                        </div>
                                        <div className="w-full bg-[#111827] rounded-full h-1.5">
                                            <div className="h-1.5 rounded-full bg-[#00d4aa]" style={{ width: `${usedPct}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {showModal && (
                <CreditCardModal
                    card={editing}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditing(null) }}
                />
            )}
        </div>
    )
}

function CreditCardModal({ card, onSave, onClose }: { card: CreditCard | null; onSave: (c: Partial<CreditCard>) => void; onClose: () => void }) {
    const [name, setName] = useState(card?.name || '')
    const [brand, setBrand] = useState(card?.brand || 'visa')
    const [closingDay, setClosingDay] = useState(String(card?.closing_day || ''))
    const [dueDay, setDueDay] = useState(String(card?.due_day || ''))
    const [limit, setLimit] = useState(String(card?.limit_amount || ''))
    const [color, setColor] = useState(card?.color || '#60a5fa')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !closingDay || !dueDay) return
        onSave({
            name,
            brand,
            closing_day: parseInt(closingDay, 10),
            due_day: parseInt(dueDay, 10),
            limit_amount: parseFloat(limit) || 0,
            color,
        })
    }

    const colors = ['#60a5fa', '#00d4aa', '#fbbf24', '#ff4d6d', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#22d3ee', '#8b5cf6']

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#151e2d] border border-[#1e2d45] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">{card ? 'Editar Cartão' : 'Novo Cartão'}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#1e2d45] text-[#4b5a6e]">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Nome</label>
                        <input value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-[#0d1525] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50 transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Bandeira</label>
                        <select value={brand} onChange={e => setBrand(e.target.value)}
                            className="w-full bg-[#0d1525] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50 transition-colors">
                            {Object.entries(BRAND_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Dia Fechamento</label>
                            <input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)}
                                className="w-full bg-[#0d1525] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50 transition-colors" />
                        </div>
                        <div>
                            <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Dia Vencimento</label>
                            <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)}
                                className="w-full bg-[#0d1525] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50 transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Limite (opcional)</label>
                        <input type="number" step="0.01" min="0" value={limit} onChange={e => setLimit(e.target.value)}
                            className="w-full bg-[#0d1525] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50 transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Cor</label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {colors.map(c => (
                                <button key={c} type="button" onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-lg transition-all ${color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#151e2d]' : ''}`}
                                    style={{ background: c }} />
                            ))}
                        </div>
                    </div>
                    <button type="submit"
                        className="w-full bg-gradient-to-r from-[#00d4aa] to-[#60a5fa] text-bg font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all mt-2">
                        {card ? 'Salvar' : 'Criar Cartão'}
                    </button>
                </form>
            </div>
        </div>
    )
}