import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'

function App() {
    return (
        <Router>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                </Routes>
                <Toaster />
            </ThemeProvider>
        </Router>
    )
}

export default App
