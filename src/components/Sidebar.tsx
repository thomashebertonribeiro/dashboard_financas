import { useState, useEffect } from 'react'
import {
    LayoutDashboard, Target, TrendingUp, PiggyBank,
    CreditCard, Scan, Menu, X, LogOut, ChevronLeft,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '#dashboard' },
    { id: 'metas', label: 'Metas', icon: Target, href: '#metas' },
    { id: 'investimentos', label: 'Investimentos', icon: TrendingUp, href: '#investimentos' },
    { id: 'orcamentos', label: 'Orçamentos', icon: PiggyBank, href: '#orcamentos' },
    { id: 'cartoes', label: 'Cartões', icon: CreditCard, href: '#cartoes' },
    { id: 'ocr', label: 'OCR', icon: Scan, href: '#ocr' },
]

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [activeId, setActiveId] = useState('dashboard')
    const { logout } = useAuth()

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('data-section')
                    if (id) setActiveId(id)
                }
            }
        }, { rootMargin: '-40% 0px -55% 0px' })

        const els = document.querySelectorAll('[data-section]')
        els.forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [])

    const scrollTo = (id: string) => {
        setActiveId(id)
        setMobileOpen(false)
        const el = document.querySelector(`[data-section="${id}"]`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-info flex items-center justify-center shrink-0">
                    <span className="text-bg font-bold text-lg leading-none">F</span>
                </div>
                {!collapsed && (
                    <span className="text-white font-semibold tracking-wide whitespace-nowrap">
                        Finanças <span className="text-accent">Pessoais</span>
                    </span>
                )}
            </div>

            <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(item => {
                    const Icon = item.icon
                    const isActive = activeId === item.id
                    return (
                        <button
                            key={item.id}
                            onClick={() => scrollTo(item.id)}
                            title={collapsed ? item.label : undefined}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                ? 'bg-accent-dim text-accent'
                                : 'text-muted hover:text-white hover:bg-surface'
                                }`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </button>
                    )
                })}
            </nav>

            <div className="p-2 border-t border-border">
                <div className="flex items-center gap-1">
                    <button
                        onClick={logout}
                        title="Sair"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-danger hover:bg-danger-dim transition-all w-full"
                    >
                        <LogOut className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>Sair</span>}
                    </button>
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        title={collapsed ? 'Expandir' : 'Recolher'}
                        className="hidden lg:flex items-center justify-center p-2.5 rounded-xl text-muted hover:text-white hover:bg-surface transition-all"
                    >
                        <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-3 left-3 z-50 p-2.5 rounded-xl bg-card border border-border text-muted hover:text-white transition-all"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Desktop sidebar */}
            <aside className={`hidden lg:flex flex-col bg-card border-r border-border h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
                {sidebarContent}
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border animate-slide-up">
                        <div className="flex justify-end p-3">
                            <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-surface transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {sidebarContent}
                    </div>
                </div>
            )}
        </>
    )
}
