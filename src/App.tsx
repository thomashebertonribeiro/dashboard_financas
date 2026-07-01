import { useState } from 'react'
import { SheetConnect } from './components/SheetConnect'
import { Dashboard } from './components/Dashboard'

const STORAGE_KEY = 'fintrack_sheet_url'

function App() {
    const [sheetUrl, setSheetUrl] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEY) || ''
    })
    const [connecting, setConnecting] = useState(false)
    const [connectError, setConnectError] = useState('')

    const handleConnect = async (url: string) => {
        setConnecting(true)
        setConnectError('')
        try {
            // Quick validation — try to fetch
            const id = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1]
            if (!id) throw new Error('URL inválida. Copie direto da barra de endereço do Google Sheets.')
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
        setSheetUrl('')
        setConnectError('')
    }

    if (!sheetUrl) {
        return (
            <SheetConnect
                onConnect={handleConnect}
                error={connectError}
                loading={connecting}
            />
        )
    }

    return (
        <Dashboard
            sheetUrl={sheetUrl}
            onDisconnect={handleDisconnect}
        />
    )
}

export default App

