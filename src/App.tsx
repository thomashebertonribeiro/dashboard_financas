import { useAuth } from "./context/AuthContext"
import { LoginPage } from "./pages/LoginPage"
import { Dashboard } from "./components/Dashboard"
import { Sidebar } from "./components/Sidebar"

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin-slow" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Dashboard />
      </main>
    </div>
  )
}

export default App
