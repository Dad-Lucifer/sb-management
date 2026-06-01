import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Suspension from './pages/Suspension'
import { ThemeProvider } from '@/components/theme-provider'

function App() {
    return (
        <Router>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                <Routes>
                    <Route
                        path="/"
                        element={<Suspension />}
                    />
                    <Route
                        path="/dashboard"
                        element={<Navigate to="/" />}
                    />
                    <Route
                        path="/login"
                        element={<Navigate to="/" />}
                    />
                    <Route
                        path="*"
                        element={<Navigate to="/" />}
                    />
                </Routes>
            </ThemeProvider>
        </Router>
    )
}

export default App
