import { useState, useEffect, useCallback } from 'react'
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
    Wallet, TrendingUp, TrendingDown, CreditCard,
    RefreshCw, LogOut, Clock, ChevronRight,
    Sparkles, CalendarClock, Layers
} from 'lucide-react'
import {
    fetchSheetData,
    computeKPIs,
    saidasPorSemana,
    gastosPorCartao,
    faturaProximoMes,
    gastosPorCategoria,
    gerarInsights,
    type FinanceData,
    type LancamentoRow,
} from '../lib/sheetsParser'
import { PeriodFilter, buildPeriod, type Period } from './PeriodFilter'

const COLORS = ['#00d4aa', '#60a5fa', '#fbbf24', '#ff4d6d', '#a78bfa', '#34d399', '#fb923c', '#f472b6']

function fmt(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function timeAgo(date: Date) {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return `há ${diff}s`
    if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
    return `há ${Math.floor(diff / 3600)}h`
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-[#1a2535] border border-[#1e2d45] rounded-xl p-3 text-xs shadow-xl">
            <p className="text-[#8899aa] mb-2 font-medium">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill || p.color }} />
                    <span className="text-[#8899aa] capitalize">{p.name ?? p.dataKey}:</span>
                    <span className="text-white font-mono font-medium">{fmt(p.value)}</span>
                </div>
            ))}
        </div>
    )
}

const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
        <div className="bg-[#1a2535] border border-[#1e2d45] rounded-xl p-3 text-xs shadow-xl">
            <p className="text-white font-medium mb-1">{item.name}</p>
            <p className="text-[#00d4aa] font-mono">{fmt(item.value)}</p>
        </div>
    )
}

