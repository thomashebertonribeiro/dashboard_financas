import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: string
    type: ToastType
    message: string
}

interface ToastContextType {
    addToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
}

const STYLES = {
    success: { border: 'border-accent/30', bg: 'bg-accent-dim', text: 'text-accent' },
    error: { border: 'border-danger/30', bg: 'bg-danger-dim', text: 'text-danger' },
    info: { border: 'border-info/30', bg: 'bg-info-dim', text: 'text-info' },
    warning: { border: 'border-warning/30', bg: 'bg-warning-dim', text: 'text-warning' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).slice(2)
        setToasts(prev => [...prev, { id, type, message }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
    }, [])

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
                {toasts.map(t => {
                    const Icon = ICONS[t.type]
                    const s = STYLES[t.type]
                    return (
                        <div
                            key={t.id}
                            className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${s.border} ${s.bg} shadow-2xl animate-slide-up`}
                        >
                            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${s.text}`} />
                            <p className={`text-sm flex-1 ${s.text}`}>{t.message}</p>
                            <button onClick={() => removeToast(t.id)} className="text-subtle hover:text-white shrink-0">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx
}
