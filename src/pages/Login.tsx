import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Loader2, MonitorPlay, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Google Fonts ── */
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Rajdhani:wght@400;500;600;700&display=swap'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [focusedField, setFocusedField] = useState<string | null>(null)
    const [authError, setAuthError] = useState(false)
    const { toast } = useToast()
    const navigate = useNavigate()

    /* Inject Google Font */
    useEffect(() => {
        if (document.querySelector('#sb-gaming-font')) return
        const link = document.createElement('link')
        link.id = 'sb-gaming-font'
        link.rel = 'stylesheet'
        link.href = FONT_LINK
        document.head.appendChild(link)
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) return

        setLoading(true)
        setAuthError(false)
        try {
            await signInWithEmailAndPassword(auth, email, password)
            toast({
                title: 'SYSTEM OVERRIDE SUCCESSFUL',
                description: 'Welcome to the Arena Dashboard.',
                className: 'bg-black/90 border-red-500/50 text-white font-["Chakra_Petch"] rounded-none border-l-4 border-l-red-500',
            })
            navigate('/dashboard')
        } catch (error: any) {
            console.error(error)
            setAuthError(true)
            setTimeout(() => setAuthError(false), 600)

            let msg = 'AUTHENTICATION FAILED'
            if (error.code === 'auth/invalid-credential') msg = 'INVALID CREDENTIALS DETECTED'
            else if (error.code === 'auth/too-many-requests') msg = 'TOO MANY ATTEMPTS. SYSTEM LOCKED.'

            toast({
                variant: 'destructive',
                title: 'ACCESS DENIED',
                description: msg,
                className: 'bg-red-950/90 border-red-500 text-red-100 font-["Chakra_Petch"] rounded-none border-l-4 border-l-red-600',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div 
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
            className="min-h-[100dvh] w-full bg-[#050505] flex items-center justify-center relative overflow-hidden text-white selection:bg-red-500/30"
        >
            {/* ── Esports Arena Background ── */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Hexagon Grid Pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.15]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='69.2820323027551' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 17.32050807568877l-20 11.547005383792516L0 17.32050807568877V-5.773502691896258l20-11.547005383792516 20 11.547005383792516V17.32050807568877zm0 46.18802153825501l-20 11.547005383792515L0 63.50852961394378V40.41451884636626l20-11.547005383792516 20 11.547005383792516v23.09401076758875zM20 51.96152422706627l-20 11.547005383792515L-20 51.96152422706627V28.86751345947751l20-11.547005383792516 20 11.547005383792516v23.09401076758876z' fill='%23ff0000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                        backgroundSize: '30px 52px',
                    }}
                />

                {/* Central Red Glow */}
                <motion.div
                    animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] bg-red-600/20 rounded-full blur-[100px] sm:blur-[120px] mix-blend-screen"
                />

                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_80%)]" />
            </div>

            {/* ── Login Interface ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-[420px] mx-4"
            >
                {/* Tech/Gaming Frame styling */}
                <div 
                    className="bg-[#0a0a0a]/90 backdrop-blur-md relative overflow-hidden border border-white/10"
                    style={{
                        clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)'
                    }}
                >
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />
                    
                    {/* Bottom Right Cutout Accent */}
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-600/50" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />

                    <div className="p-8 sm:p-10">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="inline-flex items-center justify-center w-14 h-14 bg-red-600/10 border border-red-500/30 mb-4 relative"
                                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                            >
                                <MonitorPlay className="w-7 h-7 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                <div className="absolute inset-0 bg-red-500/20 animate-pulse mix-blend-screen" />
                            </motion.div>
                            
                            <h1 style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-3xl sm:text-4xl font-bold tracking-widest text-white uppercase mb-1">
                                SB <span className="text-red-500">GAMING</span>
                            </h1>
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-[1px] w-8 bg-red-500/50" />
                                <p className="text-red-500/80 text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase">
                                    Operator Link
                                </p>
                                <div className="h-[1px] w-8 bg-red-500/50" />
                            </div>
                        </div>

                        {/* Form */}
                        <motion.form 
                            onSubmit={handleLogin}
                            animate={authError ? { x: [-5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            className="space-y-6"
                        >
                            {/* Email */}
                            <div className="relative group">
                                <label 
                                    htmlFor="email"
                                    className={cn(
                                        "block text-xs font-bold tracking-widest uppercase transition-colors duration-300 mb-2",
                                        focusedField === 'email' || email ? "text-red-400" : "text-white/40"
                                    )}
                                >
                                    Operator ID
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 sm:py-3.5 text-white text-[15px] placeholder-white/20 outline-none transition-colors duration-300"
                                        style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                                        placeholder="admin@sbgaming.com"
                                    />
                                    {/* Focus Underline/Border Effect */}
                                    <div className={cn(
                                        "absolute inset-0 pointer-events-none border border-red-500/0 transition-colors duration-300",
                                        focusedField === 'email' && "border-red-500/50 bg-red-500/5 shadow-[inset_0_0_15px_rgba(239,68,68,0.15)]"
                                    )} style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }} />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="relative group">
                                <label 
                                    htmlFor="password"
                                    className={cn(
                                        "block text-xs font-bold tracking-widest uppercase transition-colors duration-300 mb-2",
                                        focusedField === 'password' || password ? "text-red-400" : "text-white/40"
                                    )}
                                >
                                    Access Code
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 sm:py-3.5 text-white text-[15px] placeholder-white/20 outline-none transition-colors duration-300"
                                        style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                                        placeholder="••••••••"
                                    />
                                    {/* Focus Underline/Border Effect */}
                                    <div className={cn(
                                        "absolute inset-0 pointer-events-none border border-red-500/0 transition-colors duration-300",
                                        focusedField === 'password' && "border-red-500/50 bg-red-500/5 shadow-[inset_0_0_15px_rgba(239,68,68,0.15)]"
                                    )} style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }} />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading || !email || !password}
                                    className={cn(
                                        "relative w-full h-14 flex items-center justify-center overflow-hidden transition-all duration-300 group disabled:cursor-not-allowed",
                                        email && password 
                                            ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:bg-red-500" 
                                            : "bg-white/5 text-white/30 border border-white/10"
                                    )}
                                    style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                                >
                                    <AnimatePresence mode="wait">
                                        {loading ? (
                                            <motion.div
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-2"
                                            >
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="font-bold tracking-widest uppercase">Initializing...</span>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="text"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-2"
                                            >
                                                <Zap className={cn("w-5 h-5", email && password && "fill-white/20")} />
                                                <span style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="font-bold tracking-widest text-lg uppercase">
                                                    Connect to Server
                                                </span>
                                                <ChevronRight className={cn("w-5 h-5 transition-transform duration-300", email && password && "group-hover:translate-x-1")} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    {/* Scanline overlay on button hover */}
                                    {email && password && !loading && (
                                        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                    )}
                                </button>
                            </div>
                        </motion.form>

                        {/* Footer */}
                        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-sm animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                                <span className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Network Status: Online</span>
                            </div>
                            <span className="text-[10px] text-white/20 font-bold tracking-widest uppercase">v2.4.1</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
