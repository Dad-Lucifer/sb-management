import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, User, Phone, Clock, Plus, Minus, ShoppingCart,
    Timer, Zap, Sparkles, TrendingUp, Award, Star,
    Crown, Flame, Check
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
}


export function EntryDetailsDialog({
    entry,
    isOpen,
    onClose,
    onSave
}: EntryDetailsDialogProps) {
    const [editDuration, setEditDuration] = useState('')
    const [editNumberOfPeople, setEditNumberOfPeople] = useState('1')
    const [editSnacks, setEditSnacks] = useState<SnackOrder[]>([])
    const [hoveredItem, setHoveredItem] = useState<string | null>(null)
    const [justAdded, setJustAdded] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [activeCategory, setActiveCategory] = useState<string>(Object.keys(SNACK_INVENTORY)[0] || '')
    const [activeSection, setActiveSection] = useState<'parameters' | 'supply'>('parameters')

    // Update local state when entry changes
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

        // Show added animation
        if (delta > 0) {
            setJustAdded(itemId)
            setTimeout(() => setJustAdded(null), 600)
        }

        setEditSnacks(prev => {
            const existingIndex = prev.findIndex(s => s.id === itemId)
            if (existingIndex >= 0) {
                const newQty = prev[existingIndex].quantity + delta
                if (newQty <= 0) {
                    return prev.filter((_, i) => i !== existingIndex)
                }
                const updated = [...prev]
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: newQty,
                    totalPrice: newQty * updated[existingIndex].unitPrice
                }
                return updated
            } else {
                if (delta <= 0) return prev
                return [...prev, {
                    id: itemId,
                    name: itemDef.name,
                    category: 'manual',
                    quantity: delta,
                    unitPrice: itemDef.price,
                    totalPrice: itemDef.price * delta
                }]
            }
        })
    }

    const getSnackQuantity = (itemId: string) => {
        const snack = editSnacks.find(s => s.id === itemId)
        return snack ? snack.quantity : 0
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

        if (!newDuration || newDuration <= 0) {
            return
        }

        setIsSuccess(true)
        // Wait for animation to play
        await new Promise(resolve => setTimeout(resolve, 1500))
        onSave(newDuration, newPeople, editSnacks)
    }

    const handleCancel = () => {
        // Reset to original values
        setEditDuration(entry.duration.toString())
        setEditNumberOfPeople((entry.numberOfPeople || 1).toString())
        setEditSnacks(entry.snacks || [])
        onClose()
    }

    const isTimeExtended = parseFloat(editDuration) > entry.duration
    const totalItems = editSnacks.reduce((sum, s) => sum + s.quantity, 0)
    const totalSnacksCost = editSnacks.reduce((sum, s) => sum + s.totalPrice, 0)

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Animated Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    >
                        {/* Animated Background Orbs */}
                        <motion.div
                            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl"
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.5, 0.3, 0.5],
                            }}
                            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                        />
                    </motion.div>

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="relative w-full max-w-5xl max-h-[95vh] bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Glassmorphism Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-yellow-500/5 pointer-events-none" />

                        {/* Animated Grid Pattern */}
                        <div className="absolute inset-0 opacity-[0.02]" style={{
                            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
                            backgroundSize: '50px 50px'
                        }} />

                        <AnimatePresence mode="wait">
                            {isSuccess ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    className="h-[500px] flex flex-col items-center justify-center relative overflow-hidden"
                                >
                                    {/* Success Particles */}
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute"
                                            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                            animate={{
                                                opacity: [0, 1, 0],
                                                scale: [0, 1.5, 2],
                                                x: Math.cos(i * 60 * (Math.PI / 180)) * 150,
                                                y: Math.sin(i * 60 * (Math.PI / 180)) * 150,
                                            }}
                                            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                                        >
                                            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                                        </motion.div>
                                    ))}

                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-green-500/50"
                                    >
                                        <Check className="w-16 h-16 text-white stroke-[3]" />
                                    </motion.div>
                                    <motion.h2
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-4xl font-black text-white mb-2"
                                    >
                                        Session Updated!
                                    </motion.h2>
                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-gray-400 text-lg mb-6"
                                    >
                                        Everything is looking good.
                                    </motion.p>

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5, type: "spring" }}
                                        className="bg-gray-800/50 px-8 py-3 rounded-2xl border border-gray-700/50 backdrop-blur-md flex items-center gap-4 shadow-xl"
                                    >
                                        <span className="text-gray-400 font-medium uppercase text-xs tracking-wider">New Total</span>
                                        <span className="text-2xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                                            ₹{calculateEditSubTotal().toFixed(0)}
                                        </span>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, filter: 'blur(10px)' }}
                                    className="flex flex-col h-full"
                                >
                                    {/* Header */}
                                    <div className="relative z-10 border-b border-gray-800/50 bg-black/60 backdrop-blur-xl p-6">

                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-5">
                                                {/* Animated Avatar */}
                                                <motion.div
                                                    className="relative"
                                                    whileHover={{ scale: 1.05 }}
                                                    transition={{ type: "spring", stiffness: 400 }}
                                                >
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30 relative overflow-hidden">
                                                        {entry.customerName.charAt(0).toUpperCase()}
                                                        {/* Shine effect */}
                                                        <motion.div
                                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                                            animate={{ x: ['-100%', '100%'] }}
                                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                                        />
                                                    </div>
                                                    {/* Pulsing ring */}
                                                    <motion.div
                                                        className="absolute inset-0 rounded-2xl border-2 border-blue-400"
                                                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    />
                                                </motion.div>

                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                                                            Session Control
                                                        </h2>
                                                        {entry.isRenewed && (
                                                            <motion.span
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="flex items-center gap-1 text-xs bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-3 py-1 rounded-full font-bold shadow-lg shadow-yellow-500/30"
                                                            >
                                                                <Crown className="w-3 h-3" />
                                                                RENEWED
                                                            </motion.span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-400 text-sm flex items-center gap-2">
                                                        <Sparkles className="w-4 h-4 text-blue-400" />
                                                        Customize session parameters and order supplies
                                                    </p>
                                                </div>
                                            </div>

                                            <motion.button
                                                onClick={onClose}
                                                whileHover={{ scale: 1.1, rotate: 90 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="p-2.5 hover:bg-gray-800/80 rounded-xl transition-all text-gray-400 hover:text-white border border-transparent hover:border-gray-700"
                                            >
                                                <X className="w-5 h-5" />
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <ScrollArea className="relative z-10 h-[calc(95vh-280px)] p-6">
                                        <div className="space-y-5">
                                            {/* Customer Information */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 overflow-hidden"
                                            >
                                                {/* Hover glow effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                <div className="relative z-10">
                                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                        <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                                            <User className="w-4 h-4 text-blue-400" />
                                                        </div>
                                                        Customer Profile
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-xs text-gray-500 uppercase tracking-wide">Full Name</label>
                                                            <div className="text-white font-semibold text-xl flex items-center gap-2">
                                                                {entry.customerName}
                                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                                                                <Phone className="w-3 h-3" />
                                                                Contact Number
                                                            </label>
                                                            <div className="text-white font-semibold text-xl font-mono tracking-wide">
                                                                {entry.phoneNumber}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Toggle Switch */}
                                            <div className="flex p-1 bg-gray-900/50 rounded-xl border border-gray-800/50 backdrop-blur-sm mb-4">
                                                <button
                                                    onClick={() => setActiveSection('parameters')}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 relative overflow-hidden",
                                                        activeSection === 'parameters'
                                                            ? "text-yellow-400 shadow-lg shadow-yellow-500/10 bg-gray-800 border border-gray-700"
                                                            : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
                                                    )}
                                                >
                                                    <Clock className={cn("w-4 h-4", activeSection === 'parameters' ? "text-yellow-400" : "text-gray-500")} />
                                                    Session Parameters
                                                    {isTimeExtended && (
                                                        <div className="ml-2 w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setActiveSection('supply')}
                                                    className={cn(
                                                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 relative overflow-hidden",
                                                        activeSection === 'supply'
                                                            ? "text-purple-400 shadow-lg shadow-purple-500/10 bg-gray-800 border border-gray-700"
                                                            : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
                                                    )}
                                                >
                                                    <ShoppingCart className={cn("w-4 h-4", activeSection === 'supply' ? "text-purple-400" : "text-gray-500")} />
                                                    Supply Depot
                                                    {totalItems > 0 && (
                                                        <div className="ml-2 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-purple-500/20 text-purple-400 text-[9px] border border-purple-500/30">
                                                            {totalItems}
                                                        </div>
                                                    )}
                                                </button>
                                            </div>

                                            <div className="min-h-[400px]">
                                                <AnimatePresence mode="wait">
                                                    {activeSection === 'parameters' ? (
                                                        /* Session Configuration */
                                                        <motion.div
                                                            key="parameters"
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: 20 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-6 border border-gray-700/50 hover:border-yellow-500/30 transition-all duration-300 overflow-hidden h-full"
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                            <div className="relative z-10">
                                                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                                                                    <div className="p-1.5 bg-yellow-500/20 rounded-lg">
                                                                        <Clock className="w-4 h-4 text-yellow-400" />
                                                                    </div>
                                                                    Session Parameters
                                                                    {isTimeExtended && (
                                                                        <motion.span
                                                                            initial={{ scale: 0, rotate: -180 }}
                                                                            animate={{ scale: 1, rotate: 0 }}
                                                                            className="ml-auto flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg border border-yellow-500/30"
                                                                        >
                                                                            <TrendingUp className="w-3 h-3" />
                                                                            Time Extended!
                                                                        </motion.span>
                                                                    )}
                                                                </h3>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    {/* Duration */}
                                                                    <div className="space-y-3">
                                                                        <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                                                            <Timer className="w-3.5 h-3.5 text-blue-400" />
                                                                            Duration (Hours)
                                                                        </label>
                                                                        <div className="relative">
                                                                            <Input
                                                                                type="number"
                                                                                step="0.5"
                                                                                min="0.5"
                                                                                value={editDuration}
                                                                                onChange={(e) => setEditDuration(e.target.value)}
                                                                                className={cn(
                                                                                    "bg-gray-900/80 border-2 text-white text-2xl font-bold h-14 text-center transition-all duration-300",
                                                                                    isTimeExtended
                                                                                        ? "border-yellow-500/50 ring-4 ring-yellow-500/20 shadow-lg shadow-yellow-500/20"
                                                                                        : "border-gray-700 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/20"
                                                                                )}
                                                                            />
                                                                            {isTimeExtended && (
                                                                                <motion.div
                                                                                    initial={{ scale: 0 }}
                                                                                    animate={{ scale: 1 }}
                                                                                    className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1"
                                                                                >
                                                                                    <Flame className="w-3 h-3" />
                                                                                    BOOST
                                                                                </motion.div>
                                                                            )}
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => setEditDuration((parseFloat(editDuration) + 0.5).toString())}
                                                                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-0 shadow-lg shadow-blue-500/20 font-semibold"
                                                                                >
                                                                                    <Plus className="w-4 h-4 mr-1" />
                                                                                    +30 min
                                                                                </Button>
                                                                            </motion.div>
                                                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => setEditDuration(Math.max(0.5, parseFloat(editDuration) - 0.5).toString())}
                                                                                    className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-semibold"
                                                                                >
                                                                                    <Minus className="w-4 h-4 mr-1" />
                                                                                    -30 min
                                                                                </Button>
                                                                            </motion.div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Number of People */}
                                                                    <div className="space-y-3">
                                                                        <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                                                            <User className="w-3.5 h-3.5 text-purple-400" />
                                                                            Party Size
                                                                        </label>
                                                                        <Input
                                                                            type="number"
                                                                            value={editNumberOfPeople}
                                                                            readOnly
                                                                            className="bg-gray-900/80 border-2 border-gray-700 text-gray-400 text-2xl font-bold h-14 text-center cursor-not-allowed focus:ring-0"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        /* Snacks Section */
                                                        <motion.div
                                                            key="supply"
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -20 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 overflow-hidden h-full"
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                            <div className="relative z-10">
                                                                <div className="flex items-center justify-between mb-5">
                                                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                                        <div className="p-1.5 bg-purple-500/20 rounded-lg">
                                                                            <ShoppingCart className="w-4 h-4 text-purple-400" />
                                                                        </div>
                                                                        Supply Depot
                                                                    </h3>
                                                                    {totalItems > 0 && (
                                                                        <motion.div
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            className="flex items-center gap-3"
                                                                        >
                                                                            <div className="flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-xl border border-purple-500/30">
                                                                                <Award className="w-4 h-4" />
                                                                                <span className="font-bold">{totalItems}</span>
                                                                                <span className="text-xs">items</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 bg-green-500/20 text-green-300 px-3 py-1.5 rounded-xl border border-green-500/30">
                                                                                <span className="text-xs">₹</span>
                                                                                <span className="font-bold">{totalSnacksCost}</span>
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </div>

                                                                <div className="space-y-6">
                                                                    {/* Category Toggles */}
                                                                    <div className="flex p-1.5 bg-gray-900/80 rounded-xl border border-gray-800 backdrop-blur-sm overflow-x-auto no-scrollbar gap-1">
                                                                        {Object.entries(SNACK_INVENTORY).map(([key, category]) => {
                                                                            const Icon = category.icon
                                                                            const isActive = activeCategory === key
                                                                            const categoryCount = category.items.reduce((acc, item) => acc + getSnackQuantity(item.id), 0)

                                                                            return (
                                                                                <button
                                                                                    key={key}
                                                                                    onClick={() => setActiveCategory(key)}
                                                                                    className={cn(
                                                                                        "flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap relative overflow-visible",
                                                                                        isActive
                                                                                            ? "text-white shadow-lg shadow-purple-500/25"
                                                                                            : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                                                                                    )}
                                                                                >
                                                                                    {isActive && (
                                                                                        <motion.div
                                                                                            layoutId="activeCategory"
                                                                                            className="absolute inset-0 bg-purple-600 rounded-lg"
                                                                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                                                        />
                                                                                    )}
                                                                                    <span className="relative z-10 flex items-center gap-2">
                                                                                        <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-gray-400")} />
                                                                                        {category.label}
                                                                                        {categoryCount > 0 && (
                                                                                            <span className={cn(
                                                                                                "ml-1 text-[10px] px-1.5 py-0.5 rounded-full border",
                                                                                                isActive
                                                                                                    ? "bg-white/20 text-white border-white/20"
                                                                                                    : "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                                                                            )}>
                                                                                                {categoryCount}
                                                                                            </span>
                                                                                        )}
                                                                                    </span>
                                                                                </button>
                                                                            )
                                                                        })}
                                                                    </div>

                                                                    {/* Active Grid */}
                                                                    <div className="min-h-[300px]">
                                                                        <AnimatePresence mode="wait">
                                                                            {activeCategory && SNACK_INVENTORY[activeCategory] && (
                                                                                <motion.div
                                                                                    key={activeCategory}
                                                                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                                                                    transition={{ duration: 0.2 }}
                                                                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                                                                                >
                                                                                    {SNACK_INVENTORY[activeCategory].items.map((item, itemIndex) => {
                                                                                        const quantity = getSnackQuantity(item.id)
                                                                                        const isHovered = hoveredItem === item.id
                                                                                        const wasJustAdded = justAdded === item.id

                                                                                        return (
                                                                                            <motion.div
                                                                                                key={item.id}
                                                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                                                animate={{ opacity: 1, scale: 1 }}
                                                                                                transition={{ delay: itemIndex * 0.03 }}
                                                                                                onHoverStart={() => setHoveredItem(item.id)}
                                                                                                onHoverEnd={() => setHoveredItem(null)}
                                                                                                className={cn(
                                                                                                    "relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer group/item overflow-hidden",
                                                                                                    quantity > 0
                                                                                                        ? "bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/40 shadow-lg shadow-purple-500/10"
                                                                                                        : "bg-gray-900/60 border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/60"
                                                                                                )}
                                                                                            >
                                                                                                {/* Shine effect on hover */}
                                                                                                {isHovered && (
                                                                                                    <motion.div
                                                                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                                                                                        animate={{ x: ['-100%', '100%'] }}
                                                                                                        transition={{ duration: 0.6 }}
                                                                                                    />
                                                                                                )}

                                                                                                {/* Added animation */}
                                                                                                {wasJustAdded && (
                                                                                                    <motion.div
                                                                                                        initial={{ scale: 0, opacity: 1 }}
                                                                                                        animate={{ scale: 2, opacity: 0 }}
                                                                                                        className="absolute inset-0 bg-purple-500/30 rounded-xl"
                                                                                                    />
                                                                                                )}

                                                                                                <div className="flex-1 min-w-0 relative z-10">
                                                                                                    <div className="text-sm font-semibold text-white flex items-center gap-2 leading-tight">
                                                                                                        {item.name}
                                                                                                        {quantity > 0 && (
                                                                                                            <motion.div
                                                                                                                initial={{ scale: 0 }}
                                                                                                                animate={{ scale: 1 }}
                                                                                                                className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                                                                                                            />
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <div className="text-xs text-gray-400 font-semibold mt-0.5">
                                                                                                        ₹{item.price}
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="flex items-center gap-2 ml-3 relative z-10">
                                                                                                    <motion.button
                                                                                                        whileHover={{ scale: 1.1 }}
                                                                                                        whileTap={{ scale: 0.9 }}
                                                                                                        onClick={() => handleEditSnackChange(item.id, -1)}
                                                                                                        disabled={quantity === 0}
                                                                                                        className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md"
                                                                                                    >
                                                                                                        <Minus className="w-3.5 h-3.5" />
                                                                                                    </motion.button>

                                                                                                    <motion.span
                                                                                                        key={quantity}
                                                                                                        initial={{ scale: 1.5, color: '#a855f7' }}
                                                                                                        animate={{ scale: 1, color: '#ffffff' }}
                                                                                                        className="w-8 text-center font-black text-lg"
                                                                                                    >
                                                                                                        {quantity}
                                                                                                    </motion.span>

                                                                                                    <motion.button
                                                                                                        whileHover={{ scale: 1.1 }}
                                                                                                        whileTap={{ scale: 0.9 }}
                                                                                                        onClick={() => handleEditSnackChange(item.id, 1)}
                                                                                                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 border border-purple-500 flex items-center justify-center text-white hover:from-purple-500 hover:to-purple-600 transition-all shadow-lg shadow-purple-500/30"
                                                                                                    >
                                                                                                        <Plus className="w-3.5 h-3.5" />
                                                                                                    </motion.button>
                                                                                                </div>
                                                                                            </motion.div>
                                                                                        )
                                                                                    })}
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </ScrollArea>

                                    {/* Footer */}
                                    <div className="relative z-10 border-t border-gray-800/50 bg-black/80 backdrop-blur-xl p-6">
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                                                        <Zap className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <span className="font-semibold">Base Rate: ₹{PER_PERSON_RATE}/hr/person</span>
                                                </div>
                                                <div className="text-xs text-gray-600 flex items-center gap-2 ml-8">
                                                    <span className="font-mono">{editDuration}h × {editNumberOfPeople} {parseInt(editNumberOfPeople) > 1 ? 'people' : 'person'}</span>
                                                    {totalItems > 0 && (
                                                        <>
                                                            <span className="text-gray-700">+</span>
                                                            <span className="font-mono">{totalItems} items</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-end gap-2">
                                                    <Award className="w-3.5 h-3.5 text-yellow-500" />
                                                    Total Amount
                                                </div>
                                                <motion.div
                                                    key={calculateEditSubTotal()}
                                                    initial={{ scale: 1.2, color: '#3b82f6' }}
                                                    animate={{ scale: 1, color: '#ffffff' }}
                                                    className="text-4xl font-black flex items-baseline justify-end"
                                                >
                                                    <span className="text-xl text-gray-500 mr-1">₹</span>
                                                    {calculateEditSubTotal().toFixed(0)}
                                                </motion.div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button
                                                    onClick={handleCancel}
                                                    className="w-full h-14 bg-gray-800/80 hover:bg-gray-700 border-2 border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-bold text-base shadow-lg"
                                                >
                                                    <X className="w-5 h-5 mr-2" />
                                                    Cancel
                                                </Button>
                                            </motion.div>
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button
                                                    onClick={handleSubmit}
                                                    className="w-full h-14 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-blue-500/30 border-0 relative overflow-hidden group"
                                                >
                                                    {/* Animated shine */}
                                                    <motion.div
                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                                        animate={{ x: ['-100%', '100%'] }}
                                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                                    />
                                                    <Check className="w-5 h-5 mr-2 relative z-10" />
                                                    <span className="relative z-10">Save Changes</span>
                                                </Button>
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

