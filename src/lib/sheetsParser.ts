export interface LancamentoRow {
    data: string
    transacao: 'Saída' | 'Entrada'
    tipoPagamento: string
    categoria: string
    descricao: string
    valor: number
    banco: string
    vctoFatura: string
    vctoFaturaMes?: number
    semana?: number
    mes?: number
    ano?: number
}

export interface FinanceData {
    rows: LancamentoRow[]
    lastUpdated: Date
}

function extractSheetId(url: string): string | null {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
}

// Busca a aba "Lancamentos" pelo nome via gviz
async function fetchViaGviz(id: string): Promise<string[][]> {
    // sheet=Lancamentos busca pelo nome da aba
    const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=Lancamentos`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    // Se retornar HTML é porque a planilha não está pública ou a aba não existe
    if (text.trim().startsWith('<')) throw new Error('Planilha não pública ou aba não encontrada')
    return parseCsvToMatrix(text)
}

async function fetchViaProxy(id: string): Promise<string[][]> {
    const target = encodeURIComponent(
        `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=Lancamentos`
    )
    const url = `https://api.allorigins.win/raw?url=${target}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    if (text.trim().startsWith('<')) throw new Error('Planilha não pública ou aba não encontrada')
    return parseCsvToMatrix(text)
}

export async function fetchSheetData(sheetUrl: string): Promise<FinanceData> {
    const id = extractSheetId(sheetUrl)
    if (!id) throw new Error('URL inválida. Verifique o link da planilha do Google Sheets.')

    let matrix: string[][] = []

    try {
        matrix = await fetchViaGviz(id)
    } catch {
        try {
            matrix = await fetchViaProxy(id)
        } catch {
            throw new Error(
                'Não foi possível acessar a planilha. Verifique se ela está pública e se a aba se chama exatamente "Lancamentos".'
            )
        }
    }

    const rows = matrixToRows(matrix)
    return { rows, lastUpdated: new Date() }
}

function parseCsvToMatrix(csv: string): string[][] {
    return csv.trim().split('\n').filter(Boolean).map(splitCsvLine)
}

function parseDate(raw: string): { semana: number; mes: number; ano: number } | null {
    const parts = raw.trim().split(/[\/\-]/)
    if (parts.length !== 3) return null
    // Tenta dd/mm/yyyy
    const day = parseInt(parts[0])
    const month = parseInt(parts[1])
    const year = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2])
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null
    const d = new Date(year, month - 1, day)
    if (isNaN(d.getTime())) return null
    // Semana do mês (1–5)
    const semana = Math.ceil(day / 7)
    return { semana, mes: month, ano: year }
}

function parseValor(raw: string): number {
    const clean = raw
        .replace(/R\$\s?/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim()
    return parseFloat(clean)
}

function normalizeTransacao(raw: string): 'Saída' | 'Entrada' {
    const v = raw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (v.includes('entrada') || v.includes('receita') || v.includes('income')) return 'Entrada'
    return 'Saída'
}

function normalizeBanco(raw: string): string {
    const v = raw.trim()
    if (!v) return 'Outros'
    return v
}

function matrixToRows(matrix: string[][]): LancamentoRow[] {
    if (matrix.length < 2) return []

    // Detecta índice das colunas pelo cabeçalho (case-insensitive)
    const header = matrix[0].map(h => h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim())

    const idx = {
        data: findCol(header, ['data']),
        transacao: findCol(header, ['transacao', 'transação', 'tipo', 'movimento']),
        tipoPagamento: findCol(header, ['tipo de pagamento', 'tipopagamento', 'pagamento', 'forma']),
        categoria: findCol(header, ['categoria']),
        descricao: findCol(header, ['descricao', 'descrição', 'descricao', 'historico', 'histórico']),
        valor: findCol(header, ['valor']),
        banco: findCol(header, ['banco', 'cartao', 'cartão', 'bank']),
        vctoFatura: findCol(header, ['vcto fatura', 'vcto', 'vencimento', 'fatura']),
    }

    const rows: LancamentoRow[] = []

    for (let i = 1; i < matrix.length; i++) {
        const cols = matrix[i]
        if (!cols || cols.every(c => !c.trim())) continue

        const rawValor = cols[idx.valor] ?? ''
        const valor = parseValor(rawValor)
        if (isNaN(valor) || valor === 0) continue

        const rawData = cols[idx.data] ?? ''
        const dateInfo = parseDate(rawData)

        const rawVcto = (cols[idx.vctoFatura] ?? '').trim()
        const vctoMes = mesIndex(rawVcto)

        rows.push({
            data: rawData.trim(),
            transacao: normalizeTransacao(cols[idx.transacao] ?? ''),
            tipoPagamento: (cols[idx.tipoPagamento] ?? '').trim(),
            categoria: (cols[idx.categoria] ?? 'Outros').trim() || 'Outros',
            descricao: (cols[idx.descricao] ?? '').trim(),
            valor: Math.abs(valor),
            banco: normalizeBanco(cols[idx.banco] ?? ''),
            vctoFatura: rawVcto,
            vctoFaturaMes: vctoMes >= 0 ? vctoMes : undefined,
            semana: dateInfo?.semana,
            mes: dateInfo?.mes,
            ano: dateInfo?.ano,
        })
    }

    return rows
}

function findCol(header: string[], candidates: string[]): number {
    for (const c of candidates) {
        const i = header.findIndex(h => h.includes(c))
        if (i !== -1) return i
    }
    return -1
}

function splitCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; continue }
            inQuotes = !inQuotes
            continue
        }
        if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue }
        current += ch
    }
    result.push(current)
    return result
}

