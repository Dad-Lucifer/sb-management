// components/money-alert.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // Fix: Added this import

interface MoneyAlertProps {
    isOpen: boolean;
    onClose: () => void;
}

const MoneyAlert: React.FC<MoneyAlertProps> = ({ isOpen, onClose }) => {
    const [countdown, setCountdown] = useState(10);
    const [isButtonVisible, setIsButtonVisible] = useState(false);

    // Reset logic when the modal opens
    useEffect(() => {
        if (isOpen) {
            setCountdown(10);
            setIsButtonVisible(false);
        }
    }, [isOpen]);

    // Countdown timer logic
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (isOpen && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (isOpen && countdown === 0) {
            setIsButtonVisible(true);
        }

        return () => clearTimeout(timer);
    }, [isOpen, countdown]);

    if (!isOpen) return null;

    // Circle calculation for visual timer
    const circumference = 2 * Math.PI * 45; // radius = 45
    const strokeDashoffset = circumference - (countdown / 10) * circumference;

    return (
        // Full screen overlay with blur and high z-index
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 overflow-y-auto">
            
            {/* Container - Responsive width, Dark Gaming Theme */}
            <div className="w-full max-w-md bg-gradient-to-b from-gray-900 to-black rounded-3xl shadow-2xl border border-red-500/30 relative overflow-hidden flex flex-col items-center justify-center min-h-[50vh] sm:min-h-0 sm:p-8 p-6 my-auto">
                
                {/* Ambient Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

                {/* Warning Icon - Pulsing Animation */}
                <div className="relative z-10 mb-6 animate-pulse">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        <span className="text-5xl sm:text-6xl">⚠️</span>
                    </div>
                </div>

                {/* Text Content - Improved Hierarchy */}
                <div className="relative z-10 text-center space-y-3 mb-8 px-2">
                    <h2 className="text-red-500 text-xs sm:text-sm font-bold uppercase tracking-[0.2em]">
                        Payment Alert
                    </h2>
                    <h1 className="text-white font-extrabold text-xl sm:text-2xl md:text-3xl leading-tight tracking-tight">
                        You haven't paid the Due amount of
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 drop-shadow-lg">
                            ₹ 3400
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm sm:text-base font-medium">
                        Please pay it as soon as possible!
                    </p>
                </div>

                {/* Countdown / Button Area */}
                <div className="relative z-10 w-full max-w-xs mx-auto flex flex-col items-center justify-center min-h-[120px]">
                    
                    {!isButtonVisible ? (
                        <div className="flex flex-col items-center gap-4">
                            {/* Circular Countdown Timer */}
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50" cy="50" r="45"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="transparent"
                                        className="text-gray-800"
                                    />
                                    <circle
                                        cx="50" cy="50" r="45"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        className="text-red-500 transition-all duration-1000 ease-linear"
                                        style={{
                                            strokeDasharray: circumference,
                                            strokeDashoffset: strokeDashoffset,
                                        }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl sm:text-3xl font-black text-white">{countdown}</span>
                                </div>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm font-medium uppercase tracking-wider animate-pulse">
                                Please wait...
                            </p>
                        </div>
                    ) : (
                        <motion.button
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            onClick={onClose}
                            className="w-full relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-8 rounded-xl text-lg sm:text-xl shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] transform transition-all duration-300 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-500/50 border border-green-400/30"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                YES
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                            {/* Shine Effect */}
                            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-12 animate-[shine_3s_infinite]" />
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MoneyAlert;