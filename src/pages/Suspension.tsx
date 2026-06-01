import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Rajdhani:wght@400;500;600;700&display=swap'

export default function Suspension() {
    useEffect(() => {
        if (document.querySelector('#sb-gaming-font-suspension')) return
        const link = document.createElement('link')
        link.id = 'sb-gaming-font-suspension'
        link.rel = 'stylesheet'
        link.href = FONT_LINK
        document.head.appendChild(link)
    }, [])
    return (
        <div className="min-h-[100dvh] w-full bg-black flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div 
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l26 15v30L30 60 4 45V15z' stroke='%23ffffff' fill='none' stroke-width='1'/%3E%3C/svg%3E")`,
                        backgroundSize: '60px 60px',
                    }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_70%)]" />
            </div>

            <div className="relative z-10 text-center px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-white/30 mb-8">
                    <AlertTriangle className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>

                <h1 style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-5xl sm:text-6xl font-bold text-white tracking-wider mb-4">
                    ERROR
                </h1>

                <p style={{ fontFamily: "'Chakra Petch', sans-serif" }} className="text-2xl sm:text-3xl text-white font-semibold tracking-widest mb-2">
                    404
                </p>

                <p style={{ fontFamily: "'Rajdhani', sans-serif" }} className="text-xl sm:text-2xl text-white/80 font-medium tracking-[0.2em] uppercase mb-2">
                    Database Not Responding
                </p>

                <div className="mt-8 h-[1px] w-32 bg-white/30 mx-auto" />

                <p className="mt-8 text-white/40 text-sm tracking-widest uppercase">
                    System Temporarily Unavailable
                </p>
            </div>
        </div>
    )
}