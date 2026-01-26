import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Save, RefreshCw, AlertCircle, TrendingUp, Package, AlertTriangle, Search, X, Filter } from 'lucide-react'
import { SNACK_INVENTORY } from '@/constants/inventory'
import { cn } from '@/lib/utils'
import { Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

interface StockManagementProps {
    stockData: Record<string, number>;
    onUpdateStock: (id: string, newQuantity: number) => Promise<void>;
}

type ViewMode = 'grid' | 'compact' | 'list'
type FilterMode = 'all' | 'low' | 'medium' | 'high'

export function StockManagement({ stockData, onUpdateStock }: StockManagementProps) {
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [localStock, setLocalStock] = useState<Record<string, number>>({})
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode] = useState<ViewMode>('grid')
    const [filterMode, setFilterMode] = useState<FilterMode>('all')
    const [showFilters, setShowFilters] = useState(false)

    // --- Derived Metrics ---
    const stats = useMemo(() => {
        let totalItems = 0
        let totalValue = 0
        let lowStockCount = 0
        let mediumStockCount = 0
        let highStockCount = 0
        const categoryData: Array<{ name: string; value: number; color: string; count: number }> = []

        Object.values(SNACK_INVENTORY).forEach(cat => {
            let catValue = 0
            let catCount = 0
            cat.items.forEach(item => {
                const count = stockData[item.id] ?? 0
                totalItems += count
                totalValue += count * item.price
                catValue += count * item.price
                catCount += count

                if (count < 5) lowStockCount++
                else if (count < 20) mediumStockCount++
                else highStockCount++
            })
            categoryData.push({
                name: cat.label,
                value: catValue,
                count: catCount,
                color: cat.items[0]?.id ? '#3b82f6' : '#eab308'
            })
        })

        return { totalItems, totalValue, lowStockCount, mediumStockCount, highStockCount, categoryData }
    }, [stockData])

    // Memoized flat list for rendering
    const allItems = useMemo(() => {
        return Object.values(SNACK_INVENTORY).flatMap(cat =>
            cat.items.map(item => ({
                ...item,
                categoryLabel: cat.label,
                categoryColor: cat.textColor,
                categoryIcon: cat.icon
            }))
        )
    }, [])

    const filteredItems = useMemo(() => {
        let items = allItems

        // Apply search filter
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase()
            items = items.filter(item =>
                item.name.toLowerCase().includes(lowerQ) ||
                (item.shortName && item.shortName.toLowerCase().includes(lowerQ))
            )
        }

        // Apply stock level filter
        if (filterMode !== 'all') {
            items = items.filter(item => {
                const stock = stockData[item.id] ?? 0
                if (filterMode === 'low') return stock < 5
                if (filterMode === 'medium') return stock >= 5 && stock < 20
                if (filterMode === 'high') return stock >= 20
                return true
            })
        }

        return items
    }, [allItems, searchQuery, filterMode, stockData])

    const handleStockChange = (id: string, val: string) => {
        if (val === '') {
            setLocalStock(prev => ({ ...prev, [id]: 0 }))
            return
        }
        const num = parseInt(val)
        if (!isNaN(num) && num >= 0 && num <= 9999) {
            setLocalStock(prev => ({ ...prev, [id]: num }))
        }
    }

    const incrementStock = (id: string, amount: number = 1) => {
        const current = localStock[id] ?? stockData[id] ?? 0
        handleStockChange(id, Math.max(0, current + amount).toString())
    }

    const decrementStock = (id: string, amount: number = 1) => {
        const current = localStock[id] ?? stockData[id] ?? 0
        handleStockChange(id, Math.max(0, current - amount).toString())
    }

    const saveStock = async (id: string) => {
        const newValue = localStock[id]
        if (newValue === undefined) return

        setUpdatingId(id)
        try {
            await onUpdateStock(id, newValue)
            setLocalStock(prev => {
                const { [id]: _, ...rest } = prev
                return rest
            })
        } catch (error) {
            console.error("Failed to update stock", error)
        } finally {
            setUpdatingId(null)
        }
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
    }

    const stockLevelData = [
        { name: 'Low Stock', value: stats.lowStockCount, color: '#ef4444' },
        { name: 'Medium Stock', value: stats.mediumStockCount, color: '#f59e0b' },
        { name: 'High Stock', value: stats.highStockCount, color: '#10b981' }
    ]

    return (
        <div className="h-auto md:h-full flex flex-col gap-3 sm:gap-4 font-sans max-w-[100vw] overflow-visible md:overflow-hidden px-1 sm:px-0">
            {/* Header Section: Stats */}
            <div className="shrink-0 flex flex-col gap-3">
                {/* Primary Stats - Always Visible */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    <StatCard
                        label="Total Stock"
                        value={stats.totalItems}
                        icon={Package}
                        color="text-blue-400"
                        bg="bg-gradient-to-br from-blue-500/10 to-blue-600/5"
                        borderColor="border-blue-500/20"
                    />
                    <StatCard
                        label="Total Value"
                        value={`₹${stats.totalValue.toLocaleString()}`}
                        icon={TrendingUp}
                        color="text-emerald-400"
                        bg="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5"
                        borderColor="border-emerald-500/20"
                    />
                    <StatCard
                        label="Low Stock"
                        value={stats.lowStockCount}
                        icon={AlertTriangle}
                        color={stats.lowStockCount > 0 ? "text-rose-400" : "text-gray-400"}
                        bg={stats.lowStockCount > 0 ? "bg-gradient-to-br from-rose-500/10 to-rose-600/5" : "bg-gray-800/30"}
                        borderColor={stats.lowStockCount > 0 ? "border-rose-500/20" : "border-gray-800/50"}
                        isAlert={stats.lowStockCount > 0}
                    />

                    {/* Chart Card - Responsive */}
                    <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-gray-900/60 to-gray-900/40 border border-gray-800/50 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Stock Levels</span>
                        </div>
                        <div className="h-16 sm:h-20 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stockLevelData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="60%"
                                        outerRadius="90%"
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {stockLevelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-gray-900 border border-gray-700 p-2 rounded-lg text-xs shadow-xl text-white">
                                                        <span className='font-bold'>{payload[0].name}:</span> <span className='text-blue-400'>{payload[0].value}</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-2">
                    {/* Search */}
                    <div className="relative group flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500/50 rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Button - Mobile */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
                            showFilters
                                ? "bg-blue-600 border-blue-500 text-white"
                                : "bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-700"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Filter</span>
                    </button>

                    {/* Filter Chips - Desktop */}
                    <div className="hidden sm:flex items-center gap-2">
                        {(['all', 'low', 'medium', 'high'] as FilterMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setFilterMode(mode)}
                                className={cn(
                                    "px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all capitalize whitespace-nowrap",
                                    filterMode === mode
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                        : "bg-gray-900/50 text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-gray-300"
                                )}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile Filter Dropdown */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="sm:hidden overflow-hidden"
                        >
                            <div className="flex flex-wrap gap-2 p-3 bg-gray-900/50 border border-gray-800 rounded-xl">
                                {(['all', 'low', 'medium', 'high'] as FilterMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => {
                                            setFilterMode(mode)
                                            setShowFilters(false)
                                        }}
                                        className={cn(
                                            "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all capitalize",
                                            filterMode === mode
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-800 text-gray-400 hover:text-gray-300"
                                        )}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Inventory Grid */}
            <div className="flex-1 md:overflow-y-auto pr-1 -mr-1 custom-scrollbar min-h-0">
                <AnimatePresence mode='popLayout'>
                    <div className={cn(
                        "grid gap-2 sm:gap-3 pb-20 sm:pb-24",
                        viewMode === 'grid' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
                        viewMode === 'compact' && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
                        viewMode === 'list' && "grid-cols-1"
                    )}>
                        {filteredItems.map(item => {
                            const currentStock = localStock[item.id] ?? stockData[item.id] ?? 0
                            const serverStock = stockData[item.id] ?? 0
                            const isChanged = localStock[item.id] !== undefined && localStock[item.id] !== serverStock
                            const isLow = serverStock < 5
                            const isMedium = serverStock >= 5 && serverStock < 20
                            const maxStock = 50
                            const stockPercent = Math.min((currentStock / maxStock) * 100, 100)

                            return (
                                <motion.div
                                    layout
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    key={item.id}
                                    className={cn(
                                        "group relative flex flex-col gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 isolate overflow-hidden",
                                        "bg-gradient-to-br from-gray-900/60 to-gray-900/40 backdrop-blur-sm",
                                        isChanged
                                            ? "border-blue-500/50 shadow-[0_0_30px_-10px_rgba(59,130,246,0.4)] bg-gradient-to-br from-blue-900/20 to-gray-900/60 z-10 scale-[1.02]"
                                            : "border-gray-800/50 hover:border-gray-700/70 hover:bg-gradient-to-br hover:from-gray-900/80 hover:to-gray-900/60",
                                        isLow && !isChanged ? "border-rose-500/30 bg-gradient-to-br from-rose-900/10 to-gray-900/40" : "",
                                        isMedium && !isChanged && !isLow ? "border-amber-500/20 bg-gradient-to-br from-amber-900/5 to-gray-900/40" : ""
                                    )}
                                >
                                    {/* Animated Background Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    {/* Stock Progress Indicator */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-gray-800/40 overflow-hidden rounded-b-xl sm:rounded-b-2xl">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stockPercent}%` }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            className={cn(
                                                "h-full shadow-lg",
                                                currentStock < 5 ? "bg-gradient-to-r from-rose-500 to-rose-600" :
                                                    currentStock < 20 ? "bg-gradient-to-r from-amber-500 to-amber-600" :
                                                        "bg-gradient-to-r from-emerald-500 to-emerald-600"
                                            )}
                                        />
                                    </div>

                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                            <div className={cn(
                                                "w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/10 shrink-0 transition-all duration-300",
                                                "bg-gradient-to-br from-gray-800 to-gray-900",
                                                item.categoryColor,
                                                "group-hover:scale-105 group-hover:shadow-xl"
                                            )}>
                                                <item.categoryIcon className="w-6 h-6 sm:w-7 sm:h-7 transition-transform group-hover:scale-110 duration-300" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-gray-100 text-sm sm:text-base leading-tight truncate">
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 flex-wrap">
                                                    <Badge text={`₹${item.price}`} className="bg-gray-800/80 text-gray-300 ring-1 ring-white/5" />
                                                    {isLow && (
                                                        <Badge text="Low" icon={AlertCircle} className="bg-rose-500/20 text-rose-400 border-rose-500/30 border ring-1 ring-rose-500/20" />
                                                    )}
                                                    {isMedium && (
                                                        <Badge text="Med" className="bg-amber-500/20 text-amber-400 border-amber-500/30 border ring-1 ring-amber-500/20" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0 ml-2">
                                            <div className={cn(
                                                "text-2xl sm:text-3xl font-black tracking-tighter tabular-nums transition-all duration-300",
                                                isChanged ? "text-blue-400 scale-110" : "text-white"
                                            )}>
                                                {currentStock}
                                            </div>
                                            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500">Stock</div>
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    <div className="flex items-center gap-2 h-12 sm:h-14 mt-auto z-10 relative">
                                        <div className="flex-1 flex items-center bg-black/40 rounded-lg sm:rounded-xl border border-gray-800/80 p-1 sm:p-1.5 group-focus-within:border-blue-500/50 transition-all h-full overflow-hidden shadow-inner backdrop-blur-sm">
                                            <ControlBtn
                                                icon={Minus}
                                                onClick={() => decrementStock(item.id)}
                                                onLongPress={() => decrementStock(item.id, 5)}
                                            />
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                value={currentStock}
                                                onChange={(e) => handleStockChange(item.id, e.target.value)}
                                                className="flex-1 w-full bg-transparent text-center font-mono font-bold text-white text-base sm:text-lg focus:outline-none appearance-none px-1 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <ControlBtn
                                                icon={Plus}
                                                onClick={() => incrementStock(item.id)}
                                                onLongPress={() => incrementStock(item.id, 5)}
                                            />
                                        </div>

                                        <AnimatePresence>
                                            {isChanged && (
                                                <motion.button
                                                    initial={{ width: 0, opacity: 0, scale: 0.8 }}
                                                    animate={{ width: 'auto', opacity: 1, scale: 1 }}
                                                    exit={{ width: 0, opacity: 0, scale: 0.8 }}
                                                    transition={{ duration: 0.2 }}
                                                    onClick={() => saveStock(item.id)}
                                                    disabled={updatingId === item.id}
                                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg sm:rounded-xl flex items-center justify-center gap-2 px-3 sm:px-4 shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden whitespace-nowrap transition-all"
                                                >
                                                    {updatingId === item.id ? (
                                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Save className="w-5 h-5" />
                                                    )}
                                                    <span className="hidden sm:inline font-bold text-sm">Save</span>
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </AnimatePresence>

                {filteredItems.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-60 sm:h-80 text-gray-500"
                    >
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                            <Search className="w-10 h-10 sm:w-12 sm:h-12 opacity-30" />
                        </div>
                        <p className="text-base sm:text-lg font-bold opacity-70 mb-1">No items found</p>
                        <p className="text-xs sm:text-sm opacity-50">Try adjusting your search or filters</p>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color?: string;
    bg?: string;
    borderColor?: string;
    isAlert?: boolean;
}

function StatCard({ label, value, icon: Icon, color, bg, borderColor, isAlert = false }: StatCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "flex flex-col p-3 sm:p-4 rounded-xl sm:rounded-2xl border backdrop-blur-md transition-all h-full justify-between shadow-lg relative overflow-hidden",
                bg, borderColor,
                isAlert ? "animate-pulse" : ""
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
            <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-gray-400 truncate">{label}</span>
                <div className={cn("w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-black/20 ring-1 ring-white/5", color)}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
            </div>
            <div className={cn("text-xl sm:text-2xl lg:text-3xl font-black truncate relative z-10", color || "text-white")}>
                {value}
            </div>
        </motion.div>
    )
}

interface BadgeProps {
    text: string;
    icon?: React.ElementType;
    className?: string;
}

function Badge({ text, icon: Icon, className }: BadgeProps) {
    return (
        <span className={cn("text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1 font-mono font-bold whitespace-nowrap backdrop-blur-sm", className)}>
            {Icon && <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
            {text}
        </span>
    )
}

interface ControlBtnProps {
    icon: React.ElementType;
    onClick: () => void;
    onLongPress?: () => void;
}

function ControlBtn({ icon: Icon, onClick, onLongPress }: ControlBtnProps) {
    const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)

    const handleMouseDown = () => {
        if (onLongPress) {
            const timer = setTimeout(() => {
                onLongPress()
            }, 500)
            setPressTimer(timer)
        }
    }

    const handleMouseUp = () => {
        if (pressTimer) {
            clearTimeout(pressTimer)
            setPressTimer(null)
        }
    }

    return (
        <button
            onClick={onClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            className="w-10 sm:w-12 h-full flex items-center justify-center rounded-md sm:rounded-lg hover:bg-white/10 active:bg-white/20 text-gray-400 hover:text-white transition-all active:scale-95 touch-manipulation select-none"
        >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
    )
}
