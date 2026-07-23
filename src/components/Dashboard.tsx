import { useState, useEffect, useCallback, type ReactNode } from 'react'
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
    Wallet, TrendingUp, TrendingDown, CreditCard,
    RefreshCw, Clock, ChevronRight,
    Sparkles, CalendarClock, Layers
, X} from 'lucide-react'
import {
    fetchSheetData,
    computeKPIs,
    saidasPorSemana,
    gastosPorCartao,
    faturaProximoMes,
    gastosPorCategoria,
    gerarInsights,
    mesIndex,
    type FinanceData,
    type LancamentoRow,
} from '../lib/sheetsParser'
import { fetchTransactions, importTransactions, type Transaction } from '../lib/api'
import { PeriodFilter, buildPeriod, type Period } from './PeriodFilter'
import { AddTransactionModal } from './AddTransactionModal'
import { BulkImportModal } from './BulkImportModal'
import { GoalsSection } from './GoalsSection'
import { InvestmentsSection } from './InvestmentsSection'
import { OcrSection } from './OcrSection'
import { CreditCardsSection } from './CreditCardsSection'
import { BudgetsSection } from './BudgetsSection'
import { KPICard } from './KPICard'
import { PieTooltip } from './PieTooltip'
import { fmt, timeAgo, toISODate, parseDateStr } from '../lib/dateUtils'
import { useToast } from '../context/ToastContext'

const CHART_COLORS = ['var(--color-accent)', 'var(--color-info)', 'var(--color-warning)', 'var(--color-danger)', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#22d3ee', '#8b5cf6', '#f43f5e', '#14b8a6']

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="text-accent">{icon}</div>
            <h2 className="text-sm font-semibold text-white">{title}</h2>
        </div>
    )
}

function EmptyState({ msg }: { msg?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-36 text-muted">
            <div className="w-8 h-8 border border-dashed border-border rounded-full flex items-center justify-center mb-2 text-base">—</div>
            <p className="text-xs">{msg || 'Sem dados'}</p>
        </div>
    )
}

function isRowInPeriod(row: LancamentoRow, from: Date, to: Date): boolean {
    const d = parseDateStr(row.data)
    if (!d) return false
    const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate())
    const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)
    return d >= fromDay && d <= toDay
}

const initialPeriod = buildPeriod('mes')