// ─── Computações ────────────────────────────────────────────────

export function computeKPIs(rows: LancamentoRow[]) {
    const saidas = rows.filter(r => r.transacao === 'Saída')
    const entradas = rows.filter(r => r.transacao === 'Entrada')

    const totalEntradas = entradas.reduce((s, r) => s + r.valor, 0)
    const totalSaidas = saidas.reduce((s, r) => s + r.valor, 0)

    const isCredito = (r: LancamentoRow) =>
        r.tipoPagamento.toLowerCase().includes('crédito') || r.tipoPagamento.toLowerCase().includes('credito')
    const isParcelado = (r: LancamentoRow) =>
        r.tipoPagamento.toLowerCase().includes('parcelado')

    const totalCartao = saidas.filter(isCredito).reduce((s, r) => s + r.valor, 0)
    const totalParcelado = saidas.filter(isParcelado).reduce((s, r) => s + r.valor, 0)
    const saldo = totalEntradas - totalSaidas

    return { totalEntradas, totalSaidas, totalCartao, totalParcelado, saldo }
}

// Saídas agrupadas por semana
export function saidasPorSemana(rows: LancamentoRow[]) {
    const map = new Map<string, number>()
    const saidas = rows.filter(r => r.transacao === 'Saída' && r.semana)

    for (const r of saidas) {
        const key = `Sem. ${r.semana}`
        map.set(key, (map.get(key) || 0) + r.valor)
    }

    return Array.from(map.entries())
        .map(([semana, total]) => ({ semana, total }))
        .sort((a, b) => {
            const na = parseInt(a.semana.replace('Sem. ', ''))
            const nb = parseInt(b.semana.replace('Sem. ', ''))
            return na - nb
        })
}

// Gastos por cartão (banco)
export function gastosPorCartao(rows: LancamentoRow[]) {
    const map = new Map<string, number>()
    const saidas = rows.filter(r => r.transacao === 'Saída')

    for (const r of saidas) {
        const banco = r.banco || 'Outros'
        map.set(banco, (map.get(banco) || 0) + r.valor)
    }

    return Array.from(map.entries())
        .map(([banco, total]) => ({ banco, total }))
        .sort((a, b) => b.total - a.total)
}

const MESES_PT = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
]

