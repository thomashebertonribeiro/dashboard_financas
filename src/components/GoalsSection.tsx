import { useState, useEffect } from 'react'
import {
    fetchGoals, createGoal, updateGoal, deleteGoal,
    type Goal
} from '../lib/api'
import { Target, Plus, Pencil, Trash2, X, TrendingUp, Calendar } from 'lucide-react'

function fmt(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: (g: Goal) => void; onDelete: (id: string) => void }) {
    const pct = goal.target_amount > 0 ? Math.min(100, Math.round((Number(goal.current_amount || 0) / goal.target_amount) * 100)) : 0
    const remaining = Number(goal.target_amount) - Number(goal.current_amount || 0)

    return (
        <div className="bg-[#151e2d] border border-[#1e2d45] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg" style={{ background: `${goal.color || '#00d4aa'}20` }}>
                        {goal.icon || '🎯'}
                    </div>
                    <div>
                        <p className="text-white text-sm font-semibold">{goal.name}</p>
                        {goal.deadline && (
                            <p className="text-[#4b5a6e] text-[10px] flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => onEdit(goal)} className="p-1.5 rounded-lg hover:bg-[#1e2d45] text-[#4b5a6e] hover:text-[#60a5fa] transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(goal.id!)} className="p-1.5 rounded-lg hover:bg-[#1e2d45] text-[#4b5a6e] hover:text-[#ff4d6d] transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                    <span className="text-[#8899aa]">{fmt(Number(goal.current_amount || 0))}</span>
                    <span className="text-[#4b5a6e]">de {fmt(goal.target_amount)}</span>
                </div>
                <div className="w-full bg-[#111827] rounded-full h-2">
                    <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: pct >= 100 ? '#00d4aa' : (goal.color || '#60a5fa') }}
                    />
                </div>
                <div className="flex justify-between text-[10px]">
                    <span className="text-[#00d4aa]">{pct}%</span>
                    {remaining > 0 && <span className="text-[#4b5a6e]">Faltam {fmt(remaining)}</span>}
                    {pct >= 100 && <span className="text-[#00d4aa]">Completo!</span>}
                </div>
            </div>
        </div>
    )
}

export function GoalsSection() {
    const [goals, setGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState<Goal | null>(null)

    const load = async () => {
        try {
            const data = await fetchGoals()
            setGoals(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (goal: Partial<Goal>) => {
        if (editing) {
            await updateGoal(editing.id!, goal)
        } else {
            await createGoal(goal)
        }
        setShowModal(false)
        setEditing(null)
        load()
    }

    const handleDelete = async (id: string) => {
        if (confirm('Excluir esta meta?')) {
            await deleteGoal(id)
            load()
        }
    }

    return (
        <div className="bg-[#0d1525] border border-[#1e2d45] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#00d4aa]" />
                    <h2 className="text-sm font-semibold text-white">Metas</h2>
                </div>
                <button
                    onClick={() => { setEditing(null); setShowModal(true) }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#00d4aa]/10 text-[#00d4aa] hover:bg-[#00d4aa]/20 border border-[#00d4aa]/30 rounded-full transition-all"
                >
                    <Plus className="w-3 h-3" /> Nova Meta
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-24">
                    <div className="w-6 h-6 border-2 border-[#00d4aa]/20 border-t-[#00d4aa] rounded-full animate-spin-slow" />
                </div>
            ) : goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-[#4b5a6e]">
                    <Target className="w-6 h-6 mb-2 opacity-50" />
                    <p className="text-xs">Nenhuma meta criada</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {goals.map(g => (
                        <GoalCard key={g.id} goal={g} onEdit={(g) => { setEditing(g); setShowModal(true) }} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            {showModal && (
                <GoalModal
                    goal={editing}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditing(null) }}
                />
            )}
        </div>
    )
}

function GoalModal({ goal, onSave, onClose }: { goal: Goal | null; onSave: (g: Partial<Goal>) => void; onClose: () => void }) {
    const [name, setName] = useState(goal?.name || '')
    const [target, setTarget] = useState(String(goal?.target_amount || ''))
    const [current, setCurrent] = useState(String(goal?.current_amount || '0'))
    const [deadline, setDeadline] = useState(goal?.deadline?.split('T')[0] || '')
    const [icon, setIcon] = useState(goal?.icon || '🎯')
    const [color, setColor] = useState(goal?.color || '#60a5fa')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !target) return
        onSave({
            name,
            target_amount: parseFloat(target),
            current_amount: parseFloat(current) || 0,
            deadline: deadline || null,
            icon: icon || '🎯',
            color: color || '#60a5fa',
        })
    }

    const icons = ['🎯', '💰', '🏠', '🚗', '✈️', '🎓', '🏥', '💍', '📱', '💻', '🏋️', '🎮', '👶', '🌴', '🏦']

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-[#151e2d] border border-[#1e2d45] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">{goal ? 'Editar Meta' : 'Nova Meta'}</h3>
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
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Valor Alvo</label>
                            <input type="number" step="0.01" min="0" value={target} onChange={e => setTarget(e.target.value)}
                                className="w-full bg-[#0d1525] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50 transition-colors" />
                        </div>
                        <div>
                            <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Valor Atual</label>
                            <input type="number" step="0.01" min="0" value={current} onChange={e => setCurrent(e.target.value)}
                                className="w-full bg-[#0d1525] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50 transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Prazo (opcional)</label>
                        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                            className="w-full bg-[#0d1525] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50 transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Ícone</label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {icons.map(i => (
                                <button key={i} type="button" onClick={() => setIcon(i)}
                                    className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${icon === i ? 'bg-[#00d4aa]/20 border border-[#00d4aa]/50' : 'bg-[#0d1525] border border-[#1e2d45] hover:border-[#4b5a6e]'}`}>
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold">Cor</label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {['#60a5fa', '#00d4aa', '#fbbf24', '#ff4d6d', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#22d3ee', '#8b5cf6'].map(c => (
                                <button key={c} type="button" onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-lg transition-all ${color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#151e2d]' : ''}`}
                                    style={{ background: c }} />
                            ))}
                        </div>
                    </div>
                    <button type="submit"
                        className="w-full bg-gradient-to-r from-[#00d4aa] to-[#60a5fa] text-bg font-semibold py-2.5 rounded-xl text-sm hover:opacity-90 transition-all mt-2">
                        {goal ? 'Salvar' : 'Criar Meta'}
                    </button>
                </form>
            </div>
        </div>
    )
}