import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Box, Save, RefreshCw, AlertCircle, TrendingUp, Package, AlertTriangle } from 'lucide-react'
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

    // --- Derived Metrics ---
    const stats = useMemo(() => {
        let totalItems = 0
        let totalValue = 0
        let lowStockCount = 0
        const categoryData: any[] = []

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

    const handleStockChange = (id: string, val: string) => {
        const num = parseInt(val)
        if (!isNaN(num) && num >= 0) {
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

    return (
        <div className="h-full flex flex-col space-y-3 md:space-y-4">
            {/* Header & Stats Grid */}
            <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 bg-gray-900/50 p-2 md:p-3 rounded-2xl border border-gray-800/50 backdrop-blur-sm shadow-sm">
                <div className="flex flex-col bg-gray-800/30 rounded-xl p-2 md:p-0 md:bg-transparent">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Total Stock</span>
                    <span className="text-lg md:text-2xl font-black text-white flex items-center gap-1.5">
                        <Package className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                        {stats.totalItems}
                    </span>
                </div>
                <div className="flex flex-col bg-gray-800/30 rounded-xl p-2 md:p-0 md:bg-transparent">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Value</span>
                    <span className="text-lg md:text-2xl font-black text-white flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                        ₹{stats.totalValue.toLocaleString()}
                    </span>
                </div>
                <div className="flex flex-col bg-gray-800/30 rounded-xl p-2 md:p-0 md:bg-transparent">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Low Items</span>
                    <span className={cn(
                        "text-lg md:text-2xl font-black flex items-center gap-1.5",
                        stats.lowStockCount > 0 ? "text-red-400" : "text-gray-400"
                    )}>
                        <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                        {stats.lowStockCount}
                    </span>
                </div>
                {/* Mini Chart Area */}
                <div className="flex-1 h-14 md:h-auto min-h-[48px] bg-gray-800/30 rounded-xl md:bg-transparent p-1 md:p-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.categoryData}>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-black/90 border border-gray-800 p-2 rounded text-xs z-50 shadow-xl">
                                                <p className="font-bold text-white">{payload[0].payload.name}</p>
                                                <p className="text-green-400">₹{payload[0].value}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {stats.categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#eab308'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Inventory List */}
            <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar touch-pan-y">
                <div className="grid grid-cols-1 gap-3 md:gap-4 pb-20 lg:grid-cols-2">
                    {Object.values(SNACK_INVENTORY).flatMap(category =>
                        category.items.map(item => {
                            const currentStock = localStock[item.id] ?? stockData[item.id] ?? 0
                            const isChanged = localStock[item.id] !== undefined && localStock[item.id] !== (stockData[item.id] ?? 0)
                            const isLow = (stockData[item.id] ?? 0) < 5
                            const maxStock = 50
                            const stockPercent = Math.min((currentStock / maxStock) * 100, 100)

                            const barColor = currentStock < 5 ? 'bg-red-500' : currentStock < 20 ? 'bg-yellow-500' : 'bg-green-500'

                            return (
                                <motion.div
                                    layout
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={cn(
                                        "relative overflow-hidden bg-gray-900/40 border rounded-xl p-3 md:p-4 flex flex-col gap-3 transition-all duration-300 group active:scale-[0.99]",
                                        isChanged ? "border-blue-500/50 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]" : "border-gray-800/50",
                                        isLow && !isChanged ? "border-red-500/30 bg-red-900/10" : ""
                                    )}
                                >
                                    {/* Background Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800/50">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stockPercent}%` }}
                                            className={cn("h-full opacity-50", barColor)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between z-10">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className={cn(
                                                "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center bg-gray-800 shadow-inner ring-1 ring-white/5 shrink-0",
                                                category.textColor
                                            )}>
                                                <category.icon className="w-6 h-6 md:w-7 md:h-7 transition-transform group-hover:scale-110" />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-100 text-sm md:text-lg leading-tight">{item.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] md:text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono font-bold">₹{item.price}</span>
                                                    {isLow && (
                                                        <span className="text-[10px] md:text-xs font-bold text-red-400 flex items-center gap-1 animate-pulse">
                                                            <AlertCircle className="w-3 h-3" /> Low
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="block text-2xl md:text-3xl font-black text-white tracking-tighter tabular-nums">
                                                {currentStock}
                                            </span>
                                            <span className="text-[9px] md:text-[10px] text-gray-500 uppercase font-bold tracking-wider">In Stock</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-1 z-10 h-10 md:h-12">
                                        <div className="flex-1 flex items-center bg-black/40 rounded-lg border border-gray-800 p-1 group-focus-within:border-blue-500/50 transition-colors h-full">
                                            <button
                                                onClick={() => handleStockChange(item.id, Math.max(0, currentStock - 1).toString())}
                                                className="w-10 h-full flex items-center justify-center rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors active:scale-95 touch-manipulation"
                                            >
                                                <Minus className="w-4 h-4 md:w-5 md:h-5" />
                                            </button>
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={currentStock}
                                                onChange={(e) => handleStockChange(item.id, e.target.value)}
                                                className="flex-1 bg-transparent text-center font-mono font-bold text-white text-lg focus:outline-none appearance-none h-full"
                                            />
                                            <button
                                                onClick={() => handleStockChange(item.id, (currentStock + 1).toString())}
                                                className="w-10 h-full flex items-center justify-center rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-colors active:scale-95 touch-manipulation"
                                            >
                                                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {isChanged && (
                                                <motion.button
                                                    initial={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0 }}
                                                    animate={{ opacity: 1, width: 'auto', paddingLeft: 16, paddingRight: 16 }}
                                                    exit={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0 }}
                                                    onClick={() => saveStock(item.id)}
                                                    disabled={updatingId === item.id}
                                                    className="h-full bg-blue-600 hover:bg-blue-500 box-shadow-blue text-white rounded-lg flex items-center justify-center gap-2 text-xs md:text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 active:scale-95 overflow-hidden whitespace-nowrap"
                                                >
                                                    {updatingId === item.id ? (
                                                        <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Save className="w-4 h-4 md:w-5 md:h-5" />
                                                            <span className="hidden sm:inline">Save</span>
                                                        </>
                                                    )}
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
