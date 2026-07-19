import { useState, useEffect, useRef } from 'react'
import {
    fetchOcrDocuments, uploadDocument, deleteOcrDocument,
    type OcrDocument,
} from '../lib/api'
import { ScanLine, Upload, FileText, X, Trash2, RefreshCw, CheckCircle, AlertCircle, Loader, Clock } from 'lucide-react'

function fmtSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(date: string) {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (diff < 60) return `há ${diff}s`
    if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
    return new Date(date).toLocaleDateString('pt-BR')
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pending: { icon: Clock, color: 'text-[#fbbf24]', label: 'Aguardando' },
    processing: { icon: Loader, color: 'text-[#60a5fa]', label: 'Processando' },
    completed: { icon: CheckCircle, color: 'text-[#00d4aa]', label: 'Concluído' },
    failed: { icon: AlertCircle, color: 'text-[#ff4d6d]', label: 'Falhou' },
}

export function OcrSection() {
    const [documents, setDocuments] = useState<OcrDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [selected, setSelected] = useState<OcrDocument | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const load = async () => {
        try {
            const data = await fetchOcrDocuments()
            setDocuments(data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleFile = async (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            alert('Arquivo muito grande. Máximo 10MB.')
            return
        }
        setUploading(true)
        try {
            await uploadDocument(file)
            load()
        } catch (e: any) {
            alert(e.message || 'Erro ao fazer upload')
        } finally {
            setUploading(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Excluir este documento?')) {
            await deleteOcrDocument(id)
            if (selected?.id === id) setSelected(null)
            load()
        }
    }

    const pendingCount = documents.filter(d => d.ocr?.status === 'pending' || d.ocr?.status === 'processing').length

    return (
        <div className="bg-[#0d1525] border border-[#1e2d45] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ScanLine className="w-4 h-4 text-[#00d4aa]" />
                    <h2 className="text-sm font-semibold text-white">OCR — Digitalização de Documentos</h2>
                    {pendingCount > 0 && (
                        <span className="text-[10px] bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30 px-2 py-0.5 rounded-full">
                            {pendingCount} processando
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={load} className="p-1.5 rounded-lg hover:bg-[#1e2d45] text-[#4b5a6e] transition-all">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#00d4aa]/10 text-[#00d4aa] hover:bg-[#00d4aa]/20 border border-[#00d4aa]/30 rounded-full transition-all disabled:opacity-50"
                    >
                        {uploading ? (
                            <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                            <Upload className="w-3 h-3" />
                        )}
                        {uploading ? 'Enviando...' : 'Upload'}
                    </button>
                </div>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all mb-4 ${dragOver
                    ? 'border-[#00d4aa] bg-[#00d4aa]/5'
                    : 'border-[#1e2d45] hover:border-[#2a3a52] bg-[#0d1525]/50'
                }`}
            >
                <Upload className="w-6 h-6 mx-auto mb-2 text-[#4b5a6e]" />
                <p className="text-xs text-[#8899aa]">
                    {dragOver ? 'Solte o arquivo aqui' : 'Arraste um comprovante ou clique em "Upload"'}
                </p>
                <p className="text-[10px] text-[#4b5a6e] mt-1">JPEG, PNG, WebP ou PDF (máx 10MB)</p>
            </div>

            {/* Lista */}
            {loading ? (
                <div className="flex items-center justify-center h-24">
                    <div className="w-6 h-6 border-2 border-[#00d4aa]/20 border-t-[#00d4aa] rounded-full animate-spin-slow" />
                </div>
            ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-[#4b5a6e]">
                    <FileText className="w-6 h-6 mb-2 opacity-50" />
                    <p className="text-xs">Nenhum documento digitalizado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* Lista de documentos */}
                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                        {documents.map(doc => {
                            const cfg = statusConfig[doc.ocr?.status || 'pending']
                            const Icon = cfg.icon
                            return (
                                <div
                                    key={doc.id}
                                    onClick={() => setSelected(doc)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${selected?.id === doc.id
                                        ? 'border-[#00d4aa]/50 bg-[#00d4aa]/5'
                                        : 'border-[#1e2d45] bg-[#0d1525] hover:border-[#2a3a52]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-[#151e2d] flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4 text-[#8899aa]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white text-sm truncate">{doc.file_name}</p>
                                            <p className="text-[#4b5a6e] text-[10px]">
                                                {fmtSize(doc.file_size || 0)} · {timeAgo(doc.created_at!)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {doc.ocr?.status === 'processing' && (
                                            <Loader className="w-3.5 h-3.5 animate-spin text-[#60a5fa]" />
                                        )}
                                        <span className={`text-[10px] ${cfg.color}`}>
                                            {cfg.label}
                                        </span>
                                        <button onClick={e => { e.stopPropagation(); handleDelete(doc.id!) }}
                                            className="p-1 rounded hover:bg-[#1e2d45] text-[#4b5a6e] hover:text-[#ff4d6d] transition-all">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Detalhes do documento selecionado */}
                    <div className="bg-[#151e2d] border border-[#1e2d45] rounded-xl p-4 min-h-[200px]">
                        {selected ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-semibold truncate max-w-[250px]">{selected.file_name}</p>
                                        <p className="text-[#4b5a6e] text-[10px]">{fmtSize(selected.file_size || 0)} · {selected.mime_type}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${selected.ocr?.status === 'completed' ? 'border-[#00d4aa]/30 text-[#00d4aa] bg-[#00d4aa]/10' :
                                        selected.ocr?.status === 'failed' ? 'border-[#ff4d6d]/30 text-[#ff4d6d] bg-[#ff4d6d]/10' :
                                            selected.ocr?.status === 'processing' ? 'border-[#60a5fa]/30 text-[#60a5fa] bg-[#60a5fa]/10' :
                                                'border-[#fbbf24]/30 text-[#fbbf24] bg-[#fbbf24]/10'
                                    }`}>
                                        {statusConfig[selected.ocr?.status || 'pending']?.label}
                                    </span>
                                </div>

                                {selected.ocr?.status === 'processing' && (
                                    <div className="flex items-center justify-center h-20">
                                        <Loader className="w-5 h-5 animate-spin text-[#60a5fa]" />
                                    </div>
                                )}

                                {selected.ocr?.status === 'failed' && (
                                    <div className="bg-[#ff4d6d]/5 border border-[#ff4d6d]/20 rounded-xl p-3">
                                        <p className="text-[#ff4d6d] text-xs">{selected.ocr.error_message || 'Erro ao processar OCR'}</p>
                                    </div>
                                )}

                                {selected.ocr?.status === 'completed' && selected.ocr?.raw_text && (
                                    <>
                                        <div>
                                            <p className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold mb-1">Texto Extraído</p>
                                            <pre className="bg-[#0d1525] border border-[#1e2d45] rounded-xl p-3 text-xs text-[#8899aa] whitespace-pre-wrap font-mono max-h-[120px] overflow-y-auto">
                                                {selected.ocr.raw_text}
                                            </pre>
                                        </div>

                                        {selected.ocr.parsed_data && Object.keys(selected.ocr.parsed_data).length > 0 && (
                                            <div>
                                                <p className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold mb-1">Dados Extraídos</p>
                                                <div className="bg-[#0d1525] border border-[#1e2d45] rounded-xl p-3 space-y-1">
                                                    {Object.entries(selected.ocr.parsed_data).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between text-xs">
                                                            <span className="text-[#4b5a6e] capitalize">{key}:</span>
                                                            <span className="text-white font-mono">{String(value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selected.ocr.confidence !== null && selected.ocr.confidence !== undefined && (
                                            <div>
                                                <p className="text-[10px] text-[#4b5a6e] uppercase tracking-wider font-semibold mb-1">Confiança</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-[#111827] rounded-full h-1.5">
                                                        <div
                                                            className="h-1.5 rounded-full transition-all"
                                                            style={{
                                                                width: `${Math.round(selected.ocr.confidence * 100)}%`,
                                                                background: selected.ocr.confidence > 0.7 ? '#00d4aa' :
                                                                    selected.ocr.confidence > 0.4 ? '#fbbf24' : '#ff4d6d'
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-[#8899aa] font-mono">
                                                        {Math.round(selected.ocr.confidence * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {selected.ocr.processing_time_ms && (
                                            <p className="text-[10px] text-[#4b5a6e]">
                                                Processado em {(selected.ocr.processing_time_ms / 1000).toFixed(1)}s
                                            </p>
                                        )}
                                    </>
                                )}

                                {(!selected.ocr || selected.ocr.status === 'pending') && (
                                    <div className="flex items-center justify-center h-20 text-[#4b5a6e] text-xs">
                                        <Clock className="w-4 h-4 mr-2" />
                                        Aguardando processamento...
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-[#4b5a6e]">
                                <ScanLine className="w-6 h-6 mb-2 opacity-50" />
                                <p className="text-xs">Selecione um documento para ver os detalhes</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}