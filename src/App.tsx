import { useAuth } from "./context/AuthContext"
import { LoginPage } from "./pages/LoginPage"
import { Dashboard } from "./components/Dashboard"
import { LogOut } from "lucide-react"

function App() {
  const { user, isLoading, logout } = useAuth()

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin-slow" />
      </div>
    )
  }

  // Not logged in — show login page
  if (!user) {
    return <LoginPage />
  }

  return (
    <>
      {/* Logout floating button */}
      <button
        onClick={logout}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card border border-border text-subtle hover:text-danger hover:border-danger/40 px-3 py-2 rounded-xl text-xs font-medium transition-all"
      >
        <LogOut className="w-3.5 h-3.5" />
        Sair
      </button>
      <Dashboard />
    </>
  )
}

export default App
