import { motion, AnimatePresence } from 'framer-motion'
import {
    Clock, Coffee, Trophy, Zap, Ghost,
    History, Activity, AlertCircle, Crown, Trash2, Pause, Play
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
    onDelete?: (entryId: string) => void;
    onPause?: (entry: CustomerEntry) => void;
}

export function RecentActivity({
    recentEntries,
    activityTab,
    setActivityTab,
    currentTime,
    openEntryDetails,
    onDelete,
    onPause
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
            {/* Header - Compact for Mobile, Flex for Tablet/Desktop */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 sm:px-1 gap-3 sm:gap-0 shrink-0">
                <div className="flex flex-col min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent flex items-center gap-2 truncate">
                        Station Feed
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="shrink-0"
                        >
                            <Activity className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                        </motion.div>
                    </h2>
                    <p className="text-gray-500 text-[11px] sm:text-xs uppercase tracking-widest font-medium">Live Monitoring</p>
                </div>

                {/* Tabs - Larger Touch Targets */}
                <div className="self-start sm:self-auto flex items-center gap-1 p-1 rounded-full bg-gray-900/50 border border-gray-800 backdrop-blur-md w-full sm:w-auto overflow-x-auto no-scrollbar">
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
                <div className="absolute top-0 right-0 p-20 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-20 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

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
                                        onDelete={onDelete}
                                        onPause={onPause}
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
                "relative flex-1 sm:flex-none px-4 py-2 sm:px-4 sm:py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden outline-none touch-manipulation select-none whitespace-nowrap",
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
                <Icon className={cn("w-3.5 h-3.5", active && "text-red-400")} />
                {label}
                {count !== undefined && count > 0 && (
                    <span className={cn(
                        "ml-0.5 w-[16px] h-[16px] flex items-center justify-center rounded-full text-[10px] leading-none",
                        active ? "bg-red-500 text-white shadow-lg shadow-red-500/50" : "bg-gray-800 text-gray-400"
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
    onClick,
    onDelete,
    onPause
}: {
    entry: CustomerEntry;
    index: number;
    currentTime: Date;
    onClick: () => void;
    onDelete?: (id: string) => void;
    onPause?: (entry: CustomerEntry) => void;
}) {
    // Timer Logic Corrected for Pause
    // If paused, the "effective" elapsed time stops. 
    // Remaining = Duration - (Elapsed)
    // Elapsed = (isPaused ? pausedAt : now) - timestamp - totalPausedTime

    const isPaused = entry.isPaused
    const pausedAtTime = entry.pausedAt ? (entry.pausedAt instanceof Date ? entry.pausedAt.getTime() : new Date(entry.pausedAt).getTime()) : 0
    const now = currentTime.getTime()
    const startTimeRaw = new Date(entry.timestamp).getTime()

    // Calculate effective elapsed time
    const effectiveNow = isPaused ? pausedAtTime : now
    const totalPaused = entry.totalPausedTime || 0
    const elapsed = effectiveNow - startTimeRaw - totalPaused

    const durationMs = entry.duration * 60 * 60 * 1000
    const remaining = Math.max(0, durationMs - elapsed)

    const isExpired = remaining <= 0 && !isPaused
    const isWarning = remaining > 0 && remaining <= 300000 && !isPaused // 5 mins

    // Visual percentage
    const progressPercent = Math.min(100, Math.max(0, (remaining / durationMs) * 100))

    // Start Time String
    const startTimeString = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    // Formatted time display
    const h = Math.floor(remaining / (1000 * 60 * 60))
    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    // Status text
    let timeStatus = ""
    if (isPaused) {
        timeStatus = "PAUSED"
    } else if (isExpired) {
        // Calculate "overtime" if needed, but for now just show 0 or +time
        // Overtime = now - (startTime + duration + totalPaused)
        const overtime = now - (startTimeRaw + durationMs + totalPaused)
        const eH = Math.floor(overtime / (1000 * 60 * 60))
        const eM = Math.floor((overtime % (1000 * 60 * 60)) / (1000 * 60))
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
                    {/* AVATAR - Responsive sizes */}
                    <div className="relative shrink-0">
                        <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 -rotate-90" viewBox="0 0 56 56">
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
                                        isWarning ? "stroke-yellow-500" : isPaused ? "stroke-gray-600" : "stroke-red-500"
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
                                "text-sm sm:text-base md:text-xl font-black",
                                isWarning ? "text-yellow-500" : isExpired ? "text-gray-600" : "text-red-500"
                            )}>
                                {entry.customerName.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        {/* Status Indicator Icon - Tighter positioning */}
                        <div className="absolute -bottom-0.5 -right-0.5 scale-90 sm:scale-100">
                            {isExpired ? (
                                <div className="bg-gray-800 p-1 rounded-full border border-gray-700">
                                    <Clock className="w-3 h-3 text-gray-500" />
                                </div>
                            ) : isWarning ? (
                                <div className="bg-yellow-500 p-1 rounded-full border border-yellow-600 animate-pulse">
                                    <AlertCircle className="w-3 h-3 text-black" />
                                </div>
                            ) : isPaused ? (
                                <div className="bg-gray-700 p-1 rounded-full border border-gray-600">
                                    <Pause className="w-3 h-3 text-white" />
                                </div>
                            ) : (
                                <div className="bg-red-500 p-1 rounded-full border border-red-600">
                                    <Zap className="w-3 h-3 text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Middle Info - Flex column with no-wrap used flex-1 to fill space */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5 gap-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h3 className={cn(
                                "font-bold text-base sm:text-lg truncate leading-tight",
                                isExpired ? "text-gray-400" : "text-white"
                            )}>
                                {entry.customerName}
                            </h3>
                            {entry.isRenewed && (
                                <span className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-500 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-500/20 flex items-center gap-0.5 shrink-0 leading-none">
                                    <Crown className="w-2.5 h-2.5" />
                                    RENEWED
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1 bg-gray-900/50 px-1.5 py-0.5 rounded-md border border-gray-800 shrink-0">
                                <Clock className="w-3 h-3 text-red-500" />
                                <span className="font-medium whitespace-nowrap">{startTimeString}</span>
                            </span>
                            <span className={cn(
                                "font-medium flex items-center gap-1 truncate",
                                isWarning ? "text-yellow-500" : isExpired ? "text-gray-500" : isPaused ? "text-yellow-400" : "text-red-400"
                            )}>
                                {isExpired ? 'Ended ' : ''}{timeStatus}
                            </span>
                        </div>
                    </div>

                    {/* Right Side Stats & Actions - Responsive Layout */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Money & Snacks */}
                        <div className="text-right flex flex-col items-end justify-center gap-0.5">
                            <div className="text-white font-bold text-lg sm:text-xl leading-none tracking-tight">
                                <span className="text-xs text-gray-500 mr-0.5 font-normal align-top">₹</span>
                                {entry.subTotal.toFixed(0)}
                            </div>

                            {entry.snacks.length > 0 && (
                                <div className="bg-gray-800/60 px-1.5 py-0.5 rounded text-[10px] sm:text-xs text-gray-300 flex items-center gap-1 border border-gray-700/50 whitespace-nowrap">
                                    <Coffee className="w-3 h-3 text-red-400" />
                                    {entry.snacks.reduce((a, b) => a + b.quantity, 0)}
                                </div>
                            )}
                        </div>

                        {/* ACTIONS (Pause/Resume & Delete) - visible on mobile/tablet too */}
                        <div className="flex items-center gap-1 pl-0 sm:pl-2 sm:border-l sm:border-gray-800">
                            {onPause && !isExpired && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onPause(entry)
                                    }}
                                    className={cn(
                                        "p-2 sm:p-1.5 rounded-lg transition-colors touch-manipulation",
                                        isPaused ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                                    )}
                                    title={isPaused ? "Resume Session" : "Pause Session"}
                                >
                                    {isPaused ? <Play className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Pause className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (confirm("Are you sure you want to delete this session?")) {
                                            onDelete(entry.id)
                                        }
                                    }}
                                    className="p-2 sm:p-1.5 rounded-lg bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors touch-manipulation"
                                    title="Delete Session"
                                >
                                    <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progress Bar - ALWAYS VISIBLE ON MOBILE for utility */}
                {!isExpired && (
                    <div className="absolute bottom-0 left-0 h-[2px] sm:h-[2px] bg-gray-800 w-full">
                        <div
                            className={cn("h-full shadow-[0_0_10px_currentColor]", isWarning ? "bg-yellow-500 text-yellow-500" : "bg-red-500 text-red-500")}
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
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                {tab === 'ongoing' ? (
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Ghost className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600 group-hover:text-red-400 transition-colors" />
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