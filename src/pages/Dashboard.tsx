import { useState, useEffect, useRef } from 'react'
import { format, subDays } from 'date-fns'
import { db } from '@/lib/firebase'
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc, Timestamp, setDoc, runTransaction, where, increment } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { ALL_SNACKS_MAP, calculateSessionPrice } from '@/constants/inventory'
import { CustomerEntry, SnackOrder } from '@/types/dashboard'
import { DashboardHeader } from '@/components/dashboard/Header/DashboardHeader'
import { EntryForm } from '@/components/dashboard/EntryForm/EntryForm'
import { AnalyticsOverview } from '@/components/dashboard/AnalyticsOverview/AnalyticsOverview'
import { RecentActivity } from '@/components/dashboard/RecentActivity/RecentActivity'
import { SessionsTable } from '@/components/dashboard/SessionsTable/SessionsTable'
import { EntryDetailsDialog } from '@/components/dashboard/EntryDetailsDialog/EntryDetailsDialog'
import { AnimatePresence, motion } from 'framer-motion'

export default function GamingCafeDashboard() {
    const [customerName, setCustomerName] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [numberOfPeople, setNumberOfPeople] = useState('1')
    const [duration, setDuration] = useState('')
    const [age, setAge] = useState('')
    const [paymentMode, setPaymentMode] = useState<'online' | 'offline'>('offline')
    // New State for Structured Snacks
    const [selectedSnacks, setSelectedSnacks] = useState<Record<string, number>>({})
    const [stockData, setStockData] = useState<Record<string, number>>({})

    const [recentEntries, setRecentEntries] = useState<CustomerEntry[]>([])
    const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'overview'>('dashboard')
    const [isAnimating, setIsAnimating] = useState(false)
    const [focusedField, setFocusedField] = useState<string | null>(null)
    const [selectedEntry, setSelectedEntry] = useState<CustomerEntry | null>(null)

    const [currentTime, setCurrentTime] = useState(new Date())
    const [activityTab, setActivityTab] = useState<'ongoing' | 'completed'>('ongoing')
    const { toast } = useToast()

    // Ref to keep track of entries for the interval
    const recentEntriesRef = useRef<CustomerEntry[]>([])



    // Update ref whenever entries change
    useEffect(() => {
        recentEntriesRef.current = recentEntries
    }, [recentEntries])

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)

        // Fetch last 3 days history to support Analytics Overview (which shows 3 days)
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        const q = query(
            collection(db, "entries"), 
            where("timestamp", ">=", threeDaysAgo),
            orderBy("timestamp", "desc")
        )
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const entries = snapshot.docs.map(doc => {
                const data = doc.data()
                let parsedSnacks: SnackOrder[] = []

                if (Array.isArray(data.snacks)) {
                    if (data.snacks.length > 0 && typeof data.snacks[0] === 'string') {
                        // Old format migration...
                        const counts: Record<string, number> = {}
                        data.snacks.forEach((s: string) => counts[s] = (counts[s] || 0) + 1)
                        parsedSnacks = Object.entries(counts).map(([name, count]) => {
                            let unitPrice = 0
                            const priceMap = { 'soda': 50, 'chips': 40, 'sandwich': 120, 'combo': 200 }
                            unitPrice = (priceMap as any)[name] || 0

                            return {
                                id: name,
                                name: name.charAt(0).toUpperCase() + name.slice(1),
                                category: 'legacy',
                                quantity: count,
                                unitPrice: unitPrice,
                                totalPrice: unitPrice * count
                            }
                        })
                    } else {
                        parsedSnacks = data.snacks
                    }
                }

                return {
                    id: doc.id,
                    ...data,
                    snacks: parsedSnacks,
                    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp),
                    pausedAt: data.pausedAt ? (data.pausedAt instanceof Timestamp ? data.pausedAt.toDate() : new Date(data.pausedAt)) : undefined
                }
            }) as CustomerEntry[]
            setRecentEntries(entries)
        })

        return () => {
            clearInterval(timer)
            unsubscribe()
        }
    }, [])

    // Stock Subscription
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "inventory", "stock"), (doc) => {
            if (doc.exists()) {
                setStockData(doc.data() as Record<string, number>)
            } else {
                setStockData({})
            }
        })
        return () => unsubscribe()
    }, [])



    const handleUpdateStock = async (id: string, newQuantity: number) => {
        try {
            await setDoc(doc(db, "inventory", "stock"), {
                [id]: newQuantity
            }, { merge: true })
            toast({ title: "Stock Updated", className: "bg-green-600 border-green-500 text-white" })
        } catch (error) {
            console.error(error)
            toast({ variant: "destructive", title: "Error", description: "Could not update stock." })
        }
    }

    const deductStock = async (items: { id: string, quantity: number }[]): Promise<boolean> => {
        try {
            await runTransaction(db, async (transaction) => {
                const sfDocRef = doc(db, "inventory", "stock");
                const sfDoc = await transaction.get(sfDocRef);

                if (!sfDoc.exists()) {
                    // Initialize if missing
                    transaction.set(sfDocRef, {});
                }

                const currentStock = sfDoc.data() || {};
                const updates: Record<string, number> = {};

                // Check availability
                for (const item of items) {
                    const current = currentStock[item.id] || 0;
                    if (current < item.quantity) {
                        throw new Error(`Insufficient stock for ${ALL_SNACKS_MAP[item.id]?.name || item.id}`);
                    }
                    updates[item.id] = current - item.quantity;
                }

                transaction.update(sfDocRef, updates);
            });
            return true;
        } catch (e: any) {
            console.error("Transaction failed: ", e);
            toast({
                variant: 'destructive',
                title: "Stock Error",
                description: e.message
            });
            return false;
        }
    }



    /**
     * Highly Optimal Summary System
     * Maintains a single document per month with aggregated stats.
     * Drastically reduces read costs for Analytics and Overview.
     */
    const updateMonthlySummary = async (date: Date, changes: any) => {
        const monthKey = format(date, 'yyyy-MM')
        const summaryRef = doc(db, "summaries", monthKey)
        
        try {
            await setDoc(summaryRef, changes, { merge: true })
        } catch (error) {
            console.error("Failed to update monthly summary:", error)
        }
    }






    const calculateSubTotal = () => {
        const durationNum = parseFloat(duration) || 0
        const peopleNum = parseInt(numberOfPeople) || 1

        let snacksPrice = 0
        Object.entries(selectedSnacks).forEach(([id, count]) => {
            const item = ALL_SNACKS_MAP[id]
            if (item) {
                snacksPrice += item.price * count
            }
        })

        return calculateSessionPrice(durationNum, peopleNum) + snacksPrice
    }



    const handleSnackChange = (itemId: string, delta: number) => {
        setSelectedSnacks(prev => {
            const current = prev[itemId] || 0
            const next = Math.max(0, current + delta)
            if (next === 0) {
                const { [itemId]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [itemId]: next }
        })
    }





    const handleProceed = async () => {
        if (!customerName || !phoneNumber || !duration) {
            triggerErrorAnimation()
            return
        }

        if (phoneNumber.length !== 10) {
            toast({
                variant: "destructive",
                title: "Invalid Phone Number",
                description: "Phone number must be exactly 10 digits.",
            })
            return
        }

        setIsAnimating(true)

        // Check stock first
        const snacksToDeduct = Object.entries(selectedSnacks).map(([id, count]) => ({ id, quantity: count }))
        if (snacksToDeduct.length > 0) {
            const success = await deductStock(snacksToDeduct)
            if (!success) {
                setIsAnimating(false)
                return
            }
        }

        try {
            await addDoc(collection(db, "entries"), {
                customerName: customerName.trim(),
                phoneNumber: `+91 ${phoneNumber}`,
                numberOfPeople: parseInt(numberOfPeople) || 1,
                duration: parseFloat(duration),
                snacks: Object.entries(selectedSnacks).map(([id, count]) => {
                    const item = ALL_SNACKS_MAP[id]
                    return {
                        id: id,
                        name: item.name,
                        category: 'general', // You could look up category key if needed
                        quantity: count,
                        unitPrice: item.price,
                        totalPrice: item.price * count
                    }
                }),
                subTotal: calculateSubTotal(),
                timestamp: Timestamp.now(),
                isRenewed: false,
                age: parseInt(age) || 0,
                paymentMode: paymentMode,
            })

            // Update Monthly Summary (Scalability optimization)
            const statsUpdate: any = {
                totalRevenue: increment(calculateSubTotal()),
                totalCustomers: increment(1),
                totalGuests: increment(parseInt(numberOfPeople) || 1)
            }
            if (paymentMode === 'online') statsUpdate.totalOnline = increment(calculateSubTotal())
            else statsUpdate.totalCash = increment(calculateSubTotal())
            
            // Track snacks in summary
            Object.entries(selectedSnacks).forEach(([id, count]) => {
                statsUpdate[`snacks.${id}`] = increment(count)
            })

            await updateMonthlySummary(new Date(), statsUpdate)

            setTimeout(() => {
                setCustomerName('')
                setPhoneNumber('')
                setNumberOfPeople('1')
                setDuration('')
                setAge('')
                setPaymentMode('offline')
                setSelectedSnacks({})
                setIsAnimating(false)
                toast({
                    title: "Session Started",
                    description: `Added ${customerName} to active sessions.`,
                    className: "bg-blue-600 border-blue-500 text-white"
                })
            }, 300)
        } catch (error: any) {
            console.error("Error adding document: ", error)
            setIsAnimating(false)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save data. " + (error.message || "Check your internet connection."),
            })
        }
    }

    const triggerErrorAnimation = () => {
        const form = document.getElementById('entry-form')
        form?.classList.add('animate-pulse')
        setTimeout(() => {
            form?.classList.remove('animate-pulse')
        }, 1000)
    }

    const openEntryDetails = (entry: CustomerEntry) => {
        setSelectedEntry(entry)
    }

    const closeEntryDetails = () => {
        setSelectedEntry(null)
    }

    const saveEntryChanges = async (newDuration: number, newPeople: number, snacks: SnackOrder[]) => {
        if (!selectedEntry) return

        const isRenewed = newDuration > selectedEntry.duration

        try {
            const snacksPrice = snacks.reduce((total, snack) => total + (snack.totalPrice || 0), 0)
            const subTotal = calculateSessionPrice(newDuration, newPeople) + snacksPrice

            const entryRef = doc(db, "entries", selectedEntry.id)
            await updateDoc(entryRef, {
                duration: newDuration,
                numberOfPeople: newPeople,
                snacks: snacks,
                subTotal: subTotal,
                isRenewed: selectedEntry.isRenewed || isRenewed
            })

            // Adjust stock
            // Calculate delta
            const oldSnackMap: Record<string, number> = {}
            selectedEntry.snacks.forEach(s => oldSnackMap[s.id] = (oldSnackMap[s.id] || 0) + s.quantity)

            const newSnackMap: Record<string, number> = {}
            snacks.forEach(s => newSnackMap[s.id] = (newSnackMap[s.id] || 0) + s.quantity)

            const allIds = new Set([...Object.keys(oldSnackMap), ...Object.keys(newSnackMap)])

            // We need to 'deduct' the net change. 
            // If new > old, effective quantity to deduct is (new - old).
            // If new < old, effective quantity is negative (refund), so stock increases.
            // However, `deductStock` checks for sufficiency. Refunds are always safe.
            // Deduct inputs: {id, quantity}. If quantity is negative, it adds stock.

            const adjustments: { id: string, quantity: number }[] = []

            allIds.forEach(id => {
                const oldQ = oldSnackMap[id] || 0
                const newQ = newSnackMap[id] || 0
                const delta = newQ - oldQ
                if (delta !== 0) {
                    adjustments.push({ id, quantity: delta })
                }
            })

            if (adjustments.length > 0) {
                // We use the same transaction logic. If delta is positive, we are consuming more -> check stock.
                // If delta is negative, we are refunding -> safely add back.
                // Note: Our deductStock implementations checks 'current < quantity'. 
                // If quantity is negative (e.g. -2), current < -2 is always false (assuming stock >= 0). 
                // So refunds pass automatically. 
                // 'current - quantity' becomes 'current - (-2)' = 'current + 2'. Correct.
                await deductStock(adjustments)
            }

            closeEntryDetails()
            toast({
                title: "Session Updated",
                description: "Customer details have been saved.",
                className: "bg-blue-600 border-blue-500 text-white"
            })

            // Update Summary for deltas
            const revenueDelta = subTotal - selectedEntry.subTotal
            const peopleDelta = newPeople - selectedEntry.numberOfPeople
            
            const statsUpdate: any = {
                totalRevenue: increment(revenueDelta),
                totalGuests: increment(peopleDelta)
            }
            // Adjust payment mode stats if changed or just revenue diff
            if (selectedEntry.paymentMode === 'online') statsUpdate.totalOnline = increment(revenueDelta)
            else statsUpdate.totalCash = increment(revenueDelta)

            await updateMonthlySummary(new Date(selectedEntry.timestamp), statsUpdate)
        } catch (error: any) {
            console.error("Error updating document: ", error)
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update session. " + (error.message || "Please try again."),
            })
        }
    }

    const handleDeleteEntry = async (entryId: string) => {
        const entry = recentEntries.find(e => e.id === entryId)
        if (!entry) return

        try {
            await deleteDoc(doc(db, "entries", entryId))
            
            // Reverse summary stats
            const statsUpdate: any = {
                totalRevenue: increment(-entry.subTotal),
                totalCustomers: increment(-1),
                totalGuests: increment(-(entry.numberOfPeople || 1))
            }
            if (entry.paymentMode === 'online') statsUpdate.totalOnline = increment(-entry.subTotal)
            else statsUpdate.totalCash = increment(-entry.subTotal)

            await updateMonthlySummary(new Date(entry.timestamp), statsUpdate)

            toast({ title: "Session Deleted", description: "The session has been removed.", className: "bg-red-600 border-red-500 text-white" })
        } catch (error) {
            console.error(error)
            toast({ variant: "destructive", title: "Error", description: "Could not delete session." })
        }
    }

    const handleTogglePause = async (entry: CustomerEntry) => {
        const entryRef = doc(db, "entries", entry.id)
        try {
            if (entry.isPaused) {
                // Resume logic: Shift start time by the duration it was paused to "skip" that time
                // Or accumulate totalPausedTime. Let's use totalPausedTime for better tracking.
                // Actually, if we use totalPausedTime, we need to adjust calculating active/expired logic everywhere.
                // Simplest robust method: Shift timestamp forward.
                // But user wants "Started Time". If we shift timestamp, started time changes.
                // So better: Use totalPausedTime.

                const pausedAt = entry.pausedAt || new Date()
                const now = new Date()
                const pauseDuration = now.getTime() - pausedAt.getTime()
                const currentTotalPaused = entry.totalPausedTime || 0

                await updateDoc(entryRef, {
                    isPaused: false,
                    pausedAt: null,
                    totalPausedTime: currentTotalPaused + pauseDuration
                })
                toast({ title: "Session Resumed", className: "bg-green-600 border-green-500 text-white" })
            } else {
                // Pause
                await updateDoc(entryRef, {
                    isPaused: true,
                    pausedAt: Timestamp.now()
                })
                toast({ title: "Session Paused", className: "bg-yellow-600 border-yellow-500 text-white" })
            }
        } catch (error) {
            console.error(error)
            toast({ variant: "destructive", title: "Error", description: "Could not update session status." })
        }
    }

    // Data for charts
    const getSnacksDistribution = (entries: CustomerEntry[]) => {
        const distribution: { [key: string]: number } = {}
        entries.forEach(entry => {
            if (entry.snacks.length === 0) {
                // distribution['No Snacks'] = (distribution['No Snacks'] || 0) + 1
            } else {
                entry.snacks.forEach(snack => {
                    const snackName = snack.name
                    distribution[snackName] = (distribution[snackName] || 0) + snack.quantity
                })
            }
        })
        return Object.entries(distribution).map(([name, value]) => ({ name, value }))
    }



    const getHourlyDistribution = (entries: CustomerEntry[]) => {
        const hourlyData: { [key: string]: { customers: number; revenue: number } } = {}

        for (let i = 0; i < 24; i++) {
            hourlyData[i] = { customers: 0, revenue: 0 }
        }

        entries.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours()
            hourlyData[hour].customers += 1
            hourlyData[hour].revenue += entry.subTotal
        })

        return Object.entries(hourlyData).map(([hour, data]) => ({
            hour: `${hour}:00`,
            customers: data.customers,
            revenue: data.revenue
        })).filter(item => item.revenue > 0 || item.customers > 0)
    }



    // Helper to check if a session is completed
    const isSessionCompleted = (entry: CustomerEntry) => {
        if (entry.isPaused) return false // Paused sessions are considered ongoing? Or separate? Let's say ongoing but frozen.
        const startTime = new Date(entry.timestamp).getTime()
        const durationMs = entry.duration * 60 * 60 * 1000
        // Effective End Time = Start + Duration + TotalPaused
        // But if currently paused, the clock isn't ticking on remaining duration.
        // Let's rely on RecentlyActivity's logic for display, but for stats, we check if it's past effective end date *assuming* it's currently running or finished.

        const totalPaused = entry.totalPausedTime || 0
        const endTime = startTime + durationMs + totalPaused
        return endTime <= currentTime.getTime()
    }






    const getStatsForDate = (targetDate: Date) => {
        const startOfDay = new Date(targetDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(targetDate)
        endOfDay.setHours(23, 59, 59, 999)

        const dayEntries = recentEntries.filter(entry => {
            const t = new Date(entry.timestamp)
            return t >= startOfDay && t <= endOfDay
        })

        const completedEntries = dayEntries.filter(isSessionCompleted)

        const tRevenue = completedEntries.reduce((sum, entry) => sum + entry.subTotal, 0)
        const tCustomers = completedEntries.length
        let tCash = 0
        let tOnline = 0

        completedEntries.forEach(entry => {
            if (entry.splitPayment) {
                tCash += entry.splitPayment.cashAmount
                tOnline += entry.splitPayment.onlineAmount
            } else if (entry.paymentMode === 'online') {
                tOnline += entry.subTotal
            } else {
                tCash += entry.subTotal
            }
        })

        const sData = getSnacksDistribution(completedEntries)
        const hStats = getHourlyDistribution(completedEntries)
        const rData = hStats.map(d => ({
            date: d.hour,
            revenue: d.revenue,
            customers: d.customers
        }))

        return {
            snacksData: sData,
            revenueData: rData,
            hourlyData: hStats,
            overallStats: {
                totalRevenue: tRevenue,
                totalCustomers: tCustomers,
                totalCash: tCash,
                totalOnline: tOnline
            }
        }
    }

    const historyData = [0, 1, 2].map(daysAgo => {
        const date = subDays(currentTime, daysAgo)
        const label = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : format(date, 'EEE, dd MMM')
        return {
            date,
            label,
            ...getStatsForDate(date)
        }
    })


    return (
        <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-blue-500/30">
            {/* Premium Background with Depth */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] opacity-30 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[100px] opacity-30 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <DashboardHeader
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />

                {/* Main Content with AnimatePresence */}
                <div className="flex-1 max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-8 w-full">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' ? (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <AnalyticsOverview
                                    historyData={historyData}
                                    stockData={stockData}
                                    onUpdateStock={handleUpdateStock}
                                />
                            </motion.div>
                        ) : activeTab === 'dashboard' ? (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 pb-20 md:pb-0"
                            >
                                <EntryForm
                                    customerName={customerName}
                                    setCustomerName={setCustomerName}
                                    phoneNumber={phoneNumber}
                                    setPhoneNumber={setPhoneNumber}
                                    numberOfPeople={numberOfPeople}
                                    setNumberOfPeople={setNumberOfPeople}
                                    duration={duration}
                                    setDuration={setDuration}
                                    selectedSnacks={selectedSnacks}
                                    handleSnackChange={handleSnackChange}
                                    handleProceed={handleProceed}
                                    isAnimating={isAnimating}
                                    focusedField={focusedField}
                                    setFocusedField={setFocusedField}
                                    calculateSubTotal={calculateSubTotal}
                                    age={age}
                                    setAge={setAge}
                                    paymentMode={paymentMode}
                                    setPaymentMode={setPaymentMode}
                                />

                                <RecentActivity
                                    recentEntries={recentEntries.filter(e => e.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000))}
                                    activityTab={activityTab}
                                    setActivityTab={setActivityTab}
                                    currentTime={currentTime}
                                    openEntryDetails={openEntryDetails}
                                    onDelete={handleDeleteEntry}
                                    onPause={handleTogglePause}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="table"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="pb-8"
                            >
                                <SessionsTable
                                    openEntryDetails={openEntryDetails}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Entry Details Dialog */}
            <EntryDetailsDialog
                entry={selectedEntry}
                isOpen={selectedEntry !== null}
                onClose={closeEntryDetails}
                onSave={saveEntryChanges}
                readOnly={activeTab === 'table'}
                onSplitPayment={async (entry: CustomerEntry, cash: number, online: number) => {
                    try {
                        const entryRef = doc(db, "entries", entry.id)
                        await updateDoc(entryRef, {
                            splitPayment: {
                                cashAmount: cash,
                                onlineAmount: online
                            }
                        })
                        toast({
                            title: "Payment Split",
                            description: `Cash: ₹${cash} | Online: ₹${online}`,
                            className: "bg-green-600 border-green-500 text-white"
                        })
                    } catch (error) {
                        console.error("Error splitting payment:", error)
                        toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Failed to update split payment."
                        })
                    }
                }}
            />
        </div>
    )
}
