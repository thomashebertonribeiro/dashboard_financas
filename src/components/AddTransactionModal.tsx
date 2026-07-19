import { useState } from 'react'
import { X } from 'lucide-react'
import { importTransactions, type Transaction } from '../lib/api'

interface Props {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function AddTransactionModal({ isOpen, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    
    // Form state
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [type, setType] = useState('Saída')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [category, setCategory] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('')
    const [bank, setBank] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const newTx: Transaction = {
                description,
                amount: parseFloat(amount),
                type,
                date,
                category,
                payment_method: paymentMethod,
                bank,
            }
            
            // We reuse importTransactions since it accepts an array and posts to the API
            await importTransactions([newTx])
            onSuccess()
            onClose()
            
            // Reset form
            setDescription('')
            setAmount('')
            setCategory('')
            setPaymentMethod('')
            setBank('')
        } catch (err: any) {
            setError(err.message || 'Erro ao adicionar lançamento')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0f1e]/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-5 border-b border-[#1e2d45]">
                    <h2 className="text-white font-semibold">Novo Lançamento</h2>
                    <button onClick={onClose} className="p-1 rounded-lg text-[#8899aa] hover:text-white hover:bg-[#1e2d45] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-5 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-[#ff4d6d]/10 border border-[#ff4d6d]/20 text-[#ff4d6d] text-sm">
                            {error}
                        </div>
                    )}
                    
                    <form id="add-tx-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[#8899aa] mb-1.5">Tipo</label>
                                <select 
                                    value={type} onChange={e => setType(e.target.value)} required
                                    className="w-full bg-[#0a0f1e] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa] transition-colors"
                                >
                                    <option value="Saída">Saída</option>
                                    <option value="Entrada">Entrada</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#8899aa] mb-1.5">Data</label>
                                <input 
                                    type="date" value={date} onChange={e => setDate(e.target.value)} required
                                    className="w-full bg-[#0a0f1e] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa] transition-colors" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[#8899aa] mb-1.5">Descrição</label>
                            <input 
                                type="text" placeholder="Ex: Supermercado" value={description} onChange={e => setDescription(e.target.value)} required
                                className="w-full bg-[#0a0f1e] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa] transition-colors placeholder:text-[#4b5a6e]" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[#8899aa] mb-1.5">Valor (R$)</label>
                                <input 
                                    type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required
                                    className="w-full bg-[#0a0f1e] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa] transition-colors placeholder:text-[#4b5a6e]" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#8899aa] mb-1.5">Categoria</label>
                                <input 
                                    type="text" placeholder="Ex: Alimentação" value={category} onChange={e => setCategory(e.target.value)} required
                                    className="w-full bg-[#0a0f1e] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa] transition-colors placeholder:text-[#4b5a6e]" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[#8899aa] mb-1.5">Meio de Pgto.</label>
                                <input 
                                    type="text" placeholder="Ex: Cartão de Crédito" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                                    className="w-full bg-[#0a0f1e] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa] transition-colors placeholder:text-[#4b5a6e]" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#8899aa] mb-1.5">Banco/Conta</label>
                                <input 
                                    type="text" placeholder="Ex: Nubank" value={bank} onChange={e => setBank(e.target.value)}
                                    className="w-full bg-[#0a0f1e] border border-[#1e2d45] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4aa] transition-colors placeholder:text-[#4b5a6e]" 
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-5 border-t border-[#1e2d45] bg-[#0a0f1e] rounded-b-2xl flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-[#8899aa] hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="add-tx-form"
                        disabled={loading}
                        className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-[#00d4aa] to-[#60a5fa] hover:opacity-90 text-bg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Salvando...' : 'Adicionar'}
                    </button>
                </div>
            </div>
        </div>
    )
}
