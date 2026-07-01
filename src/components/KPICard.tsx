import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
    label: string
    value: number
    icon: ReactNode
    color: 'accent' | 'danger' | 'warning' | 'info'
    trend?: number
    delay?: number
}

const colorMap = {
    accent: {
        bg: 'bg-accent-dim',
        border: 'border-accent/20',
        text: 'text-accent',
        glow: 'hover:glow-accent',
        dot: 'bg-accent',
    },
    danger: {
        bg: 'bg-danger-dim',
        border: 'border-danger/20',
        text: 'text-danger',
        glow: 'hover:glow-danger',
        dot: 'bg-danger',
    },
    warning: {
        bg: 'bg-warning-dim',
        border: 'border-warning/20',
        text: 'text-warning',
        glow: '',
        dot: 'bg-warning',
    },
    info: {
        bg: 'bg-info-dim',
        border: 'border-info/20',
        text: 'text-info',
        glow: '',
        dot: 'bg-info',
    },
}

function formatCurrency(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function KPICard({ label, value, icon, color, trend, delay = 0 }: KPICardProps) {
    const c = colorMap[color]
    const positive = (trend ?? 0) >= 0

    return (
        <div
            className={`relative bg-card border ${c.border} rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 ${c.glow} animate-slide-up cursor-default overflow-hidden`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* glow blob */}
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${c.bg} blur-2xl opacity-60 pointer-events-none`} />

            <div className="flex items-center justify-between">
                <span className="text-subtle text-xs font-medium uppercase tracking-widest">{label}</span>
                <div className={`${c.bg} ${c.text} p-2 rounded-xl`}>{icon}</div>
            </div>

            <div className={`font-mono text-2xl font-semibold ${c.text} tracking-tight`}>
                {formatCurrency(value)}
            </div>

            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-accent' : 'text-danger'}`}>
                    {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{positive ? '+' : ''}{trend.toFixed(1)}% vs mês anterior</span>
                </div>
            )}
        </div>
    )
}

