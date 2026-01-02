import { motion } from 'framer-motion'
import { User, Phone, Clock, Coffee, Sparkles, Zap, Trophy, Gamepad2, ChevronDown, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SNACK_INVENTORY, ALL_SNACKS_MAP, PER_PERSON_RATE } from '@/constants/inventory'

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
    calculateSubTotal
}: EntryFormProps) {
    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-600/10 rounded-lg">
                        <Gamepad2 className="w-6 h-6 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-light text-white">New Player Entry</h2>
                </div>
                <p className="text-gray-500 text-sm">Initialize a new gaming session</p>
            </div>

            <div id="entry-form" className="space-y-5 relative">
                {/* XP Progress Bar */}
                <div className="absolute -top-5 left-0 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-yellow-500"
                        initial={{ width: "0%" }}
                        animate={{
                            width: `${((customerName ? 20 : 0) + (phoneNumber ? 20 : 0) + (numberOfPeople ? 20 : 0) + (duration ? 20 : 0) + (Object.keys(selectedSnacks).length > 0 ? 20 : 0))}%`
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-gray-400 text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
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
                            className={`h-12 bg-gray-900/50 border-gray-800 text-white placeholder-gray-600 rounded-lg pl-10 transition-all duration-300 ${focusedField === 'customerName' ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'group-hover:border-gray-700'
                                } focus:border-blue-500 focus:ring-0`}
                        />
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'customerName' ? 'text-blue-500' : 'text-gray-600'}`}>
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
                        <Label htmlFor="phoneNumber" className="text-gray-400 text-sm font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4 text-blue-500" />
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
                                className={`h-12 bg-gray-900/50 border-gray-800 text-white placeholder-gray-600 rounded-lg pl-20 transition-all duration-300 ${focusedField === 'phoneNumber' ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'group-hover:border-gray-700'
                                    } focus:border-blue-500 focus:ring-0`}
                            />
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'phoneNumber' ? 'text-blue-500' : 'text-gray-600'}`}>
                                <Phone className="w-4 h-4" />
                            </div>
                            <div className={`absolute left-9 top-1/2 -translate-y-1/2 font-medium transition-colors duration-300 ${focusedField === 'phoneNumber' ? 'text-blue-500' : 'text-gray-500'}`}>
                                +91
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="numberOfPeople" className="text-gray-400 text-sm font-medium flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-500" />
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
                                className={`h-12 bg-gray-900/50 border-gray-800 text-white placeholder-gray-600 rounded-lg pl-10 transition-all duration-300 ${focusedField === 'numberOfPeople' ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'group-hover:border-gray-700'
                                    } focus:border-blue-500 focus:ring-0`}
                            />
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'numberOfPeople' ? 'text-blue-500' : 'text-gray-600'}`}>
                                <User className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="duration" className="text-gray-400 text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
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
                                className={`h-12 bg-gray-900/50 border-gray-800 text-white placeholder-gray-600 rounded-lg pl-10 transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${focusedField === 'duration' ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'group-hover:border-gray-700'
                                    } focus:border-blue-500 focus:ring-0`}
                            />
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'duration' ? 'text-blue-500' : 'text-gray-600'}`}>
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-gray-400 text-sm font-medium flex items-center gap-2">
                            <Coffee className="w-4 h-4 text-blue-500" />
                            Power-ups
                        </Label>
                        <div className="relative">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-between bg-blue-950/20 border-blue-500/30 text-blue-100 hover:bg-blue-900/40 hover:border-blue-500 hover:text-white pl-3 h-12 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.05)] hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] ${Object.keys(selectedSnacks).length > 0 ? 'border-blue-500 bg-blue-900/30' : ''}`}
                                    >
                                        <span className="truncate font-medium">
                                            {Object.keys(selectedSnacks).length === 0 ? "Select Power-ups" : `${Object.values(selectedSnacks).reduce((a, b) => a + b, 0)} Items Selected`}
                                        </span>
                                        <ChevronDown className="w-4 h-4 text-blue-400" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0 bg-gray-900 border-gray-800 text-white" align="start">
                                    <Tabs defaultValue="drinks" className="w-full">
                                        <TabsList className="w-full grid grid-cols-4 bg-gray-950/50 p-1">
                                            {Object.entries(SNACK_INVENTORY).map(([key, cat]) => (
                                                <TabsTrigger
                                                    key={key}
                                                    value={key}
                                                    className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400 hover:text-white hover:bg-gray-800/50 text-xs py-2 transition-all duration-200"
                                                >
                                                    <cat.icon className="w-4 h-4" />
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {Object.entries(SNACK_INVENTORY).map(([key, cat]) => (
                                            <TabsContent key={key} value={key} className="p-3 mt-0 max-h-[250px] overflow-y-auto">
                                                <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{cat.label}</div>
                                                <div className="space-y-1">
                                                    {cat.items.map(item => {
                                                        const count = selectedSnacks[item.id] || 0
                                                        return (
                                                            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                                                                <div>
                                                                    <div className="text-sm font-medium">{item.name}</div>
                                                                    <div className="text-xs text-blue-400">₹{item.price}</div>
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-gray-950 rounded-md p-1">
                                                                    <button
                                                                        onClick={() => handleSnackChange(item.id, -1)}
                                                                        className="w-6 h-6 flex items-center justify-center hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
                                                                        disabled={count === 0}
                                                                    >
                                                                        <Minus className="w-3 h-3" />
                                                                    </button>
                                                                    <span className="w-4 text-center text-sm font-medium">{count}</span>
                                                                    <button
                                                                        onClick={() => handleSnackChange(item.id, 1)}
                                                                        className="w-6 h-6 flex items-center justify-center hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
                                                                    >
                                                                        <Plus className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                    {Object.keys(selectedSnacks).length > 0 && (
                                        <div className="p-3 border-t border-gray-800 bg-gray-950/30">
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span className="text-gray-400">Selected Value</span>
                                                <span className="text-blue-500">
                                                    ₹{Object.entries(selectedSnacks).reduce((acc, [id, count]) => acc + (ALL_SNACKS_MAP[id]?.price || 0) * count, 0)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                <motion.div
                    className="bg-gradient-to-r from-red-900/20 to-black border border-blue-500/20 rounded-xl p-4 md:p-6 relative overflow-hidden group"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors duration-300"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between relative z-10 gap-4">
                        <div className="flex items-center justify-between md:block">
                            <div className="text-xs md:text-sm text-gray-400 mb-1 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                Total Loot Value
                            </div>
                            <div className="text-2xl md:text-3xl font-bold text-white flex items-baseline gap-1">
                                <span className="text-blue-500">₹</span>
                                {calculateSubTotal().toFixed(2)}
                            </div>
                        </div>
                        <div className="flex flex-row md:flex-col justify-between md:justify-end md:text-right md:space-y-1 border-t border-gray-800 md:border-t-0 pt-3 md:pt-0">
                            <div className="text-xs text-gray-500 flex items-center md:justify-end gap-1">
                                <Zap className="w-3 h-3" />
                                Gaming: <span className="text-gray-300">₹{((parseFloat(duration) || 0) * (parseInt(numberOfPeople) || 1) * PER_PERSON_RATE).toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center md:justify-end gap-1">
                                <Coffee className="w-3 h-3" />
                                Snacks: <span className="text-gray-300">₹{Object.entries(selectedSnacks).reduce((acc, [id, count]) => acc + (ALL_SNACKS_MAP[id]?.price || 0) * count, 0).toFixed(2)}</span>
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
                        className={`w-full py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-blue-500/25 relative overflow-hidden group ${isAnimating ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        {isAnimating ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Initializing...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2 relative z-10">
                                <Zap className="w-5 h-5 fill-current" />
                                START SESSION
                            </span>
                        )}
                    </Button>
                </motion.div>
            </div>
        </div>
    )
}
