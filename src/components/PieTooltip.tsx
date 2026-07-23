import { fmt } from '../lib/dateUtils'

interface TooltipContent {
    active?: boolean
    payload?: { name?: string; value?: number }[]
}

export function PieTooltip({ active, payload }: TooltipContent) {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
        <div className="bg-card border border-border rounded-xl p-3 text-xs shadow-xl">
            <p className="text-white font-medium mb-1">{item.name}</p>
            <p className="text-accent font-mono">{fmt(item.value ?? 0)}</p>
        </div>
    )
}
