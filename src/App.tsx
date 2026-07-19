import { useState } from "react"
import { useAuth } from "./context/AuthContext"
import { LoginPage } from "./pages/LoginPage"
import { SheetConnect } from "./components/SheetConnect"
import { Dashboard } from "./components/Dashboard"
import { LogOut } from "lucide-react"

const STORAGE_KEY = "fintrack_sheet_url"

function App() {
  const { user, isLoading, logout } = useAuth()

  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || ""
  })
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState("")

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

  const handleConnect = async (url: string) => {
    setConnecting(true)
    setConnectError("")
    try {
      const id = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1]
      if (!id) throw new Error("URL invalida. Copie direto da barra de endereco do Google Sheets.")
      localStorage.setItem(STORAGE_KEY, url)
      setSheetUrl(url)
    } catch (e: any) {
      setConnectError(e.message)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSheetUrl("")
    setConnectError("")
  }

  if (!sheetUrl) {
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
        <SheetConnect onConnect={handleConnect} error={connectError} loading={connecting} />
      </>
    )
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
      <Dashboard sheetUrl={sheetUrl} onDisconnect={handleDisconnect} />
    </>
  )
}

export default App