function KPI({ label, value, icon, color, sub }: {
    label: string; value: number; icon: React.ReactNode
    color: 'green' | 'red' | 'blue' | 'yellow' | 'auto'
    sub?: string
}) {
    const auto = color === 'auto' ? (value >= 0 ? 'green' : 'red') : color
    const map = {
        green: { border: 'border-[#00d4aa]/20', text: 'text-[#00d4aa]', bg: 'bg-[#00d4aa]/10' },
        red: { border: 'border-[#ff4d6d]/20', text: 'text-[#ff4d6d]', bg: 'bg-[#ff4d6d]/10' },
        blue: { border: 'border-[#60a5fa]/20', text: 'text-[#60a5fa]', bg: 'bg-[#60a5fa]/10' },
        yellow: { border: 'border-[#fbbf24]/20', text: 'text-[#fbbf24]', bg: 'bg-[#fbbf24]/10' },
    }
    const c = map[auto]

    return (
        <div className={`relative bg-[#151e2d] border ${c.border} rounded-2xl p-5 flex flex-col gap-3 overflow-hidden transition-all hover:scale-[1.01] duration-200`}>
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${c.bg} blur-2xl pointer-events-none`} />
            <div className="flex items-center justify-between">
                <span className="text-[#4b5a6e] text-[10px] font-medium uppercase tracking-widest">{label}</span>
                <div className={`${c.bg} ${c.text} p-2 rounded-xl`}>{icon}</div>
            </div>
            <div className={`font-mono text-2xl font-bold ${c.text} tracking-tight`}>{fmt(value)}</div>
            {sub && <p className="text-[#4b5a6e] text-xs">{sub}</p>}
        </div>
    )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="text-[#00d4aa]">{icon}</div>
            <h2 className="text-sm font-semibold text-white">{title}</h2>
        </div>
    )
}

function EmptyState({ msg }: { msg?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-36 text-[#4b5a6e]">
            <div className="w-8 h-8 border border-dashed border-[#1e2d45] rounded-full flex items-center justify-center mb-2 text-base">—</div>
            <p className="text-xs">{msg || 'Sem dados'}</p>
        </div>
    )
}

interface Props {
    sheetUrl: string
    onDisconnect: () => void
}

function parseRowDate(raw: string): Date | null {
    if (!raw) return null
    // Remove caracteres invisíveis e espaços
    const clean = raw.replace(/[^\d\/\-]/g, '').trim()
    // Suporta dd/mm/yyyy, dd-mm-yyyy, d/m/yyyy
    const parts = clean.split(/[\/\-]/)
    if (parts.length !== 3) return null
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    let year = parseInt(parts[2], 10)
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null
    if (year < 100) year += 2000
    if (day < 1 || day > 31 || month < 1 || month > 12) return null
    return new Date(year, month - 1, day, 12, 0, 0) // meio-dia evita problema de timezone
}

function isRowInPeriod(row: LancamentoRow, from: Date, to: Date): boolean {
    const d = parseRowDate(row.data)
    if (!d) return false // data inválida = exclui do filtro
    // Compara só a data (ignora hora)
    const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate())
    const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)
    return d >= fromDay && d <= toDay
}

const initialPeriod = buildPeriod('mes')

export function Dashboard({ sheetUrl, onDisconnect }: Props) {
    const [data, setData] = useState<FinanceData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
    const [period, setPeriod] = useState<Period>(initialPeriod)

    const load = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const d = await fetchSheetData(sheetUrl)
            setData(d)
            setLastRefresh(new Date())
        } catch (e: any) {
            setError(e.message || 'Erro ao carregar dados')
        } finally {
            setLoading(false)
        }
    }, [sheetUrl])

    useEffect(() => { load() }, [load])
    useEffect(() => {
        const interval = setInterval(load, 60000)
        return () => clearInterval(interval)
    }, [load])

    // ── Loading ──
    if (loading && !data) {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-[#00d4aa]/20 border-t-[#00d4aa] rounded-full animate-spin-slow mx-auto mb-4" />
                    <p className="text-[#8899aa] text-sm">Carregando aba Lançamentos...</p>
                </div>
            </div>
        )
    }

    // ── Error ──
    if (error && !data) {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
                <div className="bg-[#151e2d] border border-[#1e2d45] rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="w-12 h-12 bg-[#ff4d6d]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingDown className="w-5 h-5 text-[#ff4d6d]" />
                    </div>
                    <h2 className="text-white font-semibold mb-2">Não foi possível carregar</h2>
                    <p className="text-[#8899aa] text-sm mb-2">{error}</p>
                    <p className="text-[#4b5a6e] text-xs mb-6">
                        Verifique se a planilha é pública e se a aba se chama exatamente <span className="text-[#8899aa]">Lancamentos</span> (sem acento).
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={load} className="flex items-center gap-2 bg-[#00d4aa] text-[#0a0f1e] font-semibold px-5 py-2 rounded-xl hover:bg-[#00d4aa]/90 transition-all text-sm">
                            <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
                        </button>
                        <button onClick={onDisconnect} className="text-[#8899aa] text-sm border border-[#1e2d45] px-5 py-2 rounded-xl hover:border-[#ff4d6d]/40 hover:text-[#ff4d6d] transition-all">
                            Trocar planilha
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const allRows = data?.rows ?? []
    const rows = allRows.filter(r => isRowInPeriod(r, period.from, period.to))

    const kpis = computeKPIs(rows)
    const semanas = saidasPorSemana(rows)
    const porCartao = gastosPorCartao(rows)
    // Faturas sempre sobre TODOS os lançamentos, sem filtro de período
    const faturas = faturaProximoMes(allRows)
    const categorias = gastosPorCategoria(rows)
    const insights = gerarInsights(rows)
    const recentes = [...rows].reverse().slice(0, 10)

    // A função já retorna ordenado (atual → próximos → demais)
    const faturasOrdenadas = faturas
    const proximaFatura = faturas.find(f => f.isProximo)

    return (
        <div className="min-h-screen bg-[#0a0f1e]">
            {/* Topbar */}
            <header className="border-b border-[#1e2d45] bg-[#111827]/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 bg-[#00d4aa] rounded-full animate-pulse-dot shrink-0" />
                        <span className="font-semibold text-white text-sm whitespace-nowrap">Finanças Pessoais</span>
                        <span className="hidden sm:inline text-[10px] text-[#4b5a6e] bg-[#1e2d45] px-2 py-0.5 rounded-full font-mono whitespace-nowrap">
                            {rows.length} lançamento{rows.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Filtro de período */}
                        <PeriodFilter period={period} onChange={setPeriod} />

                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#4b5a6e]">
                            <Clock className="w-3 h-3" />
                            <span>{timeAgo(lastRefresh)}</span>
                        </div>
                        <button
                            onClick={load}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-xs text-[#8899aa] hover:text-[#00d4aa] border border-[#1e2d45] hover:border-[#00d4aa]/40 px-3 py-1.5 rounded-lg transition-all"
                        >
                            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin-slow' : ''}`} />
                            <span className="hidden md:inline">Atualizar</span>
                        </button>
                        <button
                            onClick={onDisconnect}
                            className="flex items-center gap-1.5 text-xs text-[#4b5a6e] hover:text-[#ff4d6d] border border-[#1e2d45] hover:border-[#ff4d6d]/40 px-3 py-1.5 rounded-lg transition-all"
                        >
                            <LogOut className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

                {/* ── KPIs ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <KPI label="Total Entradas" value={kpis.totalEntradas} icon={<TrendingUp className="w-4 h-4" />} color="green" />
                    <KPI label="Total Saídas" value={kpis.totalSaidas} icon={<TrendingDown className="w-4 h-4" />} color="red" />
                    <KPI label="Gastos Cartão" value={kpis.totalCartao} icon={<CreditCard className="w-4 h-4" />} color="blue" sub="Crédito à vista + parcelado" />
                    <KPI label="Parcelados" value={kpis.totalParcelado} icon={<Layers className="w-4 h-4" />} color="yellow" sub="Crédito parcelado" />
                    <KPI label="Saldo" value={kpis.saldo} icon={<Wallet className="w-4 h-4" />} color="auto" />
                </div>

                {/* ── Gráficos linha 1 ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Saídas por semana */}
                    <div className="bg-[#151e2d] border border-[#1e2d45] rounded-2xl p-5">
                        <SectionTitle icon={<CalendarClock className="w-4 h-4" />} title="Saídas por Semana" />
                        {semanas.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={semanas} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                                    <XAxis dataKey="semana" tick={{ fill: '#4b5a6e', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#4b5a6e', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="total" fill="#ff4d6d" name="Saídas" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyState msg="Sem saídas com data registrada" />}
                    </div>

                    {/* Gastos por cartão — barras horizontais */}
                    <div className="bg-[#151e2d] border border-[#1e2d45] rounded-2xl p-5">
                        <SectionTitle icon={<CreditCard className="w-4 h-4" />} title="Gastos por Banco / Cartão" />
                        {porCartao.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={porCartao} layout="vertical" margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={20}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: '#4b5a6e', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                    <YAxis type="category" dataKey="banco" tick={{ fill: '#8899aa', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="total" name="Gastos" radius={[0, 6, 6, 0]}>
                                        {porCartao.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyState msg="Sem dados de banco/cartão" />}
                    </div>
                </div>

                {/* ── Gráficos linha 2 ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Faturas por mês */}
                    <div className="bg-[#151e2d] border border-[#1e2d45] rounded-2xl p-5 flex flex-col gap-4">
                        <SectionTitle icon={<CalendarClock className="w-4 h-4" />} title="Faturas por Vencimento" />

                        {faturasOrdenadas.length > 0 ? (
                            <>
                                {/* Próximos 3 meses — cards em destaque */}
                                {(() => {
                                    const prox3 = faturasOrdenadas.filter(f => f.isProximos3)
                                    const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
                                        'próximo': { bg: 'bg-[#fbbf24]/10', border: 'border-[#fbbf24]/30', text: 'text-[#fbbf24]', badge: 'bg-[#fbbf24]/20 text-[#fbbf24]' },
                                        'em 2 meses': { bg: 'bg-[#60a5fa]/10', border: 'border-[#60a5fa]/30', text: 'text-[#60a5fa]', badge: 'bg-[#60a5fa]/20 text-[#60a5fa]' },
                                        'em 3 meses': { bg: 'bg-[#a78bfa]/10', border: 'border-[#a78bfa]/30', text: 'text-[#a78bfa]', badge: 'bg-[#a78bfa]/20 text-[#a78bfa]' },
                                    }
                                    if (prox3.length === 0) return null
                                    return (
                                        <div className="grid grid-cols-1 gap-2">
                                            {prox3.map((f, i) => {
                                                const label = f.proximoLabel ?? ''
                                                const c = colorMap[label] ?? colorMap['em 3 meses']
                                                return (
                                                    <div key={i} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${c.bg} ${c.border}`}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-semibold text-sm ${c.text}`}>{f.mes}</span>
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${c.badge}`}>{label}</span>
                                                        </div>
                                                        <span className={`font-mono font-bold text-sm ${c.text}`}>{fmt(f.total)}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                })()}

                                {/* Divisor */}
                                {faturasOrdenadas.some(f => f.isAtual || !f.isProximos3) && (
                                    <div className="border-t border-[#1e2d45]" />
                                )}

                                {/* Todos os meses — barra de progresso */}
                                <div className="space-y-2.5">
                                    {faturasOrdenadas.map((f, i) => {
                                        const max = Math.max(...faturasOrdenadas.map(x => x.total))
                                        const pct = Math.round((f.total / max) * 100)
                                        const color = f.isProximo ? '#fbbf24'
                                            : f.proximoLabel === 'em 2 meses' ? '#60a5fa'
                                                : f.proximoLabel === 'em 3 meses' ? '#a78bfa'
                                                    : f.isAtual ? '#00d4aa'
                                                        : '#4b5a6e'
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span style={{ color }} className="font-medium">{f.mes}</span>
                                                        {f.isAtual && (
                                                            <span className="text-[9px] bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/20 px-1.5 py-0.5 rounded-full">atual</span>
                                                        )}
                                                    </div>
                                                    <span className="text-white font-mono">{fmt(f.total)}</span>
                                                </div>
                                                <div className="w-full bg-[#111827] rounded-full h-1.5">
                                                    <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        ) : <EmptyState msg="Sem lançamentos de crédito com vcto" />}
                    </div>

                    {/* Pie categorias */}
                    <div className="bg-[#151e2d] border border-[#1e2d45] rounded-2xl p-5">
                        <SectionTitle icon={<Layers className="w-4 h-4" />} title="Saídas por Categoria" />
                        {categorias.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={categorias} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" paddingAngle={3}>
                                            {categorias.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1 mt-2">
                                    {categorias.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                                <span className="text-[#8899aa] truncate">{item.name}</span>
                                            </div>
                                            <span className="text-white font-mono shrink-0 ml-2">{fmt(item.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : <EmptyState />}
                    </div>

                    {/* Insights */}
                    <div className="bg-[#151e2d] border border-[#1e2d45] rounded-2xl p-5">
                        <SectionTitle icon={<Sparkles className="w-4 h-4" />} title="Insights" />
                        <div className="flex flex-col gap-3">
                            {insights.map((ins, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${ins.good
                                        ? 'border-[#00d4aa]/20 bg-[#00d4aa]/5 text-[#00d4aa]'
                                        : 'border-[#ff4d6d]/20 bg-[#ff4d6d]/5 text-[#ff4d6d]'
                                        }`}
                                >
                                    <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                                    <span>{ins.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Lançamentos Recentes ── */}
                <div className="bg-[#151e2d] border border-[#1e2d45] rounded-2xl p-5">
                    <SectionTitle icon={<Wallet className="w-4 h-4" />} title="Lançamentos Recentes" />
                    {recentes.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-[#1e2d45]">
                                        {['Data', 'Descrição', 'Categoria', 'Tipo Pgto', 'Banco', 'Vcto', 'Valor'].map(h => (
                                            <th key={h} className="text-left text-[#4b5a6e] font-medium pb-2 pr-4 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentes.map((r, i) => (
                                        <tr key={i} className="border-b border-[#1e2d45]/50 hover:bg-[#111827]/60 transition-colors">
                                            <td className="py-2.5 pr-4 text-[#4b5a6e] font-mono whitespace-nowrap">{r.data}</td>
                                            <td className="py-2.5 pr-4 text-[#8899aa] max-w-[140px] truncate">{r.descricao}</td>
                                            <td className="py-2.5 pr-4 text-[#4b5a6e] whitespace-nowrap">{r.categoria}</td>
                                            <td className="py-2.5 pr-4 whitespace-nowrap">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium
                          border-[#60a5fa]/20 bg-[#60a5fa]/5 text-[#60a5fa]">
                                                    {r.tipoPagamento || '—'}
                                                </span>
                                            </td>
                                            <td className="py-2.5 pr-4 text-[#8899aa] whitespace-nowrap">{r.banco || '—'}</td>
                                            <td className="py-2.5 pr-4 text-[#4b5a6e] whitespace-nowrap">{r.vctoFatura || '—'}</td>
                                            <td className={`py-2.5 text-right font-mono font-semibold whitespace-nowrap ${r.transacao === 'Entrada' ? 'text-[#00d4aa]' : 'text-[#ff4d6d]'}`}>
                                                {r.transacao === 'Entrada' ? '+' : '-'}{fmt(r.valor)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <EmptyState msg="Nenhum lançamento encontrado" />}
                </div>

            </main>
        </div>
    )
}

