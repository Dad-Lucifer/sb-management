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
        <div className="flex flex-col h-full space-y-4">
            {/* Minimal Header & Menu */}
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                    <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent flex items-center gap-2">
                        Station Feed
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                            <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
                        </motion.div>
                    </h2>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-medium">Live Monitoring</p>
                </div>

                {/* Minimal Segmented Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-full bg-gray-900/50 border border-gray-800 backdrop-blur-md">
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

            {/* Main Content Area */}
            <div className="flex-1 min-h-[400px] md:min-h-[500px] relative rounded-3xl overflow-hidden bg-gradient-to-b from-gray-900/40 to-black/40 border border-gray-800/50 backdrop-blur-xl shadow-2xl">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-20 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-20 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                <ScrollArea className="h-[400px] md:h-[600px]">
                    <div className="p-4 space-y-3">
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
            </div>
        </div>
    )
}

function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean, onClick: () => void, icon: any, label: string, count?: number }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden",
                active ? "text-white" : "text-gray-500 hover:text-gray-300"
            )}
        >
            {active && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gray-800 shadow-inner"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
                <Icon className={cn("w-3.5 h-3.5", active && "text-blue-400")} />
                {label}
                {count !== undefined && count > 0 && (
                    <span className={cn(
                        "ml-0.5 w-[14px] h-[14px] flex items-center justify-center rounded-full text-[9px]",
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
        timeStatus = `Exceeded by ${eH > 0 ? `${eH}h ` : ''}${eM}m`
    } else {
        timeStatus = `${h}h ${m}m remaining`
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={onClick}
            className="group cursor-pointer"
        >
            <div className={cn(
                "relative p-3 md:p-4 rounded-2xl border transition-all duration-300 overflow-hidden",
                "bg-black/40 hover:bg-gray-900/60 backdrop-blur-md",
                isWarning
                    ? "border-yellow-500/30 shadow-[0_0_30px_-10px_rgba(234,179,8,0.1)]"
                    : isExpired
                        ? "border-gray-800/50 opacity-70 hover:opacity-100"
                        : "border-gray-800 hover:border-blue-500/30 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.1)]"
            )}>
                <div className="flex items-center gap-3 md:gap-4">
                    {/* AVATAR with Circular Progress */}
                    <div className="relative">
                        {/* Progress Ring Background */}
                        <svg className="w-12 h-12 md:w-14 md:h-14 -rotate-90" viewBox="0 0 56 56">
                            <circle
                                cx="28" cy="28" r="26"
                                className="stroke-gray-800 fill-none"
                                strokeWidth="3"
                            />
                            {!isExpired && (
                                <circle
                                    cx="28" cy="28" r="26"
                                    className={cn(
                                        "fill-none transition-all duration-1000 ease-in-out",
                                        isWarning ? "stroke-yellow-500" : "stroke-blue-500"
                                    )}
                                    strokeWidth="3"
                                    strokeDasharray="163.36" // 2 * pi * 26
                                    strokeDashoffset={163.36 * (1 - progressPercent / 100)}
                                    strokeLinecap="round"
                                />
                            )}
                        </svg>

                        {/* Avatar Content */}
                        <div className="absolute inset-[5px] rounded-full bg-gray-900 flex items-center justify-center overflow-hidden border border-gray-800">
                            <span className={cn(
                                "text-base md:text-lg font-black",
                                isWarning ? "text-yellow-500" : isExpired ? "text-gray-600" : "text-blue-500"
                            )}>
                                {entry.customerName.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        {/* Status Indicator Icon */}
                        <div className="absolute -bottom-1 -right-1">
                            {isExpired ? (
                                <div className="bg-gray-800 p-1 rounded-full border border-gray-700">
                                    <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-500" />
                                </div>
                            ) : isWarning ? (
                                <div className="bg-yellow-500 p-1 rounded-full border border-yellow-600 animate-pulse">
                                    <AlertCircle className="w-2.5 h-2.5 md:w-3 md:h-3 text-black" />
                                </div>
                            ) : (
                                <div className="bg-blue-500 p-1 rounded-full border border-blue-600">
                                    <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className={cn(
                                "font-bold text-sm md:text-base truncate",
                                isExpired ? "text-gray-400" : "text-white"
                            )}>
                                {entry.customerName}
                            </h3>
                            {entry.isRenewed && (
                                <span className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-500/20 flex items-center gap-1">
                                    <Crown className="w-2.5 h-2.5" />
                                    RENEWED
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5">
                                <User className="w-3 h-3" />
                                {entry.numberOfPeople} guest{entry.numberOfPeople !== 1 && 's'}
                            </span>
                            <span className="w-1 h-1 bg-gray-700 rounded-full" />
                            <span className={cn(
                                "font-medium flex items-center gap-1",
                                isWarning ? "text-yellow-500" : isExpired ? "text-gray-500" : "text-blue-400"
                            )}>
                                {timeStatus}
                            </span>
                        </div>
                    </div>

                    {/* Right Side Stats */}
                    <div className="text-right flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5">
                            <div className="text-white font-bold text-base md:text-lg leading-none">
                                <span className="text-xs text-gray-500 mr-0.5 font-normal">₹</span>
                                {entry.subTotal.toFixed(0)}
                            </div>
                        </div>

                        {entry.snacks.length > 0 && (
                            <div className="bg-gray-800/80 px-2 py-1 rounded-lg text-[10px] text-gray-300 flex items-center gap-1.5 border border-gray-700/50">
                                <Coffee className="w-3 h-3 text-purple-400" />
                                {entry.snacks.reduce((a, b) => a + b.quantity, 0)} items
                            </div>
                        )}
                    </div>

                    {/* Hover Chevron */}
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2" />
                </div>

                {/* Progress Bar Line for instant visual feel */}
                {!isExpired && (
                    <div className="absolute bottom-0 left-0 h-[2px] bg-gray-800 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <div
                            className={cn("h-full", isWarning ? "bg-yellow-500" : "bg-blue-500")}
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
            className="flex flex-col items-center justify-center py-20 text-center"
        >
            <div className="w-24 h-24 bg-gray-900/50 rounded-3xl flex items-center justify-center mb-6 relative group overflow-hidden border border-gray-800">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                {tab === 'ongoing' ? (
                    <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Ghost className="w-10 h-10 text-gray-600 group-hover:text-blue-400 transition-colors" />
                    </motion.div>
                ) : (
                    <Trophy className="w-10 h-10 text-gray-600 group-hover:text-yellow-400 transition-colors" />
                )}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
                {tab === 'ongoing' ? "All Stations Clear" : "No Past Activities"}
            </h3>
            <p className="text-gray-500 text-sm max-w-[200px] leading-relaxed">
                {tab === 'ongoing'
                    ? "The floor is quiet. Initialize a new session to see live activity here."
                    : "Your history log is waiting for its first completed mission."}
            </p>
        </motion.div>
    )
}
