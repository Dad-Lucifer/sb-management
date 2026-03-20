import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Pending() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-red-500/30 relative overflow-hidden">
            {/* Dark premium background with red hue */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-black to-black" />
                <motion.div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            <motion.div 
                className="relative z-10 flex flex-col items-center justify-center space-y-8 text-center bg-black/40 p-8 md:p-16 rounded-3xl border border-red-500/20 backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.1)] max-w-4xl w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            >
                {/* Warning Icon with a subtle shake animation */}
                <motion.div
                    animate={{ 
                        rotate: [0, -10, 10, -10, 10, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                        duration: 0.5, 
                        delay: 1, 
                        repeat: Infinity, 
                        repeatDelay: 4 
                    }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-red-500 blur-[40px] opacity-40 rounded-full"></div>
                    <AlertTriangle className="relative w-32 h-32 md:w-48 md:h-48 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" strokeWidth={1.5} />
                </motion.div>
                
                {/* Huge text */}
                <div className="space-y-6">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 via-red-500 to-red-800 tracking-tighter leading-none">
                        Database Expired !
                    </h1>
                    <p className="text-2xl md:text-4xl font-bold text-zinc-300 tracking-wide mt-4">
                        Subscribe to reuse it again
                    </p>
                </div>

            </motion.div>
        </div>
    );
}