export function Dashboard() {
    const [data, setData] = useState<FinanceData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
    const [period, setPeriod] = useState<Period>(initialPeriod)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [importUrl, setImportUrl] = useState('')
    const [importingSheet, setImportingSheet] = useState(false)
    const { addToast } = useToast()

    const load = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const rows = await fetchTransactions()
            setData({ rows, lastUpdated: new Date() })
            setLastRefresh(new Date())
        } catch (e: any) {
            setError(e.message || 'Erro ao carregar dados')
        } finally {
            setLoading(false)
        }
    }, [])

    const handleImport = async () => {
        if (!importUrl.trim()) return
        setImportingSheet(true)
        try {
            const d = await fetchSheetData(importUrl)
            const payload = d.rows.map(r => {
                const dateStr = toISODate(r.data) ?? new Date().toISOString().split('T')[0]

                let due: string | null = null
                if (r.vctoFatura) {
                    due = toISODate(r.vctoFatura)
                    if (!due) {
                        const mes = r.vctoFaturaMes ?? mesIndex(r.vctoFatura)
                        if (mes >= 0) {
                            const ano = new Date().getFullYear()
                            due = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
                        }
                    }
                }
                
                return {
                    date: dateStr,
                    type: r.transacao,
                    payment_method: r.tipoPagamento,
                    category: r.categoria,
                    description: r.descricao,
                    amount: r.valor,
                    bank: r.banco,
                    invoice_due_date: due
                }
            }).filter(Boolean) as Transaction[]
            const result = await importTransactions(payload)
            addToast('success', `Importados: ${result.imported}${result.skipped > 0 ? `, ${result.skipped} já existentes (pulados)` : ''}`)
            setIsImportModalOpen(false)
            setImportUrl('')
            load()
        } catch (e: any) {
            addToast('error', 'Erro ao importar: ' + e.message)
        } finally {
            setImportingSheet(false)
        }
    }

    useEffect(() => { load() }, [load])
    useEffect(() => {
        const anyModalOpen = isAddModalOpen || isBulkImportOpen || isImportModalOpen
        if (anyModalOpen) return
        const interval = setInterval(load, 60000)
        return () => clearInterval(interval)
    }, [load, isAddModalOpen, isBulkImportOpen, isImportModalOpen])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return
            if (isImportModalOpen) { setIsImportModalOpen(false); setImportUrl('') }
            if (isBulkImportOpen) setIsBulkImportOpen(false)
            if (isAddModalOpen) setIsAddModalOpen(false)
        }
        if (isImportModalOpen || isBulkImportOpen || isAddModalOpen) {
            document.addEventListener('keydown', onKey)
            return () => document.removeEventListener('keydown', onKey)
        }
    }, [isImportModalOpen, isBulkImportOpen, isAddModalOpen])

        // ── Loading ──
    if (loading && !data) {
        return (
            <div className="min-h-screen bg-bg pt-14 lg:pt-0 animate-slide-up">
                <div className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
                        <div className="w-32 h-8 rounded-lg bg-surface animate-pulse" />
                        <div className="flex gap-2">
                            <div className="w-20 h-8 rounded-full bg-surface animate-pulse" />
                            <div className="w-20 h-8 rounded-full bg-surface animate-pulse" />
                        </div>
                    </div>
                </div>
                <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                                <div className="w-16 h-3 rounded bg-surface animate-pulse" />
                                <div className="w-24 h-6 rounded bg-surface animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="bg-card border border-border rounded-2xl p-5 h-64">
                                <div className="w-32 h-4 rounded bg-surface animate-pulse mb-4" />
                                <div className="w-full h-48 rounded-lg bg-surface animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        )
    }

    // ── Error ──
    if (error && !data) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center p-4">
                <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center">
                    <div className="w-12 h-12 bg-danger-dim rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingDown className="w-5 h-5 text-danger" />
                    </div>
                    <h2 className="text-white font-semibold mb-2">Não foi possível carregar</h2>
                    <p className="text-subtle text-sm mb-2">{error}</p>
                    <p className="text-muted text-xs mb-6">
                        Verifique se a planilha é pública e se a aba se chama exatamente <span className="text-subtle">Lancamentos</span> (sem acento).
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={load} className="flex items-center gap-2 bg-accent text-bg font-semibold px-5 py-2 rounded-xl hover:bg-accent/90 transition-all text-sm">
                            <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
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

    const faturasOrdenadas = faturas

    const FATURA_COLORS: Record<string, string> = {
        'próximo': '#fbbf24',
        'em 2 meses': '#60a5fa',
        'em 3 meses': '#a78bfa',
    }

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; fill?: string; color?: string; dataKey?: string }[]; label?: string | number }) => {
        if (!active || !payload?.length) return null
        return (
            <div className="bg-card border border-border rounded-xl p-3 text-xs shadow-xl">
                <p className="text-subtle mb-2 font-medium">{label}</p>
                {payload.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill || p.color }} />
                        <span className="text-subtle capitalize">{p.name ?? p.dataKey}:</span>
                        <span className="text-white font-mono font-medium">{fmt(p.value ?? 0)}</span>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-bg pt-14 lg:pt-0">

            {/* Top toolbar */}
            <div className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-2 overflow-x-auto">
                    <PeriodFilter period={period} onChange={setPeriod} />
                    <div className="flex items-center gap-2 ml-auto shrink-0">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="text-xs font-semibold px-4 py-2 bg-gradient-to-r from-accent to-info text-bg hover:opacity-90 rounded-full transition-all shadow-lg whitespace-nowrap"
                        >
                            + Novo Lançamento
                        </button>
                        <button
                            onClick={() => setIsBulkImportOpen(true)}
                            className="text-xs font-semibold px-4 py-2 bg-accent-dim text-accent hover:bg-accent/20 border border-accent/30 rounded-full transition-all whitespace-nowrap"
                        >
                            + Importar em Massa
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="text-xs font-semibold px-4 py-2 bg-info-dim text-info hover:bg-info/20 border border-info/30 rounded-full transition-all whitespace-nowrap"
                        >
                            Importar da Planilha
                        </button>
                        <div className="hidden md:flex items-center gap-1.5 text-xs text-subtle whitespace-nowrap pl-2 border-l border-border">
                            <Clock className="w-3 h-3 text-accent" />
                            {timeAgo(lastRefresh)}
                        </div>
                        <button
                            onClick={load}
                            className="p-2 rounded-full hover:bg-surface text-muted hover:text-white transition-colors"
                            title="Atualizar"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

                <div data-section="dashboard" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <KPICard label="Total Entradas" value={kpis.totalEntradas} icon={<TrendingUp className="w-4 h-4" />} color="accent" />
                    <KPICard label="Total Saídas" value={kpis.totalSaidas} icon={<TrendingDown className="w-4 h-4" />} color="danger" />
                    <KPICard label="Gastos Cartão" value={kpis.totalCartao} icon={<CreditCard className="w-4 h-4" />} color="info" sub="Crédito à vista + parcelado" />
                    <KPICard label="Parcelados" value={kpis.totalParcelado} icon={<Layers className="w-4 h-4" />} color="warning" sub="Crédito parcelado" />
                    <KPICard label="Saldo" value={kpis.saldo} icon={<Wallet className="w-4 h-4" />} color="auto" />
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <SectionTitle icon={<CalendarClock className="w-4 h-4" />} title="Saídas por Semana" />
                        {semanas.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={semanas} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                    <XAxis dataKey="semana" tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="total" fill="var(--color-danger)" name="Saídas" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyState msg="Sem saídas com data registrada" />}
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-5">
                        <SectionTitle icon={<CreditCard className="w-4 h-4" />} title="Gastos por Banco / Cartão" />
                        {porCartao.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={porCartao} layout="vertical" margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={20}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                                    <YAxis type="category" dataKey="banco" tick={{ fill: 'var(--color-subtle)', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="total" name="Gastos" radius={[0, 6, 6, 0]}>
                                        {porCartao.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyState msg="Sem dados de banco/cartão" />}
                    </div>
                </div>

                {/* Faturas, Categorias, Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
                        <SectionTitle icon={<CalendarClock className="w-4 h-4" />} title="Faturas por Vencimento" />
                        {faturasOrdenadas.length > 0 ? (
                            <>
                                {(() => {
                                    const prox3 = faturasOrdenadas.filter(f => f.isProximos3)
                                    if (prox3.length === 0) return null
                                    return (
                                        <div className="grid grid-cols-1 gap-2">
                                            {prox3.map(f => (
                                                <div key={f.mes} className="flex items-center justify-between px-3 py-2.5 rounded-xl border"
                                                    style={{
                                                        backgroundColor: `color-mix(in srgb, ${FATURA_COLORS[f.proximoLabel ?? ''] ?? '#a78bfa'} 10%, transparent)`,
                                                        borderColor: `color-mix(in srgb, ${FATURA_COLORS[f.proximoLabel ?? ''] ?? '#a78bfa'} 30%, transparent)`,
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-white">{f.mes}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                                            style={{
                                                                backgroundColor: `color-mix(in srgb, ${FATURA_COLORS[f.proximoLabel ?? ''] ?? '#a78bfa'} 20%, transparent)`,
                                                                color: FATURA_COLORS[f.proximoLabel ?? ''] ?? '#a78bfa',
                                                            }}
                                                        >{f.proximoLabel}</span>
                                                    </div>
                                                    <span className="font-mono font-bold text-sm text-white">{fmt(f.total)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                })()}
                                {faturasOrdenadas.some(f => f.isAtual || !f.isProximos3) && (
                                    <div className="border-t border-border" />
                                )}
                                <div className="space-y-2.5">
                                    {faturasOrdenadas.map((f) => {
                                        const max = Math.max(...faturasOrdenadas.map(x => x.total))
                                        const pct = Math.round((f.total / max) * 100)
                                        const color = f.isProximo ? '#fbbf24'
                                            : f.proximoLabel === 'em 2 meses' ? '#60a5fa'
                                                : f.proximoLabel === 'em 3 meses' ? '#a78bfa'
                                                    : f.isAtual ? '#00d4aa' : '#4b5a6e'
                                        return (
                                            <div key={f.mes}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span style={{ color }} className="font-medium">{f.mes}</span>
                                                        {f.isAtual && (
                                                            <span className="text-[10px] bg-accent-dim text-accent border border-accent/20 px-1.5 py-0.5 rounded-full">atual</span>
                                                        )}
                                                    </div>
                                                    <span className="text-white font-mono">{fmt(f.total)}</span>
                                                </div>
                                                <div className="w-full bg-surface rounded-full h-1.5">
                                                    <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        ) : <EmptyState msg="Sem lançamentos de crédito com vcto" />}
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <SectionTitle icon={<Layers className="w-4 h-4" />} title="Saídas por Categoria" />
                        {categorias.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={categorias} cx="50%" cy="50%" innerRadius={42} outerRadius={68} dataKey="value" paddingAngle={3}>
                                            {categorias.map((_, i) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-1.5 max-h-[130px] overflow-y-auto pr-1 mt-2">
                                    {categorias.map((item, i) => (
                                        <div key={item.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                <span className="text-subtle truncate">{item.name}</span>
                                            </div>
                                            <span className="text-white font-mono shrink-0 ml-2">{fmt(item.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : <EmptyState />}
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <SectionTitle icon={<Sparkles className="w-4 h-4" />} title="Insights" />
                        <div className="flex flex-col gap-3">
                            {insights.map((ins, i) => (
                                <div key={i} className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${ins.good ? 'border-accent/20 bg-accent-dim text-accent' : 'border-danger/20 bg-danger-dim text-danger'}`}>
                                    <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                                    <span>{ins.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-card border border-border rounded-2xl p-5">
                    <SectionTitle icon={<Wallet className="w-4 h-4" />} title="Lançamentos Recentes" />
                    {recentes.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border">
                                        {['Data', 'Descrição', 'Categoria', 'Tipo Pgto', 'Banco', 'Vcto', 'Valor'].map(h => (
                                            <th key={h} className="text-left text-muted font-medium pb-2 pr-4 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentes.map(r => (
                                        <tr key={r.data + r.descricao + r.valor} className="border-b border-border/50 hover:bg-surface/60 transition-colors">
                                            <td className="py-2.5 pr-4 text-muted font-mono whitespace-nowrap">{r.data}</td>
                                            <td className="py-2.5 pr-4 text-subtle max-w-[140px] truncate">{r.descricao}</td>
                                            <td className="py-2.5 pr-4 text-muted whitespace-nowrap">{r.categoria}</td>
                                            <td className="py-2.5 pr-4 whitespace-nowrap">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium border-info/20 bg-info-dim text-info">
                                                    {r.tipoPagamento || '—'}
                                                </span>
                                            </td>
                                            <td className="py-2.5 pr-4 text-subtle whitespace-nowrap">{r.banco || '—'}</td>
                                            <td className="py-2.5 pr-4 text-muted whitespace-nowrap">{r.vctoFatura || '—'}</td>
                                            <td className={`py-2.5 text-right font-mono font-semibold whitespace-nowrap ${r.transacao === 'Entrada' ? 'text-accent' : 'text-danger'}`}>
                                                {r.transacao === 'Entrada' ? '+' : '-'}{fmt(r.valor)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <EmptyState msg="Nenhum lançamento encontrado" />}
                </div>

                <div data-section="metas"><GoalsSection /></div>
                <div data-section="investimentos"><InvestmentsSection /></div>
                <div data-section="orcamentos"><BudgetsSection /></div>
                <div data-section="cartoes"><CreditCardsSection /></div>
                <div data-section="ocr"><OcrSection /></div>

            </main>

            {/* Import Sheet Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm" onClick={() => { setIsImportModalOpen(false); setImportUrl('') }}>
                    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold">Importar da Planilha</h3>
                            <button onClick={() => { setIsImportModalOpen(false); setImportUrl('') }} className="p-1 rounded-lg hover:bg-border text-muted">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-subtle text-xs mb-3">Cole a URL pública da sua planilha do Google Sheets:</p>
                        <input
                            value={importUrl}
                            onChange={e => setImportUrl(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50 transition-colors placeholder:text-muted"
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => { setIsImportModalOpen(false); setImportUrl('') }} className="px-4 py-2 text-sm font-medium text-subtle hover:text-white transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={importingSheet || !importUrl.trim()}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-gradient-to-r from-accent to-info hover:opacity-90 text-bg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {importingSheet ? 'Importando...' : 'Importar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AddTransactionModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onSuccess={load}
            />
            <BulkImportModal 
                isOpen={isBulkImportOpen} 
                onClose={() => setIsBulkImportOpen(false)} 
                onSuccess={load}
            />
        </div>
    )
}

