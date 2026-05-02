import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Clock, Coffee, Sparkles, Zap, Trophy, Gamepad2, ChevronDown, ChevronRight, Plus, Minus, CreditCard, Banknote, X, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'



import { SNACK_INVENTORY, ALL_SNACKS_MAP, calculateSessionPriceWithTime, isHappyHour, getHappyHourRate } from '@/constants/inventory'

export interface EntryFormProps {
    customerName: string;
    setCustomerName: (val: string) => void;
    phoneNumber: string;
    setPhoneNumber: (val: string) => void;
    numberOfPeople: string;
    setNumberOfPeople: (val: string) => void;
    duration: string;
    setDuration: (val: string) => void;
    selectedSnacks: Record<string, number>;
    handleSnackChange: (id: string, delta: number) => void;
    handleProceed: () => void;
    isAnimating: boolean;
    focusedField: string | null;
    setFocusedField: (val: string | null) => void;
    calculateSubTotal: () => number;
    age: string;
    setAge: (val: string) => void;
    paymentMode: 'online' | 'offline';
    setPaymentMode: (val: 'online' | 'offline') => void;
}

export function EntryForm({
    customerName,
    setCustomerName,
    phoneNumber,
    setPhoneNumber,
    numberOfPeople,
    setNumberOfPeople,
    duration,
    setDuration,
    selectedSnacks,
    handleSnackChange,
    handleProceed,
    isAnimating,
    focusedField,
    setFocusedField,
    calculateSubTotal,
    age,
    setAge,
    paymentMode,
    setPaymentMode
}: EntryFormProps) {
    const [showMenuModal, setShowMenuModal] = useState(false)
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

    // Happy-hour detection uses the current wall-clock time (the moment the form is rendered)
    const now = new Date()
    const happyHour = isHappyHour(now)
    const people = parseInt(numberOfPeople) || 1
    const happyHourRate = getHappyHourRate(people)
    const happyHourWindow = now.getHours() >= 10 && now.getHours() < 13 ? '10AM–1PM' : '8PM–11PM'


    return (
        <div className="space-y-6">


            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-red-600/10 rounded-lg">
                        <Gamepad2 className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h2 className="text-xl font-light text-white">New Player Entry</h2>
                </div>
                <p className="text-gray-500 text-sm">Initialize a new gaming session</p>
            </div>

            {/* Happy Hour Banner */}
            {happyHour && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="relative overflow-hidden rounded-xl border border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 p-3 flex items-center gap-3"
                >
                    {/* Animated shimmer */}
                    <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-yellow-300/10 to-transparent pointer-events-none"
                    />
                    <div className="p-2 bg-yellow-500/20 rounded-lg shrink-0">
                        <Star className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-yellow-400 font-black text-sm tracking-wide">🎉 Happy Hour Active!</p>
                        <p className="text-yellow-300/70 text-xs mt-0.5">
                            {happyHourWindow} · ₹{happyHourRate}/hr per person
                            {people > 1 && <span className="ml-1 text-yellow-400 font-bold">(group deal)</span>}
                        </p>
                    </div>
                    <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-yellow-400 font-black text-lg shrink-0"
                    >
                        ⚡
                    </motion.div>
                </motion.div>
            )}

            <div id="entry-form" className="space-y-5 relative">
                {/* VIP Vault Progress Bar */}
                <div className="absolute -top-5 left-0 w-full h-1.5 bg-[#2A0800] border border-yellow-900/50 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#FFF2CD] relative"
                        initial={{ width: "0%" }}
                        animate={{
                            width: `${((customerName ? 10 : 0) + (phoneNumber ? 10 : 0) + (numberOfPeople ? 10 : 0) + (duration ? 10 : 0) + (age ? 10 : 0) + (Object.keys(selectedSnacks).length > 0 ? 20 : 0) + 20)}%`
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Shimmer effect for progress bar */}
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-[200%] animate-[shimmer_2s_infinite]" />
                    </motion.div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-[11px] font-bold tracking-wider text-yellow-600/80 uppercase flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-yellow-500" />
                        Player Name
                    </Label>
                    <div className="relative group">
                        <Input
                            id="customerName"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            onFocus={() => setFocusedField('customerName')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Enter player alias"
                            className={`h-12 bg-[#2A0800]/50 border border-yellow-900/40 text-yellow-50 placeholder-yellow-800/50 rounded-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] pl-10 transition-all duration-300 ${focusedField === 'customerName' ? 'border-yellow-500 shadow-[0_0_15px_rgba(255,215,0,0.2)]' : 'group-hover:border-gray-700'
                                } focus:border-yellow-500 focus:ring-0`}
                        />
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'customerName' ? 'text-yellow-500' : 'text-gray-600'}`}>
                            <User className="w-4 h-4" />
                        </div>
                        {customerName && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500"
                            >
                                <Sparkles className="w-4 h-4" />
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-[11px] font-bold tracking-wider text-yellow-600/80 uppercase flex items-center gap-2 mb-1">
                            <Phone className="w-4 h-4 text-yellow-500" />
                            Contact Link
                        </Label>
                        <div className="relative group">
                            <Input
                                id="phoneNumber"
                                value={phoneNumber}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setPhoneNumber(value);
                                }}
                                type="tel"
                                onFocus={() => setFocusedField('phoneNumber')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Enter contact number"
                                className={`h-12 bg-[#2A0800]/50 border border-yellow-900/40 text-yellow-50 placeholder-yellow-800/50 rounded-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] pl-20 transition-all duration-300 ${focusedField === 'phoneNumber' ? 'border-yellow-500 shadow-[0_0_15px_rgba(255,215,0,0.2)]' : 'group-hover:border-gray-700'
                                    } focus:border-yellow-500 focus:ring-0`}
                            />
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'phoneNumber' ? 'text-yellow-500' : 'text-gray-600'}`}>
                                <Phone className="w-4 h-4" />
                            </div>
                            <div className={`absolute left-9 top-1/2 -translate-y-1/2 font-medium transition-colors duration-300 ${focusedField === 'phoneNumber' ? 'text-yellow-500' : 'text-gray-500'}`}>
                                +91
                            </div>
                        </div>
                    </div>
                </div>



                <div className="space-y-2">
                    <Label htmlFor="numberOfPeople" className="text-[11px] font-bold tracking-wider text-yellow-600/80 uppercase flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-yellow-500" />
                        Number of People
                    </Label>

                    <div className="relative group">
                        <Input
                            id="numberOfPeople"
                            type="number"
                            min="1"
                            value={numberOfPeople}
                            onChange={(e) => setNumberOfPeople(e.target.value)}
                            onFocus={() => setFocusedField('numberOfPeople')}
                            onBlur={() => setFocusedField(null)}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            placeholder="Enter number of people"
                            className={`h-12 bg-[#2A0800]/50 border border-yellow-900/40 text-yellow-50 placeholder-yellow-800/50 rounded-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] pl-10 transition-all duration-300 ${focusedField === 'numberOfPeople' ? 'border-yellow-500 shadow-[0_0_15px_rgba(255,215,0,0.2)]' : 'group-hover:border-gray-700'
                                } focus:border-yellow-500 focus:ring-0`}
                        />
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'numberOfPeople' ? 'text-yellow-500' : 'text-gray-600'}`}>
                            <User className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* AGE & PAYMENT */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="age" className="text-[11px] font-bold tracking-wider text-yellow-600/80 uppercase flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Age
                    </Label>
                    <div className="relative group">
                        <Input
                            id="age"
                            type="number"
                            min="1"
                            max="100"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            onFocus={() => setFocusedField('age')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Age"
                            className={`h-12 bg-[#2A0800]/50 border border-yellow-900/40 text-yellow-50 placeholder-yellow-800/50 rounded-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] pl-10 transition-all duration-300 ${focusedField === 'age' ? 'border-yellow-500 shadow-[0_0_15px_rgba(255,215,0,0.2)]' : 'group-hover:border-gray-700'
                                } focus:border-yellow-500 focus:ring-0`}
                        />
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'age' ? 'text-yellow-500' : 'text-gray-600'}`}>
                            <User className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[11px] font-bold tracking-wider text-yellow-600/80 uppercase flex items-center gap-2 mb-1">
                        <CreditCard className="w-4 h-4 text-yellow-500" />
                        Method
                    </Label>
                    <div className="flex bg-[#0a0a0a] p-1 border border-gray-800/80 h-12" style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                        <button
                            onClick={() => setPaymentMode('online')}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md text-xs font-semibold transition-all duration-200 ${paymentMode === 'online' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        >
                            <CreditCard className="w-3.5 h-3.5" />
                            Online
                        </button>
                        <button
                            onClick={() => setPaymentMode('offline')}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md text-xs font-semibold transition-all duration-200 ${paymentMode === 'offline' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        >
                            <Banknote className="w-3.5 h-3.5" />
                            Cash
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                    <Label htmlFor="duration" className="text-[11px] font-bold tracking-wider text-yellow-600/80 uppercase flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        Session Time
                    </Label>
                    <div className="relative group">
                        <Input
                            id="duration"
                            type="number"
                            step="0.5"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            onFocus={() => setFocusedField('duration')}
                            onBlur={() => setFocusedField(null)}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            placeholder="Hours"
                            className={`h-12 bg-gray-900/50 border-gray-800 text-white placeholder-gray-600 rounded-lg pl-10 transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${focusedField === 'duration' ? 'border-yellow-500 shadow-[0_0_15px_rgba(255,215,0,0.2)]' : 'group-hover:border-gray-700'
                                } focus:border-yellow-500 focus:ring-0`}
                        />
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'duration' ? 'text-yellow-500' : 'text-gray-600'}`}>
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[11px] font-bold tracking-wider text-yellow-600/80 uppercase flex items-center gap-2 mb-1">
                        <Coffee className="w-4 h-4 text-yellow-500" />
                        Power-ups
                    </Label>
                    <div className="relative">
                        <Button
                            variant="outline"
                            onClick={() => setShowMenuModal(true)}
                            className={`w-full justify-between bg-red-950/20 border-red-500/30 text-red-100 hover:bg-red-900/40 hover:border-red-500 hover:text-white pl-3 h-12 transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.05)] hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] ${Object.keys(selectedSnacks).length > 0 ? 'border-red-500 bg-red-900/30' : ''}`}
                        >
                            <span className="truncate font-medium">
                                {Object.keys(selectedSnacks).length === 0 ? "Select Power-ups" : `${Object.values(selectedSnacks).reduce((a, b) => a + b, 0)} Items Selected`}
                            </span>
                            <ChevronDown className="w-4 h-4 text-red-400" />
                        </Button>

                        {/* FULL MENU MODAL — RESPONSIVE: Grid on PC, Scroll on Mobile */}
                        <AnimatePresence>
                            {showMenuModal && (
                                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                        onClick={() => setShowMenuModal(false)}
                                    />
                                    <motion.div
                                        initial={{ y: "100%", opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: "100%", opacity: 0 }}
                                        transition={{ type: "spring", damping: 28, stiffness: 350 }}
                                        className="relative w-full h-[85vh] sm:h-auto sm:max-h-[90vh] lg:w-[90vw] lg:max-w-6xl sm:w-[500px] bg-[#0a0a0a] border border-gray-800 sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Header */}
                                        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gradient-to-r from-red-950/30 to-transparent">
                                            <div>
                                                <h2 className="text-lg font-black text-white tracking-tight">⚡ Power-ups Menu</h2>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Select items from the full menu</p>
                                            </div>
                                            <button onClick={() => setShowMenuModal(false)} className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Menu Content */}
                                        <div className="flex-1 overflow-y-auto px-4 py-4">

                                            {/* ===== MOBILE: Accordion (lg:hidden) ===== */}
                                            <div className="lg:hidden space-y-2">
                                                {Object.entries(SNACK_INVENTORY).map(([key, cat]) => {
                                                    const isOpen = expandedCategory === key
                                                    const catItemCount = cat.items.reduce((sum, item) => sum + (selectedSnacks[item.id] || 0), 0)
                                                    return (
                                                        <div key={key} className={`rounded-xl border transition-all duration-200 ${isOpen ? 'bg-gray-900/60 border-gray-700' : 'bg-gray-900/30 border-gray-800/50'}`}>
                                                            {/* Accordion Header - tap to toggle */}
                                                            <button
                                                                onClick={() => setExpandedCategory(isOpen ? null : key)}
                                                                className="w-full flex items-center justify-between px-4 py-3"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-xl bg-gradient-to-br ${cat.gradient} border border-gray-800`}>
                                                                        <cat.icon className="w-4 h-4 text-white" />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <h3 className={`text-sm font-black uppercase tracking-wider ${cat.textColor}`}>{cat.label}</h3>
                                                                        <p className="text-[10px] text-gray-600">{cat.items.length} items</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {catItemCount > 0 && (
                                                                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{catItemCount}</span>
                                                                    )}
                                                                    <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                                                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                                                    </motion.div>
                                                                </div>
                                                            </button>
                                                            {/* Accordion Content */}
                                                            <AnimatePresence>
                                                                {isOpen && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        transition={{ duration: 0.25 }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="px-3 pb-3 space-y-1 border-t border-gray-800/50 pt-2">
                                                                            {cat.items.map(item => {
                                                                                const count = selectedSnacks[item.id] || 0
                                                                                return (
                                                                                    <div key={item.id} className={`flex items-center justify-between px-2 py-2 rounded-lg transition-all duration-200 border ${count > 0 ? 'bg-red-500/5 border-red-500/20' : 'border-transparent hover:bg-gray-800/30'}`}>
                                                                                        <div className="flex-1 min-w-0 mr-2">
                                                                                            <div className="text-sm font-bold text-gray-100 truncate">{item.name}</div>
                                                                                            <div className="text-xs font-mono text-red-400">₹{item.price}</div>
                                                                                        </div>
                                                                                        {count === 0 ? (
                                                                                            <button
                                                                                                onClick={() => handleSnackChange(item.id, 1)}
                                                                                                className="h-7 px-4 rounded-md bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-black border border-gray-700 hover:border-gray-600 transition-all active:scale-95"
                                                                                            >
                                                                                                ADD
                                                                                            </button>
                                                                                        ) : (
                                                                                            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-red-600 shadow-lg shadow-red-900/20">
                                                                                                <button onClick={() => handleSnackChange(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500 text-white transition-all">
                                                                                                    <Minus className="w-3 h-3" />
                                                                                                </button>
                                                                                                <span className="w-4 text-center text-xs font-black text-white">{count}</span>
                                                                                                <button onClick={() => handleSnackChange(item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500 text-white transition-all">
                                                                                                    <Plus className="w-3 h-3" />
                                                                                                </button>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* ===== DESKTOP: 3-Column Grid (hidden on mobile) ===== */}
                                            <div className="hidden lg:grid lg:grid-cols-3 gap-6">
                                                {Object.entries(SNACK_INVENTORY).map(([key, cat]) => (
                                                    <div key={key} className="bg-gray-900/40 rounded-xl border border-gray-800/50 p-3">
                                                        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-gray-800/50">
                                                            <div className={`p-2 rounded-xl bg-gradient-to-br ${cat.gradient} border border-gray-800`}>
                                                                <cat.icon className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <h3 className={`text-xs font-black uppercase tracking-wider ${cat.textColor}`}>{cat.label}</h3>
                                                                <p className="text-[10px] text-gray-600">{cat.items.length} items</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {cat.items.map(item => {
                                                                const count = selectedSnacks[item.id] || 0
                                                                return (
                                                                    <div key={item.id} className={`flex items-center justify-between px-2 py-2 rounded-lg transition-all duration-200 border ${count > 0 ? 'bg-red-500/5 border-red-500/20' : 'border-transparent hover:bg-gray-800/30'}`}>
                                                                        <div className="flex-1 min-w-0 mr-2">
                                                                            <div className="text-sm font-bold text-gray-100 truncate">{item.name}</div>
                                                                            <div className="text-xs font-mono text-red-400">₹{item.price}</div>
                                                                        </div>
                                                                        {count === 0 ? (
                                                                            <button onClick={() => handleSnackChange(item.id, 1)} className="h-7 px-4 rounded-md bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-black border border-gray-700 hover:border-gray-600 transition-all active:scale-95">
                                                                                ADD
                                                                            </button>
                                                                        ) : (
                                                                            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-red-600 shadow-lg shadow-red-900/20">
                                                                                <button onClick={() => handleSnackChange(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500 text-white transition-all">
                                                                                    <Minus className="w-3 h-3" />
                                                                                </button>
                                                                                <span className="w-4 text-center text-xs font-black text-white">{count}</span>
                                                                                <button onClick={() => handleSnackChange(item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500 text-white transition-all">
                                                                                    <Plus className="w-3 h-3" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                        </div>

                                        {/* Sticky Footer */}
                                        <div className="shrink-0 p-4 border-t border-gray-800 bg-black/80 backdrop-blur-md">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Value</div>
                                                    <div className="text-xl font-black text-white">
                                                        ₹{Object.entries(selectedSnacks).reduce((acc, [id, count]) => acc + (ALL_SNACKS_MAP[id]?.price || 0) * count, 0)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {Object.keys(selectedSnacks).length > 0 && (
                                                        <div className="bg-red-600/10 text-yellow-500 px-3 py-1 rounded-full text-[10px] font-black border border-red-500/20">
                                                            {Object.values(selectedSnacks).reduce((a, b) => a + b, 0)} ITEMS
                                                        </div>
                                                    )}
                                                    <Button
                                                        onClick={() => setShowMenuModal(false)}
                                                        className="h-10 px-8 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-xl font-black text-sm shadow-xl shadow-red-900/20 border border-red-500/50"
                                                    >
                                                        Done
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <motion.div
                className="bg-[#2A0800]/50 border border-yellow-900/40 rounded-2xl p-4 md:p-6 relative overflow-hidden group shadow-[inset_0_2px_20px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.5)]"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
                {/* Golden shimmer effect inside the vault */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,215,0,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shine_4s_infinite_ease-in-out]" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between relative z-10 gap-4">
                    <div className="flex items-center justify-between md:block">
                        <div className="text-[10px] md:text-xs text-yellow-500/80 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500 animate-pulse" />
                            Vault Total
                        </div>
                        <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2CD] via-[#FFD700] to-[#B8860B] flex items-baseline gap-1 font-cinzel drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            <span className="text-yellow-600 text-2xl font-montserrat">₹</span>
                            <motion.span 
                                key={calculateSubTotal()} 
                                initial={{ y: -20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            >
                                {calculateSubTotal().toFixed(2)}
                            </motion.span>
                        </div>
                    </div>
                    <div className="flex flex-row md:flex-col justify-between md:justify-end md:text-right md:space-y-1 border-t border-yellow-900/30 md:border-t-0 pt-3 md:pt-0">
                        <div className="text-xs text-yellow-600/70 flex items-center md:justify-end gap-1 font-medium">
                            <Zap className="w-3 h-3" />
                            Access: <span className="text-yellow-500">₹{calculateSessionPriceWithTime(parseFloat(duration) || 0, parseInt(numberOfPeople) || 1, now).toFixed(2)}</span>
                            {happyHour && <span className="text-yellow-400 font-bold ml-1">⚡HH</span>}
                        </div>
                        <div className="text-xs text-yellow-600/70 flex items-center md:justify-end gap-1 font-medium">
                            <Coffee className="w-3 h-3" />
                            Services: <span className="text-yellow-500">₹{Object.entries(selectedSnacks).reduce((acc, [id, count]) => acc + (ALL_SNACKS_MAP[id]?.price || 0) * count, 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Button
                    onClick={handleProceed}
                    disabled={isAnimating}
                    className={`w-full py-8 bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#B8860B] hover:from-[#FFD700] hover:to-[#DAA520] text-[#1a0505] rounded-xl font-cinzel font-bold text-xl md:text-2xl tracking-widest transition-all duration-500 shadow-[0_10px_30px_rgba(218,165,32,0.3)] hover:shadow-[0_15px_40px_rgba(255,215,0,0.5)] relative overflow-hidden group ${isAnimating ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:200%_0,0_0] bg-no-repeat transition-all duration-500 ease-out group-hover:bg-[position:-200%_0,0_0]" />
                    
                    {isAnimating ? (
                        <span className="flex items-center justify-center gap-2 relative z-10">
                            <div className="w-6 h-6 border-2 border-[#1a0505]/30 border-t-[#1a0505] rounded-full animate-spin"></div>
                            AUTHORIZING...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-3 relative z-10 group-hover:scale-105 transition-transform duration-300 drop-shadow-sm">
                            <Zap className="w-6 h-6 fill-current" />
                            GRANT ACCESS
                        </span>
                    )}
                </Button>
            </motion.div>
        </div>
    )
}