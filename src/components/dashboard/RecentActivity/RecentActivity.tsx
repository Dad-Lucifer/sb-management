import { motion, AnimatePresence } from 'framer-motion'
import {
    Clock, Coffee, User, Trophy, Zap, Ghost,
    ChevronRight, History, Activity, AlertCircle, Crown
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CustomerEntry } from '@/types/dashboard'
import { cn } from '@/lib/utils'

export interface RecentActivityProps {
    recentEntries: CustomerEntry[];
    activityTab: 'ongoing' | 'completed';
    setActivityTab: (tab: 'ongoing' | 'completed') => void;
    currentTime: Date;
    openEntryDetails: (entry: CustomerEntry) => void;
}

export function RecentActivity({
    recentEntries,
    activityTab,
    setActivityTab,
    currentTime,
    openEntryDetails
}: RecentActivityProps) {

    const filteredEntries = recentEntries.filter(entry => {
        const startTime = new Date(entry.timestamp).getTime()
        const durationMs = entry.duration * 60 * 60 * 1000
        const endTime = startTime + durationMs
        const isExpired = endTime <= currentTime.getTime()
        return activityTab === 'completed' ? isExpired : !isExpired
    })

    const activeCount = recentEntries.filter(e => {
        const end = new Date(e.timestamp).getTime() + (e.duration * 3600000);
        return end > currentTime.getTime();
    }).length

    return (
        <div className="flex flex-col h-full min-h-0 space-y-3">
            {/* Header - Compact for Mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-2 sm:gap-0 shrink-0">
                <div className="flex flex-col min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent flex items-center gap-2 truncate">
                        Station Feed
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="shrink-0"
                        >
                            <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
                        </motion.div>
                    </h2>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-medium">Live Monitoring</p>
                </div>

                {/* Tabs - Larger Touch Targets */}
                <div className="self-start sm:self-auto flex items-center gap-1 p-1 rounded-full bg-gray-900/50 border border-gray-800 backdrop-blur-md">
                    <TabButton
                        active={activityTab === 'ongoing'}
                        onClick={() => setActivityTab('ongoing')}
                        icon={Zap}
                        label="Live"
                        count={activeCount}
                    />
                    <TabButton
                        active={activityTab === 'completed'}
                        onClick={() => setActivityTab('completed')}
                        icon={History}
                        label="History"
                    />
                </div>
            </div>

            {/* Main Content Area - Critical fix: min-h-0 for scrolling */}
            <div className="flex-1 relative min-h-0 rounded-3xl overflow-hidden bg-gradient-to-b from-gray-900/40 to-black/40 border border-gray-800/50 backdrop-blur-xl shadow-2xl flex flex-col">
                {/* Background Decor - Reduced blur for performance */}
                <div className="absolute top-0 right-0 p-20 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-20 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                <ScrollArea className="flex-1 w-full h-full">
                    <div className="p-2 sm:p-3 md:p-4 space-y-2 pb-20 sm:pb-24 md:space-y-3">
                        <AnimatePresence mode='popLayout'>
                            {filteredEntries.length === 0 ? (
                                <EmptyState tab={activityTab} />
                            ) : (
                                filteredEntries.map((entry, index) => (
                                    <ActivityCard
                                        key={entry.id}
                                        entry={entry}
                                        index={index}
                                        currentTime={currentTime}
                                        onClick={() => openEntryDetails(entry)}
                                    />
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>

                {/* Mobile bottom fade - Adjusted for denser content */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none md:hidden" />
            </div>
        </div>
    )
}

function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean, onClick: () => void, icon: any, label: string, count?: number }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative px-4 py-2 sm:px-4 sm:py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden outline-none touch-manipulation select-none",
                active ? "text-white" : "text-gray-500 hover:text-gray-300"
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gray-800 shadow-inner"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
                <Icon className={cn("w-3.5 h-3.5", active && "text-blue-400")} />
                {label}
                {count !== undefined && count > 0 && (
                    <span className={cn(
                        "ml-0.5 w-[14px] h-[14px] flex items-center justify-center rounded-full text-[9px] leading-none",
                        active ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50" : "bg-gray-800 text-gray-400"
                    )}>
                        {count}
                    </span>
                )}
            </span>
        </button>
    )
}

function ActivityCard({
    entry,
    index,
    currentTime,
    onClick
}: {
    entry: CustomerEntry;
    index: number;
    currentTime: Date;
    onClick: () => void
}) {
    const startTime = new Date(entry.timestamp).getTime()
    const durationMs = entry.duration * 60 * 60 * 1000
    const endTime = startTime + durationMs
    const now = currentTime.getTime()
    const remaining = Math.max(0, endTime - now)

    const isExpired = remaining <= 0
    const isWarning = remaining > 0 && remaining <= 300000 // 5 mins
    const progressPercent = Math.min(100, Math.max(0, (remaining / durationMs) * 100))

    // Formatted time display
    const h = Math.floor(remaining / (1000 * 60 * 60))
    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    // Status text
    const rawDiff = endTime - now
    let timeStatus = ""

    if (isExpired) {
        const exceededMs = Math.abs(rawDiff)
        const eH = Math.floor(exceededMs / (1000 * 60 * 60))
        const eM = Math.floor((exceededMs % (1000 * 60 * 60)) / (1000 * 60))
        timeStatus = `+ ${eH > 0 ? `${eH}h ` : ''}${eM}m`
    } else {
        timeStatus = `${h}h ${m}m`
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
            className="group relative cursor-pointer touch-manipulation select-none will-change-transform"
        >
            <div className={cn(
                "relative p-3 sm:p-4 rounded-xl border transition-colors duration-200 overflow-hidden",
                "bg-black/40 hover:bg-gray-900/60 backdrop-blur-md",
                "active:bg-gray-800/80", // Instant feedback on tap
                isWarning
                    ? "border-yellow-500/30"
                    : isExpired
                        ? "border-gray-800/50 opacity-70"
                        : "border-gray-800"
            )}>
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* AVATAR - Smaller on mobile */}
                    <div className="relative shrink-0">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 -rotate-90" viewBox="0 0 56 56">
                            <circle
                                cx="28" cy="28" r="26"
                                className="stroke-gray-800 fill-none"
                                strokeWidth="3"
                            />
                            {!isExpired && (
                                <circle
                                    cx="28" cy="28" r="26"
                                    className={cn(
                                        "fill-none transition-all duration-1000 ease-linear",
                                        isWarning ? "stroke-yellow-500" : "stroke-blue-500"
                                    )}
                                    strokeWidth="3"
                                    strokeDasharray="163.36"
                                    strokeDashoffset={163.36 * (1 - progressPercent / 100)}
                                    strokeLinecap="round"
                                />
                            )}
                        </svg>

                        {/* Avatar Content */}
                        <div className="absolute inset-[4px] sm:inset-[5px] rounded-full bg-gray-900 flex items-center justify-center overflow-hidden border border-gray-800">
                            <span className={cn(
                                "text-xs sm:text-base md:text-lg font-black",
                                isWarning ? "text-yellow-500" : isExpired ? "text-gray-600" : "text-blue-500"
                            )}>
                                {entry.customerName.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        {/* Status Indicator Icon - Tighter positioning */}
                        <div className="absolute -bottom-0.5 -right-0.5 scale-75 sm:scale-90 md:scale-100">
                            {isExpired ? (
                                <div className="bg-gray-800 p-1 rounded-full border border-gray-700">
                                    <Clock className="w-2.5 h-2.5 text-gray-500" />
                                </div>
                            ) : isWarning ? (
                                <div className="bg-yellow-500 p-1 rounded-full border border-yellow-600 animate-pulse">
                                    <AlertCircle className="w-2.5 h-2.5 text-black" />
                                </div>
                            ) : (
                                <div className="bg-blue-500 p-1 rounded-full border border-blue-600">
                                    <Zap className="w-2.5 h-2.5 text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Middle Info - Flex column with no-wrap */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                        <div className="flex items-center gap-1.5 mb-1">
                            <h3 className={cn(
                                "font-bold text-sm sm:text-base truncate leading-tight",
                                isExpired ? "text-gray-400" : "text-white"
                            )}>
                                {entry.customerName}
                            </h3>
                            {entry.isRenewed && (
                                <span className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-500 text-[8px] sm:text-[9px] font-bold px-1 py-0.5 rounded border border-yellow-500/20 flex items-center gap-0.5 shrink-0 leading-none">
                                    <Crown className="w-2 h-2" />
                                    RENEWED
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
                            <span className="flex items-center gap-1 bg-gray-900/50 px-1.5 py-0.5 rounded-md border border-gray-800">
                                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="font-medium">{entry.numberOfPeople}</span>
                            </span>
                            <span className={cn(
                                "font-medium flex items-center gap-1 truncate",
                                isWarning ? "text-yellow-500" : isExpired ? "text-gray-500" : "text-blue-400"
                            )}>
                                {isExpired ? 'Ended ' : ''}{timeStatus}
                            </span>
                        </div>
                    </div>

                    {/* Right Side Stats - Compact Stack */}
                    <div className="text-right flex flex-col items-end justify-center gap-0.5 shrink-0 pl-2">
                        <div className="text-white font-bold text-base sm:text-lg leading-none tracking-tight">
                            <span className="text-[10px] text-gray-500 mr-0.5 font-normal align-top">₹</span>
                            {entry.subTotal.toFixed(0)}
                        </div>

                        {entry.snacks.length > 0 && (
                            <div className="bg-gray-800/60 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] text-gray-300 flex items-center gap-1 border border-gray-700/50 whitespace-nowrap">
                                <Coffee className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400" />
                                {entry.snacks.reduce((a, b) => a + b.quantity, 0)}
                            </div>
                        )}
                    </div>

                    {/* Chevron Hidden on Mobile for cleaner look */}
                    <ChevronRight className={cn(
                        "w-4 h-4 sm:w-5 sm:h-5 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 hidden sm:block",
                        "opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                    )} />
                </div>

                {/* Progress Bar - ALWAYS VISIBLE ON MOBILE for utility */}
                {!isExpired && (
                    <div className="absolute bottom-0 left-0 h-[2px] sm:h-[2px] bg-gray-800 w-full">
                        <div
                            className={cn("h-full shadow-[0_0_10px_currentColor]", isWarning ? "bg-yellow-500 text-yellow-500" : "bg-blue-500 text-blue-500")}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    )
}

function EmptyState({ tab }: { tab: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center px-4"
        >
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-900/50 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 relative group overflow-hidden border border-gray-800">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                {tab === 'ongoing' ? (
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Ghost className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600 group-hover:text-blue-400 transition-colors" />
                    </motion.div>
                ) : (
                    <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600 group-hover:text-yellow-400 transition-colors" />
                )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                {tab === 'ongoing' ? "All Stations Clear" : "No History"}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm max-w-[220px] leading-relaxed">
                {tab === 'ongoing'
                    ? "The floor is quiet. Start a new session to begin monitoring."
                    : "History log is currently empty."}
            </p>
        </motion.div>
    )
}