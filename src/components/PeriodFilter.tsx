import { useState } from 'react'
import { Calendar, ChevronDown, X } from 'lucide-react'

export type Preset = '7d' | '30d' | 'mes' | 'mes_ant' | '3m' | '6m' | 'ano' | 'custom'

export interface Period {
    preset: Preset
    from: Date
    to: Date
}

const PRESETS: { id: Preset; label: string }[] = [
    { id: '7d', label: 'Últimos 7 dias' },
    { id: '30d', label: 'Últimos 30 dias' },
    { id: 'mes', label: 'Este mês' },
    { id: 'mes_ant', label: 'Mês passado' },
    { id: '3m', label: 'Últimos 3 meses' },
    { id: '6m', label: 'Últimos 6 meses' },
    { id: 'ano', label: 'Este ano' },
    { id: 'custom', label: 'Personalizado' },
]

function toInputDate(d: Date) {
    return d.toISOString().slice(0, 10)
}

function labelFromPreset(p: Preset, from: Date, to: Date) {
    if (p === 'custom') {
        return `${from.toLocaleDateString('pt-BR')} – ${to.toLocaleDateString('pt-BR')}`
    }
    return PRESETS.find(x => x.id === p)?.label ?? ''
}

export function buildPeriod(preset: Preset, customFrom?: string, customTo?: string): Period {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    switch (preset) {
        case '7d': {
            const from = new Date(today); from.setDate(today.getDate() - 6); from.setHours(0, 0, 0, 0)
            return { preset, from, to: today }
        }
        case '30d': {
            const from = new Date(today); from.setDate(today.getDate() - 29); from.setHours(0, 0, 0, 0)
            return { preset, from, to: today }
        }
        case 'mes': {
            const from = new Date(now.getFullYear(), now.getMonth(), 1)
            return { preset, from, to: today }
        }
        case 'mes_ant': {
            const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
            return { preset, from, to }
        }
        case '3m': {
            const from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
            return { preset, from, to: today }
        }
        case '6m': {
            const from = new Date(now.getFullYear(), now.getMonth() - 5, 1)
            return { preset, from, to: today }
        }
        case 'ano': {
            const from = new Date(now.getFullYear(), 0, 1)
            return { preset, from, to: today }
        }
        case 'custom': {
            const from = customFrom ? new Date(customFrom + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth(), 1)
            const to = customTo ? new Date(customTo + 'T23:59:59') : today
            return { preset, from, to }
        }
    }
}

interface Props {
    period: Period
    onChange: (p: Period) => void
}

export function PeriodFilter({ period, onChange }: Props) {
    const [open, setOpen] = useState(false)
    const [customFrom, setCustomFrom] = useState(toInputDate(period.from))
    const [customTo, setCustomTo] = useState(toInputDate(period.to))

    function select(preset: Preset) {
        if (preset !== 'custom') {
            onChange(buildPeriod(preset))
            setOpen(false)
        }
    }

    function applyCustom() {
        onChange(buildPeriod('custom', customFrom, customTo))
        setOpen(false)
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 text-xs text-[#8899aa] hover:text-white border border-[#1e2d45] hover:border-[#00d4aa]/40 bg-[#111827] px-3 py-1.5 rounded-lg transition-all"
            >
                <Calendar className="w-3.5 h-3.5 text-[#00d4aa]" />
                <span className="max-w-[160px] truncate">{labelFromPreset(period.preset, period.from, period.to)}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    {/* overlay */}
                    <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />

                    <div className="absolute right-0 top-full mt-2 z-30 bg-[#151e2d] border border-[#1e2d45] rounded-2xl shadow-2xl w-64 overflow-hidden animate-slide-up">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2d45]">
                            <span className="text-xs font-semibold text-white">Filtrar por período</span>
                            <button onClick={() => setOpen(false)} className="text-[#4b5a6e] hover:text-white transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="p-2">
                            {PRESETS.filter(p => p.id !== 'custom').map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => select(p.id)}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-all ${period.preset === p.id
                                            ? 'bg-[#00d4aa]/10 text-[#00d4aa] font-medium'
                                            : 'text-[#8899aa] hover:bg-[#1e2d45] hover:text-white'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom */}
                        <div className="border-t border-[#1e2d45] p-3">
                            <p className="text-[10px] text-[#4b5a6e] uppercase tracking-widest mb-2 px-1">Personalizado</p>
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="date"
                                        value={customFrom}
                                        max={customTo}
                                        onChange={e => setCustomFrom(e.target.value)}
                                        className="flex-1 bg-[#0a0f1e] border border-[#1e2d45] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#00d4aa]/50 [color-scheme:dark]"
                                    />
                                    <span className="text-[#4b5a6e] text-xs shrink-0">até</span>
                                    <input
                                        type="date"
                                        value={customTo}
                                        min={customFrom}
                                        onChange={e => setCustomTo(e.target.value)}
                                        className="flex-1 bg-[#0a0f1e] border border-[#1e2d45] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#00d4aa]/50 [color-scheme:dark]"
                                    />
                                </div>
                                <button
                                    onClick={applyCustom}
                                    disabled={!customFrom || !customTo}
                                    className="w-full bg-[#00d4aa] text-[#0a0f1e] font-semibold text-xs py-2 rounded-xl hover:bg-[#00d4aa]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

