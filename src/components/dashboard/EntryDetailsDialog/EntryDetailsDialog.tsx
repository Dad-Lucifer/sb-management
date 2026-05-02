import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, User, Phone, Clock, Plus, Minus, ShoppingCart,
    Crown, Check, Coffee, CreditCard, Banknote, Activity, Star
} from 'lucide-react'
import { useMemo } from 'react'
import { CustomerEntry, SnackOrder } from '@/types/dashboard'
import { SNACK_INVENTORY, ALL_SNACKS_MAP, calculateSessionPriceWithTime, isHappyHour, getHappyHourRate } from '@/constants/inventory'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface EntryDetailsDialogProps {
    entry: CustomerEntry | null
    isOpen: boolean
    onClose: () => void
    onSave: (duration: number, numberOfPeople: number, snacks: SnackOrder[]) => void
    onSplitPayment?: (entry: CustomerEntry, cashAmount: number, onlineAmount: number) => Promise<void>
    readOnly?: boolean
}

export function EntryDetailsDialog({
    entry,
    isOpen,
    onClose,
    onSave,
    onSplitPayment,
    readOnly = false
}: EntryDetailsDialogProps) {
    const [editDuration, setEditDuration] = useState('')
    const [editNumberOfPeople, setEditNumberOfPeople] = useState('1')
    const [editSnacks, setEditSnacks] = useState<SnackOrder[]>([])
    const [isSuccess, setIsSuccess] = useState(false)
    const [activeCategory, setActiveCategory] = useState<string>(Object.keys(SNACK_INVENTORY)[0] || '')
    const [activeSection, setActiveSection] = useState<'session' | 'supply'>('session')

    // Split Payment State
    const [splitAmount, setSplitAmount] = useState('')
    const [isSubmittingSplit, setIsSubmittingSplit] = useState(false)

    // Split Logic
    const currentMode = entry?.paymentMode || 'offline'
    const splitTargetMode = currentMode === 'online' ? 'cash' : 'online'
    const splitTargetLabel = splitTargetMode === 'cash' ? 'Cash' : 'Online'

    const calculatedSplit = useMemo(() => {
        if (!entry) return null
        const amount = parseFloat(splitAmount)
        if (isNaN(amount)) return null

        const inputVal = Math.max(0, Math.min(amount, entry.subTotal))
        const remainingVal = entry.subTotal - inputVal

        if (currentMode === 'online') {
            return { cash: inputVal, online: remainingVal }
        } else {
            return { online: inputVal, cash: remainingVal }
        }
    }, [splitAmount, entry, currentMode])

    const isValidSplit = entry && calculatedSplit && parseFloat(splitAmount) > 0 && parseFloat(splitAmount) < entry.subTotal

    const handleSplitSubmit = async () => {
        if (!isValidSplit || !onSplitPayment || !calculatedSplit || !entry) return
        setIsSubmittingSplit(true)
        try {
            await onSplitPayment(entry, calculatedSplit.cash, calculatedSplit.online)
            setSplitAmount('')
            onClose()
        } finally {
            setIsSubmittingSplit(false)
        }
    }

    useEffect(() => {
        if (entry) {
            setEditDuration(entry.duration.toString())
            setEditNumberOfPeople((entry.numberOfPeople || 1).toString())
            setEditSnacks(entry.snacks || [])
            setIsSuccess(false)
        }
    }, [entry])

    if (!entry) return null

    // Happy-hour is determined by the entry's own booking timestamp
    const bookingTime = new Date(entry.timestamp)
    const entryIsHappyHour = isHappyHour(bookingTime)
    const happyHourRate = getHappyHourRate(parseInt(editNumberOfPeople) || 1)

    const handleEditSnackChange = (itemId: string, delta: number) => {
        const itemDef = ALL_SNACKS_MAP[itemId]
        if (!itemDef) return

        setEditSnacks(prev => {
            const existingIndex = prev.findIndex(s => s.id === itemId)
            if (existingIndex >= 0) {
                const newQty = prev[existingIndex].quantity + delta
                if (newQty <= 0) return prev.filter((_, i) => i !== existingIndex)
                const updated = [...prev]
                updated[existingIndex] = { ...updated[existingIndex], quantity: newQty, totalPrice: newQty * updated[existingIndex].unitPrice }
                return updated
            } else {
                if (delta <= 0) return prev
                return [...prev, { id: itemId, name: itemDef.name, category: 'manual', quantity: delta, unitPrice: itemDef.price, totalPrice: itemDef.price * delta }]
            }
        })
    }

    const getSnackQuantity = (itemId: string) => {
        return editSnacks.find(s => s.id === itemId)?.quantity || 0
    }

    const calculateEditSubTotal = () => {
        const durationNum = parseFloat(editDuration) || 0
        const peopleNum = parseInt(editNumberOfPeople) || 1
        const snacksPrice = editSnacks.reduce((total, snack) => total + (snack.totalPrice || 0), 0)
        return calculateSessionPriceWithTime(durationNum, peopleNum, bookingTime) + snacksPrice
    }

    const handleSubmit = async () => {
        const newDuration = parseFloat(editDuration)
        const newPeople = parseInt(editNumberOfPeople) || 1
        if (!newDuration || newDuration <= 0) return
        setIsSuccess(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        onSave(newDuration, newPeople, editSnacks)
    }

    const totalItems = editSnacks.reduce((sum, s) => sum + s.quantity, 0)

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Container - Bottom Sheet on Mobile, Centered Modal on Desktop */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={cn(
                            "relative w-full flex flex-col shadow-[0_0_50px_rgba(239,68,68,0.1)] overflow-hidden bg-[#2A0800] border-t sm:border sm:border-yellow-900/40",
                            "h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-none sm:w-[600px] sm:max-w-2xl sm:my-4"
                        )}
                        style={{ borderRadius: "12px" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-32 bg-yellow-600/20 blur-[60px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-2/3 h-32 bg-[#DAA520]/10 blur-[60px] rounded-full pointer-events-none" />

                        {/* Header Section */}
                        <div className="relative z-10 shrink-0 pt-6 pb-4 px-6 bg-gradient-to-b from-white/5 to-transparent">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4">
                                    {/* Avatar */}
                                    <div className="relative w-16 h-16 rounded-none bg-gradient-to-br from-red-600 to-red-800 p-[2px] shadow-[0_0_15px_rgba(239,68,68,0.3)] overflow-hidden group" style={{ borderRadius: "12px" }}>
                                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(239,68,68,0.2)_50%,transparent_100%)] bg-[length:100%_200%] animate-[scan_2s_linear_infinite]" />
                                        <div className="w-full h-full bg-[#050505] flex items-center justify-center relative z-10 group-hover:bg-red-950/20 transition-colors">
                                            <span className="text-2xl font-black text-yellow-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">{entry.customerName.charAt(0)}</span>
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                        <h2 className="text-xl font-bold text-yellow-50 leading-tight flex items-center gap-2">
                                            {entry.customerName}
                                            {entry.isRenewed && <Crown className="w-4 h-4 text-yellow-400" />}
                                        </h2>
                                        <p className="text-yellow-600/70 text-sm mt-1 flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            {entry.phoneNumber}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {entry.age && entry.age > 0 && (
                                                <div className="text-xs font-medium text-yellow-600/70 bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700 flex items-center gap-1.5">
                                                    <User className="w-3 h-3 text-yellow-500" />
                                                    {entry.age}
                                                </div>
                                            )}
                                            {entry.paymentMode && (
                                                <div className={cn(
                                                    "text-xs font-bold uppercase px-2 py-0.5 rounded border flex items-center gap-1.5",
                                                    entry.paymentMode === 'online'
                                                        ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                                                        : "bg-green-500/10 text-green-400 border-green-500/30"
                                                )}>
                                                    {entry.paymentMode === 'online' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                                                    {entry.paymentMode}
                                                </div>
                                            )}
                                            {/* Happy Hour Chip */}
                                            {entryIsHappyHour && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-xs font-bold px-2 py-0.5 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/30 flex items-center gap-1.5"
                                                >
                                                    <Star className="w-3 h-3" />
                                                    Happy Hour · ₹{happyHourRate}/hr
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-full bg-yellow-900/20 hover:bg-gray-700 text-yellow-50 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Custom Segmented Control Tabs */}
                            <div className="relative bg-[#050505] p-1 border border-yellow-900/40 flex" style={{ borderRadius: "12px" }}>
                                <div
                                    className={cn(
                                        "absolute top-1 left-1 bottom-1 w-[calc(50%-4px)] bg-yellow-600/20 border border-yellow-500/50 shadow-sm transition-transform duration-300",
                                        activeSection === 'session' ? "translate-x-0" : "translate-x-full"
                                    )}
                                />
                                <button
                                    onClick={() => setActiveSection('session')}
                                    className={cn("flex-1 relative z-10 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2", activeSection === 'session' ? "text-yellow-50" : "text-yellow-600/50")}
                                >
                                    <Clock className="w-4 h-4" />
                                    Session
                                </button>
                                <button
                                    onClick={() => setActiveSection('supply')}
                                    className={cn("flex-1 relative z-10 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2", activeSection === 'supply' ? "text-yellow-50" : "text-yellow-600/50")}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    Supply
                                    {totalItems > 0 && <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />}
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 min-h-0 relative overflow-hidden bg-gradient-to-b from-transparent to-black">
                            <ScrollArea className="h-full">
                                <div className="p-6 pb-64">

                                    {/* SECTION: SESSION PARAMETERS */}
                                    {activeSection === 'session' && (
                                        <div className="space-y-6">
                                            {/* Time Card */}
                                            <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
                                                <label className="text-xs font-bold text-yellow-600/70 uppercase tracking-wider mb-3 block">Duration (Hours)</label>
                                                <div className="flex items-center gap-3">
                                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditDuration(Math.max(0.5, parseFloat(editDuration) - 0.5).toString())} className="h-12 w-12 rounded-xl bg-gray-800 border border-gray-700 text-yellow-50 hover:bg-gray-700 flex items-center justify-center">
                                                        <Minus className="w-5 h-5" />
                                                    </motion.button>
                                                    <div className="flex-1 h-14 bg-black/50 rounded-xl border border-yellow-900/40 flex items-center justify-center">
                                                        <Input type="number" step="0.5" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="w-full h-full bg-transparent border-none text-center text-2xl font-black text-yellow-50 focus:ring-0" />
                                                    </div>
                                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditDuration((parseFloat(editDuration) + 0.5).toString())} className="h-12 w-12 rounded-xl bg-yellow-600 border border-yellow-500 text-yellow-50 hover:bg-yellow-500 shadow-lg shadow-red-600/20 flex items-center justify-center">
                                                        <Plus className="w-5 h-5" />
                                                    </motion.button>
                                                </div>
                                            </div>

                                            {/* People Card */}
                                            <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
                                                <label className="text-xs font-bold text-yellow-600/70 uppercase tracking-wider mb-3 block">Party Size</label>
                                                <div className="h-14 bg-black/50 rounded-xl border border-yellow-900/40 flex items-center justify-center px-4">
                                                    <User className="w-5 h-5 text-yellow-600/50 mr-3" />
                                                    <span className="text-xl font-bold text-yellow-50">{editNumberOfPeople} People</span>
                                                </div>
                                            </div>

                                            {/* Split Payment Card - Only if not already split */}
                                            {onSplitPayment && !entry.splitPayment && !readOnly && (
                                                <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <label className="text-xs font-bold text-yellow-600/70 uppercase tracking-wider block">Split Payment</label>
                                                        <span className="text-xs text-blue-400 font-mono">Total: ₹{entry.subTotal}</span>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="relative">
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-600/50 pointer-events-none">₹</div>
                                                            <input
                                                                type="number"
                                                                value={splitAmount}
                                                                onChange={(e) => setSplitAmount(e.target.value)}
                                                                placeholder={`Enter ${splitTargetLabel} Amount`}
                                                                className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-7 pr-3 text-sm text-yellow-50 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-gray-600"
                                                                inputMode="decimal"
                                                            />
                                                        </div>

                                                        {calculatedSplit && (
                                                            <div className="flex items-center justify-between text-xs px-1">
                                                                <div className="flex items-center gap-1.5 text-green-400">
                                                                    <Banknote className="w-3 h-3" />
                                                                    <span>₹{calculatedSplit.cash.toFixed(0)}</span>
                                                                </div>
                                                                <div className="text-gray-600 font-mono">/</div>
                                                                <div className="flex items-center gap-1.5 text-blue-400">
                                                                    <CreditCard className="w-3 h-3" />
                                                                    <span>₹{calculatedSplit.online.toFixed(0)}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={handleSplitSubmit}
                                                            disabled={!isValidSplit || isSubmittingSplit}
                                                            className={cn(
                                                                "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                                                                isValidSplit && !isSubmittingSplit
                                                                    ? "bg-blue-600 text-yellow-50 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                                                                    : "bg-gray-800 text-yellow-600/50 cursor-not-allowed"
                                                            )}
                                                        >
                                                            {isSubmittingSplit ? (
                                                                <Activity className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                "Confirm Split"
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* SECTION: SUPPLY DEPOT - OPTIMIZED */}
                                    {activeSection === 'supply' && (
                                        <div className="space-y-6">
                                            {/* Category Grid - PREV ITEMS FIRST */}
                                            <div className="grid grid-cols-5 gap-2 pb-4">
                                                {Object.entries(SNACK_INVENTORY).map(([key, category]) => {
                                                    const CatIcon = category.icon;
                                                    return (
                                                        <button
                                                            key={key}
                                                            onClick={() => setActiveCategory(key)}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all duration-300",
                                                                activeCategory === key
                                                                    ? "bg-yellow-600 text-yellow-50 border-yellow-500 shadow-lg shadow-red-600/20"
                                                                    : "bg-yellow-900/20 text-yellow-600/50 border-gray-700 hover:bg-gray-800 hover:text-yellow-50"
                                                            )}
                                                            title={category.label}
                                                        >
                                                            <CatIcon className="w-5 h-5" />
                                                            <span className="text-[10px] font-black uppercase tracking-tighter truncate w-full text-center">
                                                                {category.label}
                                                            </span>
                                                        </button>
                                                    )
                                                })}
                                            </div>

                                            {/* Items List - FULL WIDTH ROWS FOR MOBILE */}
                                            <div className="space-y-3">
                                                {SNACK_INVENTORY[activeCategory]?.items.map((item, idx) => {
                                                    const qty = getSnackQuantity(item.id)
                                                    const CategoryIcon = SNACK_INVENTORY[activeCategory]?.icon || Coffee
                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: idx * 0.03 }}
                                                            className={cn(
                                                                "relative p-4 rounded-2xl border transition-all duration-500 flex items-center justify-between gap-4 overflow-hidden group",
                                                                qty > 0
                                                                    ? "bg-yellow-500/5 border-yellow-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.1)]"
                                                                    : "bg-[#1a0505]/40 border-yellow-900/40/50 hover:border-gray-700"
                                                            )}
                                                        >
                                                            {/* Item Info */}
                                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                <div className={cn(
                                                                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110",
                                                                    qty > 0 ? "bg-yellow-600 text-yellow-50 shadow-lg shadow-red-600/20" : "bg-gray-800 text-yellow-600/70"
                                                                )}>
                                                                    <CategoryIcon className="w-5 h-5" />
                                                                </div>
                                                                <div className="min-w-0 sm:pr-4">
                                                                    <h4 className="text-sm font-black text-gray-100 truncate flex items-center gap-1.5">
                                                                        {item.name}
                                                                        {qty > 4 && <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />}
                                                                    </h4>
                                                                    <div className="text-xs font-mono text-yellow-400 mt-0.5">₹{item.price}</div>
                                                                </div>
                                                            </div>

                                                            {/* Controls */}
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                {qty === 0 ? (
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.92 }}
                                                                        onClick={() => handleEditSnackChange(item.id, 1)}
                                                                        className="h-10 px-6 rounded-xl bg-white text-black font-black text-xs hover:bg-gray-200 transition-all shadow-lg shadow-white/5 active:shadow-none"
                                                                    >
                                                                        ADD
                                                                    </motion.button>
                                                                ) : (
                                                                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/5 shadow-inner">
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => handleEditSnackChange(item.id, -1)}
                                                                            className="h-8 w-8 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-yellow-50 flex items-center justify-center transition-colors"
                                                                        >
                                                                            <Minus className="w-4 h-4" />
                                                                        </motion.button>
                                                                        <span className="w-6 text-center font-black text-yellow-50 text-sm">{qty}</span>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => handleEditSnackChange(item.id, 1)}
                                                                            className="h-8 w-8 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-yellow-50 flex items-center justify-center transition-all shadow-lg shadow-red-600/10"
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                        </motion.button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Floating Action Footer */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-20">
                            <div className="bg-[#1a0505]/90 backdrop-blur-md border border-yellow-900/40 p-4 rounded-3xl shadow-2xl">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <div className="text-xs text-yellow-600/50 font-bold uppercase">Total Estimate</div>
                                        <div className="text-2xl font-black text-yellow-50 tracking-tight">
                                            ₹{calculateEditSubTotal().toFixed(0)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1.5 bg-gray-800 rounded-lg text-xs font-bold text-gray-300 border border-gray-700">
                                            <Clock className="w-3 h-3 inline mr-1 text-yellow-400" />
                                            {editDuration}h
                                        </div>
                                        {totalItems > 0 && (
                                            <div className="px-3 py-1.5 bg-gray-800 rounded-lg text-xs font-bold text-gray-300 border border-gray-700">
                                                <ShoppingCart className="w-3 h-3 inline mr-1 text-yellow-400" />
                                                {totalItems}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={cn("grid gap-3", readOnly ? "grid-cols-1" : "grid-cols-2")}>
                                    <Button
                                        onClick={onClose}
                                        variant="ghost"
                                        className="h-14 rounded-xl text-yellow-600/70 hover:text-yellow-50 font-bold"
                                    >
                                        Close
                                    </Button>
                                    {!readOnly && (
                                        <motion.div whileTap={{ scale: 0.98 }}>
                                            <Button
                                                onClick={handleSubmit}
                                                className="h-14 w-full bg-yellow-600 hover:bg-yellow-500 text-yellow-50 rounded-none font-black text-base shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all relative overflow-hidden group"
                                                style={{ borderRadius: "12px" }}
                                            >
                                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:200%_0,0_0] bg-no-repeat transition-all duration-700 ease-out group-hover:bg-[position:-200%_0,0_0]"></div>
                                                <span className="relative z-10">Update Session</span>
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Success Overlay */}
                        <AnimatePresence>
                            {isSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center"
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 0.6, ease: "easeInOut" }}
                                        className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.5)]"
                                    >
                                        <Check className="w-10 h-10 text-yellow-50" />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-yellow-50 mb-1">Saved!</h2>
                                    <p className="text-yellow-600/70">Total: ₹{calculateEditSubTotal().toFixed(0)}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}