import { useState } from 'react'
import { Link2, ArrowRight, FileSpreadsheet, AlertCircle } from 'lucide-react'

interface SheetConnectProps {
    onConnect: (url: string) => void
    error?: string
    loading?: boolean
}

const EXAMPLE_STRUCTURE = [
    ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Meta (opcional)', 'Valor da Meta'],
    ['01/06/2025', 'Salário', 'Renda', 'receita', '5000', '', ''],
    ['05/06/2025', 'Aluguel', 'Moradia', 'despesa', '1200', '', ''],
    ['10/06/2025', 'Tesouro Direto', 'Renda Fixa', 'investimento', '500', 'Aposentadoria', '100000'],
]

export function SheetConnect({ onConnect, error, loading }: SheetConnectProps) {
    const [url, setUrl] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (url.trim()) onConnect(url.trim())
    }

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
            <div className="w-full max-w-2xl animate-slide-up">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse-dot" />
                        <span className="text-accent text-xs font-mono uppercase tracking-widest">Financeiro Pessoal</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-3">
                        Conecte sua<br />
                        <span className="text-accent">planilha</span>
                    </h1>
                    <p className="text-subtle text-base">
                        Insira a URL pública do Google Sheets e veja seus dados em tempo real.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 mb-6">
                    <label className="block text-xs font-medium text-subtle uppercase tracking-widest mb-2">
                        URL da planilha
                    </label>
                    <div className="flex gap-3 flex-col sm:flex-row">
                        <div className="relative flex-1">
                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input
                                type="url"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !url.trim()}
                            className="flex items-center justify-center gap-2 bg-accent text-bg font-semibold px-6 py-3 rounded-xl hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-bg/40 border-t-bg rounded-full animate-spin-slow" />
                            ) : (
                                <>Conectar <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-3 flex items-start gap-2 text-danger text-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <p className="mt-4 text-xs text-muted">
                        A planilha precisa ser pública: <span className="text-subtle">Arquivo → Compartilhar → Qualquer pessoa com o link pode ver</span>
                    </p>
                </form>

                {/* Structure guide */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileSpreadsheet className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium text-white">Estrutura esperada da planilha</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <tbody>
                                {EXAMPLE_STRUCTURE.map((row, i) => (
                                    <tr key={i} className={i === 0 ? 'text-accent' : 'text-subtle'}>
                                        {row.map((cell, j) => (
                                            <td
                                                key={j}
                                                className={`py-1.5 pr-4 font-mono border-b border-border/50 whitespace-nowrap ${i === 0 ? 'font-semibold pb-2' : ''}`}
                                            >
                                                {cell || <span className="text-muted">—</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-3 text-xs text-muted">
                        Tipos aceitos: <span className="text-accent">receita</span>, <span className="text-danger">despesa</span>, <span className="text-info">investimento</span>
                    </p>
                </div>
            </div>
        </div>
    )
}