function normalizeMesNome(raw: string): string {
    return raw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export function mesIndex(raw: string): number {
    const n = normalizeMesNome(raw)
    // Tenta match exato ou prefixo de 3 letras
    for (let i = 0; i < MESES_PT.length; i++) {
        const m = normalizeMesNome(MESES_PT[i])
        if (n === m) return i
        if (n.startsWith(m.slice(0, 3))) return i
        if (m.startsWith(n.slice(0, 3))) return i
    }
    // Fallback: tenta extrair mês de datas formatadas (dd/mm/yyyy ou yyyy-mm-dd)
    const parts = n.split(/[\/\-]/)
    if (parts.length === 3) {
        const mid = parseInt(parts[1], 10)
        if (!isNaN(mid) && mid >= 1 && mid <= 12) return mid - 1
    }
    return -1
}

// Faturas por mês de vencimento — recebe TODOS os lançamentos (ignora filtro de período)
export function faturaProximoMes(rows: LancamentoRow[]) {
    const now = new Date()
    const mesAtualIdx = now.getMonth() // 0-based
    const proximos3 = [1, 2, 3].map(i => (mesAtualIdx + i) % 12)

    // Apenas Crédito à vista e Crédito parcelado, saídas, com vcto preenchido
    const credito = rows.filter(r => {
        if (r.transacao !== 'Saída') return false
        if (!r.vctoFatura || !r.vctoFatura.trim()) return false
        const tipo = r.tipoPagamento
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
        return tipo.includes('credito')
    })

    // Agrupa por mês — extrai o primeiro nome de mês encontrado no campo vctoFatura
    const map = new Map<number, { label: string; total: number }>()

    for (const r of credito) {
        const vctoRaw = r.vctoFatura.trim()
        // Tenta encontrar um nome de mês dentro do texto (ex: "Julho", "julho", "JUL")
        const idx = mesIndex(vctoRaw)
        if (idx === -1) continue // não reconheceu o mês — ignora

        if (!map.has(idx)) {
            // Capitaliza o nome canônico
            const label = MESES_PT[idx].charAt(0).toUpperCase() + MESES_PT[idx].slice(1)
            map.set(idx, { label, total: 0 })
        }
        map.get(idx)!.total += r.valor
    }

    return Array.from(map.entries()).map(([idx, { label, total }]) => {
        const proximoIdx = proximos3.indexOf(idx)
        return {
            mes: label,
            total,
            mesIdx: idx,
            isAtual: idx === mesAtualIdx,
            isProximo: proximoIdx === 0,
            proximoLabel: proximoIdx === 0 ? 'próximo' : proximoIdx === 1 ? 'em 2 meses' : proximoIdx === 2 ? 'em 3 meses' : null,
            isProximos3: proximoIdx >= 0,
        }
    }).sort((a, b) => {
        // Ordena cronologicamente a partir do mês atual
        const rel = (i: number) => (i - mesAtualIdx + 12) % 12
        return rel(a.mesIdx) - rel(b.mesIdx)
    })
}

// Gastos por categoria (saídas)
export function gastosPorCategoria(rows: LancamentoRow[]) {
    const map = new Map<string, number>()
    for (const r of rows.filter(r => r.transacao === 'Saída')) {
        map.set(r.categoria, (map.get(r.categoria) || 0) + r.valor)
    }
    return Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
}

// Insights automáticos
export function gerarInsights(rows: LancamentoRow[]) {
    const kpis = computeKPIs(rows)
    const porCartao = gastosPorCartao(rows)
    const insights: { text: string; good: boolean }[] = []

    const taxaSaida = kpis.totalEntradas > 0 ? (kpis.totalSaidas / kpis.totalEntradas) * 100 : 0
    const taxaParcelado = kpis.totalCartao > 0 ? (kpis.totalParcelado / kpis.totalCartao) * 100 : 0

    if (kpis.saldo >= 0) {
        insights.push({ text: `Saldo positivo de ${fmt(kpis.saldo)}. Bom trabalho!`, good: true })
    } else {
        insights.push({ text: `Saldo negativo de ${fmt(Math.abs(kpis.saldo))}. Gastos superam entradas.`, good: false })
    }

    if (taxaSaida > 90) {
        insights.push({ text: `${taxaSaida.toFixed(0)}% da renda foi para saídas. Revise os gastos.`, good: false })
    } else {
        insights.push({ text: `Saídas em ${taxaSaida.toFixed(0)}% das entradas. Controle saudável!`, good: true })
    }

    if (taxaParcelado > 50) {
        insights.push({ text: `${taxaParcelado.toFixed(0)}% dos gastos no cartão são parcelados. Cuidado com o endividamento.`, good: false })
    } else if (kpis.totalParcelado > 0) {
        insights.push({ text: `Parcelamentos representam ${taxaParcelado.toFixed(0)}% do cartão. Está controlado.`, good: true })
    }

    if (porCartao.length > 0) {
        const top = porCartao[0]
        insights.push({ text: `${top.banco} é seu banco com mais gastos: ${fmt(top.total)}.`, good: true })
    }

    return insights
}

function fmt(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

