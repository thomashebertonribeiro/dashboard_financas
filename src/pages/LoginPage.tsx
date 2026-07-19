import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { LogIn, UserPlus, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react"

export function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (isRegister) {
        await register(email, password)
      } else {
        await login(email, password)
      }
    } catch (err: any) {
      setError(err.message || "Erro ao autenticar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse-dot" />
            <span className="text-accent text-xs font-mono uppercase tracking-widest">
              Financeiro Pessoal
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
            {isRegister ? "Crie sua " : "Acesse sua "}
            <span className="text-accent">conta</span>
          </h1>
          <p className="text-subtle text-sm">
            {isRegister
              ? "Preencha os dados para criar uma conta"
              : "Entre com suas credenciais para continuar"}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-2xl p-6 mb-4"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-subtle uppercase tracking-widest mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-subtle uppercase tracking-widest mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-muted focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-subtle transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-accent text-bg font-semibold px-6 py-3 rounded-xl hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-bg/40 border-t-bg rounded-full animate-spin-slow" />
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" /> Criar conta <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Entrar <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister)
              setError("")
            }}
            className="text-sm text-subtle hover:text-accent transition-colors"
          >
            {isRegister ? "Já tem conta? " : "Não tem conta? "}
            <span className="text-accent font-medium underline underline-offset-2">
              {isRegister ? "Entrar" : "Criar conta"}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
