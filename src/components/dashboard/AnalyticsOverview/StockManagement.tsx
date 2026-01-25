import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Save, RefreshCw, AlertCircle, TrendingUp, Package, AlertTriangle, Search } from 'lucide-react'
import { SNACK_INVENTORY } from '@/constants/inventory'
import { cn } from '@/lib/utils'
import { BarChart, Bar, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface StockManagementProps {
    stockData: Record<string, number>;
    onUpdateStock: (id: string, newQuantity: number) => Promise<void>;
}

export function StockManagement({ stockData, onUpdateStock }: StockManagementProps) {
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [localStock, setLocalStock] = useState<Record<string, number>>({})
    const [searchQuery, setSearchQuery] = useState('')

    // --- Derived Metrics ---
    const stats = useMemo(() => {
        let totalItems = 0
        let totalValue = 0
        let lowStockCount = 0
        const categoryData: Array<{ name: string; value: number; color: string }> = []

        Object.values(SNACK_INVENTORY).forEach(cat => {
            let catValue = 0
            cat.items.forEach(item => {
                const count = stockData[item.id] ?? 0
                totalItems += count
                totalValue += count * item.price
                catValue += count * item.price
                if (count < 5) lowStockCount++
            })
            categoryData.push({
                name: cat.label,
                value: catValue,
                color: cat.items[0]?.id ? '#3b82f6' : '#eab308'
            })
        })

        return { totalItems, totalValue, lowStockCount, categoryData }
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
        if (!searchQuery) return allItems
        const lowerQ = searchQuery.toLowerCase()
        return allItems.filter(item =>
            item.name.toLowerCase().includes(lowerQ) ||
            (item.shortName && item.shortName.toLowerCase().includes(lowerQ))
        )
    }, [allItems, searchQuery])


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
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } }
    }

    return (
        <div className="h-full flex flex-col space-y-4 font-sans max-w-[100vw] overflow-hidden">
            {/* Header Section: Stats & Search */}
            <div className="shrink-0 flex flex-col gap-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    <StatCard
                        label="Total Stock"
                        value={stats.totalItems}
                        icon={Package}
                        color="text-blue-400"
                        bg="bg-blue-500/10"
                        borderColor="border-blue-500/20"
                    />
                    <StatCard
                        label="Total Value"
                        value={`₹${stats.totalValue.toLocaleString()}`}
                        icon={TrendingUp}
                        color="text-emerald-400"
                        bg="bg-emerald-500/10"
                        borderColor="border-emerald-500/20"
                    />
                    <StatCard
                        label="Low Stock"
                        value={stats.lowStockCount}
                        icon={AlertTriangle}
                        color={stats.lowStockCount > 0 ? "text-rose-400" : "text-gray-400"}
                        bg={stats.lowStockCount > 0 ? "bg-rose-500/10" : "bg-gray-800/50"}
                        borderColor={stats.lowStockCount > 0 ? "border-rose-500/20" : "border-gray-800"}
                        isAlert={stats.lowStockCount > 0}
                    />

                    {/* Mini Chart */}
                    <div className="bg-gray-900/40 border border-gray-800/50 rounded-xl p-2 min-h-[70px] flex items-end">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.categoryData}>
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload as { name: string; value: number };
                                            return (
                                                <div className="bg-gray-900 border border-gray-700 p-1.5 rounded text-[10px] shadow-xl text-white z-50">
                                                    <span className='font-bold'>{data.name}:</span> <span className='text-emerald-400'>₹{payload[0].value}</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                    {stats.categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-800 focus:border-blue-500/50 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Inventory Grid */}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                <AnimatePresence mode='popLayout'>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3 pb-24">
                        {filteredItems.map(item => {
                            const currentStock = localStock[item.id] ?? stockData[item.id] ?? 0
                            const serverStock = stockData[item.id] ?? 0
                            const isChanged = localStock[item.id] !== undefined && localStock[item.id] !== serverStock
                            const isLow = serverStock < 5
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
                                        "group relative flex flex-col gap-3 p-3 md:p-4 rounded-xl border transition-all duration-300 isolate",
                                        "bg-gray-900/40 backdrop-blur-sm",
                                        isChanged ? "border-blue-500/40 shadow-[0_0_20px_-10px_rgba(59,130,246,0.3)] bg-gray-900/80 z-10" : "border-gray-800/40 hover:border-gray-700/60 hover:bg-gray-900/60",
                                        isLow && !isChanged ? "border-rose-500/20 bg-rose-900/5" : ""
                                    )}
                                >
                                    {/* Stock Progress Indicator */}
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 md:h-1 bg-gray-800/30 overflow-hidden rounded-b-xl">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stockPercent}%` }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className={cn("h-full",
                                                currentStock < 5 ? "bg-rose-500" :
                                                    currentStock < 20 ? "bg-amber-500" : "bg-emerald-500"
                                            )}
                                        />
                                    </div>

                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                                "w-11 h-11 md:w-12 md:h-12 rounded-lg flex items-center justify-center bg-gray-800 shadow-inner ring-1 ring-white/5 shrink-0",
                                                item.categoryColor
                                            )}>
                                                <item.categoryIcon className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110 duration-300" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-200 text-sm md:text-base leading-tight truncate">
                                                    {item.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <Badge text={`₹${item.price}`} className="bg-gray-800 text-gray-400" />
                                                    {isLow && (
                                                        <Badge text="Low Stock" icon={AlertCircle} className="bg-rose-500/10 text-rose-400 border-rose-500/20 border" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className={cn(
                                                "text-2xl md:text-3xl font-black tracking-tighter tabular-nums transition-colors",
                                                isChanged ? "text-blue-400" : "text-white"
                                            )}>
                                                {currentStock}
                                            </div>
                                            <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-500">In Stock</div>
                                        </div>
                                    </div>

                                    {/* Action Area */}
                                    <div className="flex items-center gap-2 h-11 md:h-12 mt-auto z-10 pt-1">
                                        <div className="flex-1 flex items-center bg-black/40 rounded-lg border border-gray-800 p-1 group-focus-within:border-blue-500/40 transition-colors h-full overflow-hidden">
                                            <ControlBtn
                                                icon={Minus}
                                                onClick={() => handleStockChange(item.id, Math.max(0, currentStock - 1).toString())}
                                            />
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                value={currentStock}
                                                onChange={(e) => handleStockChange(item.id, e.target.value)}
                                                className="flex-1 w-full bg-transparent text-center font-mono font-bold text-white text-lg focus:outline-none appearance-none px-0"
                                            />
                                            <ControlBtn
                                                icon={Plus}
                                                onClick={() => handleStockChange(item.id, (currentStock + 1).toString())}
                                            />
                                        </div>

                                        <AnimatePresence>
                                            {isChanged && (
                                                <motion.button
                                                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                                                    animate={{ width: 'auto', opacity: 1, marginLeft: 8 }}
                                                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                                                    onClick={() => saveStock(item.id)}
                                                    disabled={updatingId === item.id}
                                                    className="h-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 px-4 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden whitespace-nowrap"
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
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                        <Search className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-sm font-medium opacity-50">No items found matching "{searchQuery}"</p>
                    </div>
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
        <div className={cn(
            "flex flex-col p-2 md:p-3 rounded-xl border backdrop-blur-md transition-all h-full justify-between",
            bg, borderColor,
            isAlert ? "animate-pulse" : ""
        )}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 truncate">{label}</span>
                <Icon className={cn("w-3.5 h-3.5 md:w-4 md:h-4", color)} />
            </div>
            <div className={cn("text-lg md:text-xl lg:text-2xl font-black truncate", color || "text-white")}>
                {value}
            </div>
        </div>
    )
}

interface BadgeProps {
    text: string;
    icon?: React.ElementType;
    className?: string;
}

function Badge({ text, icon: Icon, className }: BadgeProps) {
    return (
        <span className={cn("text-[9px] md:text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-mono font-bold whitespace-nowrap", className)}>
            {Icon && <Icon className="w-3 h-3" />}
            {text}
        </span>
    )
}

interface ControlBtnProps {
    icon: React.ElementType;
    onClick: () => void;
}

function ControlBtn({ icon: Icon, onClick }: ControlBtnProps) {
    return (
        <button
            onClick={onClick}
            className="w-10 md:w-12 h-full flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors active:scale-95 touch-manipulation"
        >
            <Icon className="w-5 h-5" />
        </button>
    )
}
