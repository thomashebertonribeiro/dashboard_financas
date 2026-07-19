import { useState, useMemo } from 'react'
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { importTransactions, type Transaction } from '../lib/api'

interface Props {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

interface ParsedRow {
    line: number
    description: string
    amount: number
    date: string
    type: 'Saída' | 'Entrada'
    category: string
    payment_method: string
    bank: string
    error?: string
}

function validDateStr(raw: string): string | null {
    const parts = raw.trim().split(/[\/\-]/)
    if (parts.length !== 3) return null
    const [a, b, c] = parts.map(p => parseInt(p, 10))
    if (isNaN(a) || isNaN(b) || isNaN(c)) return null
    const yyyy = c > 31 ? c : a
    const mm = c > 31 ? b : (a > 31 ? c : b)
    const dd = c > 31 ? a : (a > 31 ? b : c)
    if (yyyy < 1900 || yyyy > 2100 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null
    return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
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

function normalizeTipo(raw: string): 'Saída' | 'Entrada' | null {
    const v = raw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
    if (v.includes('entrada') || v.includes('receita') || v === 'e') return 'Entrada'
    if (v.includes('saida') || v.includes('saída') || v === 's') return 'Saída'
    return null
}

const FORMAT_HINT = `descrição; valor; data; tipo; categoria; forma_pagamento; banco

Exemplos:
Supermercado; 350,50; 15/07/2026; Saída; Alimentação; Cartão Crédito; Nubank
Salário; 5000,00; 01/07/2026; Entrada; Salário; TED; Itaú
Uber; 25,30; 20/07/2026; Saída; Transporte; ;;
Netflix; 55,90; 10/07/2026; Saída; Streaming; Cartão Crédito;`

export function BulkImportModal({ isOpen, onClose, onSuccess }: Props) {
    const [raw, setRaw] = useState('')
    const [importing, setImporting] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState<{ total: number; ok: number; errors: string[] } | null>(null)

    const rows = useMemo((): ParsedRow[] => {
        if (!raw.trim()) return []
        const lines = raw.split('\n').filter(l => l.trim())
        const parsed: ParsedRow[] = []

        for (let i = 0; i < lines.length; i++) {
            const cols = lines[i].split(';').map(c => c.trim())
            const line = i + 1

            if (cols.length < 3) {
                parsed.push({ line, description: '', amount: 0, date: '', type: 'Saída', category: '', payment_method: '', bank: '', error: 'Poucas colunas. Use: descrição; valor; data; tipo; categoria; pagamento; banco' })
                continue
            }

            const descricao = cols[0]
            if (!descricao) {
                parsed.push({ line, description: '', amount: 0, date: '', type: 'Saída', category: '', payment_method: '', bank: '', error: 'Descrição é obrigatória' })
                continue
            }

            const valor = parseValor(cols[1])
            if (isNaN(valor) || valor <= 0) {
                parsed.push({ line, description: descricao, amount: 0, date: '', type: 'Saída', category: '', payment_method: '', bank: '', error: 'Valor inválido' })
                continue
            }

            const dateStr = validDateStr(cols[2])
            if (!dateStr) {
                parsed.push({ line, description: descricao, amount: valor, date: '', type: 'Saída', category: cols[3] || '', payment_method: cols[4] || '', bank: cols[5] || '', error: 'Data inválida (use dd/mm/aaaa)' })
                continue
            }

            const tipo = cols[3] ? normalizeTipo(cols[3]) : null
            if (cols[3] && !tipo) {
                parsed.push({ line, description: descricao, amount: valor, date: dateStr, type: 'Saída', category: cols[3] || '', payment_method: cols[4] || '', bank: cols[5] || '', error: 'Tipo inválido (use Saída ou Entrada)' })
                continue
            }

            parsed.push({
                line,
                description: descricao,
                amount: valor,
                date: dateStr,
                type: tipo || 'Saída',
                category: cols[3] || '',
                payment_method: cols[4] || '',
                bank: cols[5] || '',
            })
        }

        return parsed
    }, [raw])

    const validRows = rows.filter(r => !r.error)
    const hasErrors = rows.some(r => r.error)

    const handleImport = async () => {
        if (validRows.length === 0) return
        setImporting(true)
        setError('')
        setResult(null)

        try {
            const payload: Transaction[] = validRows.map(r => ({
                date: r.date,
                type: r.type,
                payment_method: r.payment_method || '',
                category: r.category || '',
                description: r.description,
                amount: r.amount,
                bank: r.bank || '',
            }))

            await importTransactions(payload)
            setResult({ total: rows.length, ok: validRows.length, errors: rows.filter(r => r.error).map(r => `Linha ${r.line}: ${r.error}`) })
            onSuccess()
        } catch (e: any) {
            setError(e.message || 'Erro ao importar')
        } finally {
            setImporting(false)
        }
    }

    if (!isOpen) return null

    const hasData = raw.trim().length > 0

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0f1e]/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-5 border-b border-[#1e2d45]">
                    <h2 className="text-white font-semibold">Importar em Massa</h2>
                    <button onClick={onClose} className="p-1 rounded-lg text-[#8899aa] hover:text-white hover:bg-[#1e2d45] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 space-y-4">
                    {error && (
                        <div className="p-3 rounded-xl bg-[#ff4d6d]/10 border border-[#ff4d6d]/20 text-[#ff4d6d] text-sm">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="p-4 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/20">
                            <div className="flex items-center gap-2 text-[#00d4aa] font-medium mb-1">
                                <CheckCircle className="w-4 h-4" />
                                Importação concluída
                            </div>
                            <p className="text-sm text-[#8899aa]">
                                {result.ok} de {result.total} linhas importadas com sucesso.
                                {result.errors.length > 0 && (
                                    <span className="text-[#fbbf24]"> {result.errors.length} com erros.</span>
                                )}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-[#8899aa] mb-1.5">
                            Cole os dados abaixo (um lançamento por linha)
                        </label>
                        <div className="text-[10px] text-[#4b5a6e] mb-2 font-mono whitespace-pre leading-relaxed">{FORMAT_HINT}</div>
                        <textarea
                            value={raw}
                            onChange={e => { setRaw(e.target.value); setResult(null) }}
                            placeholder="Cole aqui os lançamentos..."
                            rows={8}
                            className="w-full bg-[#0a0f1e] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00d4aa] transition-colors placeholder:text-[#4b5a6e] resize-y"
                        />
                    </div>

                    {hasData && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-[#8899aa]">
                                    Prévia ({rows.length} linha{rows.length !== 1 ? 's' : ''}
                                    {hasErrors && `, ${rows.filter(r => r.error).length} com erro`}
                                    )
                                </span>
                                {validRows.length > 0 && (
                                    <span className="text-xs text-[#00d4aa]">{validRows.length} válida{validRows.length !== 1 ? 's' : ''}</span>
                                )}
                            </div>
                            <div className="overflow-x-auto max-h-52 overflow-y-auto border border-[#1e2d45] rounded-xl">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-[#1e2d45] bg-[#0a0f1e]">
                                            <th className="text-left text-[#4b5a6e] font-medium px-3 py-2 whitespace-nowrap">#</th>
                                            <th className="text-left text-[#4b5a6e] font-medium px-3 py-2 whitespace-nowrap">Descrição</th>
                                            <th className="text-right text-[#4b5a6e] font-medium px-3 py-2 whitespace-nowrap">Valor</th>
                                            <th className="text-left text-[#4b5a6e] font-medium px-3 py-2 whitespace-nowrap">Data</th>
                                            <th className="text-left text-[#4b5a6e] font-medium px-3 py-2 whitespace-nowrap">Tipo</th>
                                            <th className="text-left text-[#4b5a6e] font-medium px-3 py-2 whitespace-nowrap">Categoria</th>
                                            <th className="text-left text-[#4b5a6e] font-medium px-3 py-2 whitespace-nowrap">Pgto</th>
                                            <th className="text-left text-[#4b5a6e] font-medium px-3 py-2 whitespace-nowrap">Banco</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((r, i) => (
                                            <tr key={i} className={`border-b border-[#1e2d45]/50 ${r.error ? 'bg-[#ff4d6d]/5' : ''}`}>
                                                <td className={`px-3 py-1.5 whitespace-nowrap font-mono ${r.error ? 'text-[#ff4d6d]' : 'text-[#4b5a6e]'}`}>
                                                    {r.error ? <AlertCircle className="w-3 h-3 inline mr-1" /> : null}
                                                    {r.line}
                                                </td>
                                                <td className="px-3 py-1.5 text-[#8899aa] max-w-[160px] truncate">{r.description || <span className="text-[#ff4d6d]">{r.error}</span>}</td>
                                                <td className="px-3 py-1.5 text-right font-mono text-white">{r.amount > 0 ? r.amount.toFixed(2) : '—'}</td>
                                                <td className="px-3 py-1.5 text-[#8899aa] font-mono whitespace-nowrap">{r.date || '—'}</td>
                                                <td className="px-3 py-1.5 whitespace-nowrap">
                                                    {r.type === 'Entrada' ? (
                                                        <span className="text-[#00d4aa]">Entrada</span>
                                                    ) : r.type === 'Saída' ? (
                                                        <span className="text-[#ff4d6d]">Saída</span>
                                                    ) : <span className="text-[#4b5a6e]">—</span>}
                                                </td>
                                                <td className="px-3 py-1.5 text-[#8899aa] max-w-[100px] truncate">{r.category || '—'}</td>
                                                <td className="px-3 py-1.5 text-[#8899aa] max-w-[100px] truncate">{r.payment_method || '—'}</td>
                                                <td className="px-3 py-1.5 text-[#8899aa] max-w-[100px] truncate">{r.bank || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-[#1e2d45] bg-[#0a0f1e] rounded-b-2xl flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-[#8899aa] hover:text-white transition-colors"
                    >
                        {result ? 'Fechar' : 'Cancelar'}
                    </button>
                    {(!result || result.errors.length > 0) && (
                        <button
                            onClick={handleImport}
                            disabled={importing || validRows.length === 0}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-gradient-to-r from-[#00d4aa] to-[#60a5fa] hover:opacity-90 text-bg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            {importing ? 'Importando...' : `Importar ${validRows.length > 0 ? `(${validRows.length})` : ''}`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}