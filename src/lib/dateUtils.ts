export function fmt(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function timeAgo(date: Date) {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return `há ${diff}s`
    if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
    if (diff < 2592000) return `há ${Math.floor(diff / 86400)}d`
    if (diff < 31536000) return `há ${Math.floor(diff / 2592000)}m`
    return `há ${Math.floor(diff / 31536000)}a`
}

export function parseDateStr(raw: string): Date | null {
    if (!raw) return null
    const clean = raw.replace(/[^\d\/\-]/g, '').trim()
    const parts = clean.split(/[\/\-]/)
    if (parts.length !== 3) return null
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    let year = parseInt(parts[2], 10)
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null
    if (year < 100) year += 2000
    if (day < 1 || day > 31 || month < 1 || month > 12) return null
    return new Date(year, month - 1, day, 12, 0, 0)
}

export function toISODate(raw: string): string | null {
    const d = parseDateStr(raw)
    if (!d) return null
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
