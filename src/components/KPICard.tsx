import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface KPICardProps {
    label: string
    value: number
    icon: ReactNode
    color: 'accent' | 'danger' | 'warning' | 'info' | 'auto'
    sub?: string
    trend?: number
    delay?: number
}

const colorMap = {
    accent: { bg: 'bg-accent-dim', border: 'border-accent/20', text: 'text-accent' },
    danger: { bg: 'bg-danger-dim', border: 'border-danger/20', text: 'text-danger' },
    warning: { bg: 'bg-warning-dim', border: 'border-warning/20', text: 'text-warning' },
    info: { bg: 'bg-info-dim', border: 'border-info/20', text: 'text-info' },
}

function formatCurrency(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function KPICard({ label, value, icon, color, sub, trend, delay = 0 }: KPICardProps) {
    const auto = color === 'auto' ? (value >= 0 ? 'accent' : 'danger') : color
    const c = colorMap[auto]
    const positive = (trend ?? 0) >= 0

    return (
        <div
            className={`relative bg-card border ${c.border} rounded-2xl p-5 flex flex-col gap-3 overflow-hidden transition-all hover:scale-[1.01] duration-200 animate-slide-up`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${c.bg} blur-2xl pointer-events-none`} />
            <div className="flex items-center justify-between">
                <span className="text-muted text-xs font-medium uppercase tracking-widest">{label}</span>
                <div className={`${c.bg} ${c.text} p-2 rounded-xl`}>{icon}</div>
            </div>
            <div className={`font-mono text-2xl font-bold ${c.text} tracking-tight`}>{formatCurrency(value)}</div>
            {sub && <p className="text-muted text-xs">{sub}</p>}
            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-accent' : 'text-danger'}`}>
                    {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{positive ? '+' : ''}{trend.toFixed(1)}% vs mês anterior</span>
                </div>
            )}
        </div>
    )
}
