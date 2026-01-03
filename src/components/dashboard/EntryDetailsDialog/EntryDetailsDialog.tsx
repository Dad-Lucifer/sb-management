import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, User, Phone, Clock, Plus, Minus, ShoppingCart,
    Crown, Check, Coffee, CreditCard, Banknote
} from 'lucide-react'
import { CustomerEntry, SnackOrder } from '@/types/dashboard'
import { SNACK_INVENTORY, ALL_SNACKS_MAP, PER_PERSON_RATE } from '@/constants/inventory'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface EntryDetailsDialogProps {
    entry: CustomerEntry | null
    isOpen: boolean
    onClose: () => void
    onSave: (duration: number, numberOfPeople: number, snacks: SnackOrder[]) => void
    readOnly?: boolean
}

export function EntryDetailsDialog({
    entry,
    isOpen,
    onClose,
    onSave,
    readOnly = false
}: EntryDetailsDialogProps) {
    const [editDuration, setEditDuration] = useState('')
    const [editNumberOfPeople, setEditNumberOfPeople] = useState('1')
    const [editSnacks, setEditSnacks] = useState<SnackOrder[]>([])
    const [isSuccess, setIsSuccess] = useState(false)
    const [activeCategory, setActiveCategory] = useState<string>(Object.keys(SNACK_INVENTORY)[0] || '')
    const [activeSection, setActiveSection] = useState<'session' | 'supply'>('session')

    useEffect(() => {
        if (entry) {
            setEditDuration(entry.duration.toString())
            setEditNumberOfPeople((entry.numberOfPeople || 1).toString())
            setEditSnacks(entry.snacks || [])
            setIsSuccess(false)
        }
    }, [entry])

    if (!entry) return null

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
        return (durationNum * peopleNum * PER_PERSON_RATE) + snacksPrice
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
                            "relative w-full flex flex-col shadow-2xl overflow-hidden bg-[#0a0a0a] border-t sm:border sm:border-gray-800",
                            "h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:w-[600px] sm:max-w-2xl sm:my-4"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-32 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-2/3 h-32 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />

                        {/* Header Section */}
                        <div className="relative z-10 shrink-0 pt-6 pb-4 px-6 bg-gradient-to-b from-white/5 to-transparent">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4">
                                    {/* Avatar */}
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-[2px] shadow-lg shadow-blue-500/20">
                                        <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center">
                                            <span className="text-2xl font-black text-white">{entry.customerName.charAt(0)}</span>
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                        <h2 className="text-xl font-bold text-white leading-tight flex items-center gap-2">
                                            {entry.customerName}
                                            {entry.isRenewed && <Crown className="w-4 h-4 text-yellow-400" />}
                                        </h2>
                                        <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            {entry.phoneNumber}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {entry.age && entry.age > 0 && (
                                                <div className="text-xs font-medium text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700 flex items-center gap-1.5">
                                                    <User className="w-3 h-3 text-blue-400" />
                                                    {entry.age}
                                                </div>
                                            )}
                                            {entry.paymentMode && (
                                                <div className={cn(
                                                    "text-xs font-bold uppercase px-2 py-0.5 rounded border flex items-center gap-1.5",
                                                    entry.paymentMode === 'online'
                                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                                        : "bg-green-500/10 text-green-400 border-green-500/30"
                                                )}>
                                                    {entry.paymentMode === 'online' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                                                    {entry.paymentMode}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Custom Segmented Control Tabs */}
                            <div className="relative bg-gray-900/80 p-1.5 rounded-xl border border-gray-800 flex">
                                <div
                                    className={cn(
                                        "absolute top-1.5 left-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gray-800 rounded-lg shadow-sm transition-transform duration-300",
                                        activeSection === 'session' ? "translate-x-0" : "translate-x-full"
                                    )}
                                />
                                <button
                                    onClick={() => setActiveSection('session')}
                                    className={cn("flex-1 relative z-10 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2", activeSection === 'session' ? "text-white" : "text-gray-500")}
                                >
                                    <Clock className="w-4 h-4" />
                                    Session
                                </button>
                                <button
                                    onClick={() => setActiveSection('supply')}
                                    className={cn("flex-1 relative z-10 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2", activeSection === 'supply' ? "text-white" : "text-gray-500")}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                    Supply
                                    {totalItems > 0 && <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />}
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 min-h-0 relative overflow-hidden bg-gradient-to-b from-transparent to-black">
                            <ScrollArea className="h-full">
                                <div className="p-6 pb-32">

                                    {/* SECTION: SESSION PARAMETERS */}
                                    {activeSection === 'session' && (
                                        <div className="space-y-6">
                                            {/* Time Card */}
                                            <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Duration (Hours)</label>
                                                <div className="flex items-center gap-3">
                                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditDuration(Math.max(0.5, parseFloat(editDuration) - 0.5).toString())} className="h-12 w-12 rounded-xl bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 flex items-center justify-center">
                                                        <Minus className="w-5 h-5" />
                                                    </motion.button>
                                                    <div className="flex-1 h-14 bg-black/50 rounded-xl border border-gray-800 flex items-center justify-center">
                                                        <Input type="number" step="0.5" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="w-full h-full bg-transparent border-none text-center text-2xl font-black text-white focus:ring-0" />
                                                    </div>
                                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditDuration((parseFloat(editDuration) + 0.5).toString())} className="h-12 w-12 rounded-xl bg-blue-600 border border-blue-500 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 flex items-center justify-center">
                                                        <Plus className="w-5 h-5" />
                                                    </motion.button>
                                                </div>
                                            </div>

                                            {/* People Card */}
                                            <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Party Size</label>
                                                <div className="h-14 bg-black/50 rounded-xl border border-gray-800 flex items-center justify-center px-4">
                                                    <User className="w-5 h-5 text-gray-500 mr-3" />
                                                    <span className="text-xl font-bold text-white">{editNumberOfPeople} People</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SECTION: SUPPLY DEPOT - OPTIMIZED */}
                                    {activeSection === 'supply' && (
                                        <div className="space-y-6">
                                            {/* Category Scroll */}
                                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
                                                {Object.entries(SNACK_INVENTORY).map(([key, category]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setActiveCategory(key)}
                                                        className={cn(
                                                            "flex-none px-5 py-2.5 rounded-full text-sm font-bold border transition-all snap-center",
                                                            activeCategory === key
                                                                ? "bg-white text-black border-white shadow-lg shadow-white/10"
                                                                : "bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700 hover:text-white"
                                                        )}
                                                    >
                                                        {category.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Items List - FULL WIDTH ROWS FOR MOBILE */}
                                            <div className="space-y-3">
                                                {SNACK_INVENTORY[activeCategory]?.items.map((item, idx) => {
                                                    const qty = getSnackQuantity(item.id)
                                                    return (
                                                        <motion.div
                                                            key={item.id}
                                                            layout
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            className={cn(
                                                                "relative p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4",
                                                                qty > 0
                                                                    ? "bg-blue-500/10 border-blue-500/30"
                                                                    : "bg-gray-800/40 border-gray-700/50"
                                                            )}
                                                        >
                                                            {/* Item Info */}
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <div className={cn(
                                                                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                                                    qty > 0 ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-400"
                                                                )}>
                                                                    <Coffee className="w-5 h-5" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                                                                    <div className="text-xs text-gray-400">₹{item.price}</div>
                                                                </div>
                                                            </div>

                                                            {/* Controls */}
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                {qty === 0 ? (
                                                                    // Initial Add Button (Big)
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.95 }}
                                                                        onClick={() => handleEditSnackChange(item.id, 1)}
                                                                        className="h-10 px-4 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 shadow-lg shadow-white/10"
                                                                    >
                                                                        Add
                                                                    </motion.button>
                                                                ) : (
                                                                    // Edit Controls
                                                                    <div className="flex items-center gap-2">
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => handleEditSnackChange(item.id, -1)}
                                                                            className="h-9 w-9 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 flex items-center justify-center"
                                                                        >
                                                                            <Minus className="w-4 h-4" />
                                                                        </motion.button>
                                                                        <span className="w-6 text-center font-black text-white">{qty}</span>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => handleEditSnackChange(item.id, 1)}
                                                                            className="h-9 w-9 rounded-lg bg-blue-600 border border-blue-500 text-white hover:bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-600/20"
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
                            <div className="bg-gray-900/90 backdrop-blur-md border border-gray-800 p-4 rounded-3xl shadow-2xl">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <div className="text-xs text-gray-500 font-bold uppercase">Total Estimate</div>
                                        <div className="text-2xl font-black text-white tracking-tight">
                                            ₹{calculateEditSubTotal().toFixed(0)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1.5 bg-gray-800 rounded-lg text-xs font-bold text-gray-300 border border-gray-700">
                                            <Clock className="w-3 h-3 inline mr-1 text-blue-400" />
                                            {editDuration}h
                                        </div>
                                        {totalItems > 0 && (
                                            <div className="px-3 py-1.5 bg-gray-800 rounded-lg text-xs font-bold text-gray-300 border border-gray-700">
                                                <ShoppingCart className="w-3 h-3 inline mr-1 text-purple-400" />
                                                {totalItems}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={cn("grid gap-3", readOnly ? "grid-cols-1" : "grid-cols-2")}>
                                    <Button
                                        onClick={onClose}
                                        variant="ghost"
                                        className="h-14 rounded-xl text-gray-400 hover:text-white font-bold"
                                    >
                                        Close
                                    </Button>
                                    {!readOnly && (
                                        <motion.div whileTap={{ scale: 0.98 }}>
                                            <Button
                                                onClick={handleSubmit}
                                                className="h-14 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-base shadow-xl shadow-blue-900/20 border border-blue-500/50"
                                            >
                                                Update Session
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
                                        <Check className="w-10 h-10 text-white" />
                                    </motion.div>
                                    <h2 className="text-2xl font-bold text-white mb-1">Saved!</h2>
                                    <p className="text-gray-400">Total: ₹{calculateEditSubTotal().toFixed(0)}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}