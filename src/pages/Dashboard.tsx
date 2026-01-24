import { useState, useEffect, useRef } from 'react'
import { format, subDays } from 'date-fns'
import { db } from '@/lib/firebase'
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc, Timestamp, setDoc, runTransaction } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { checkAndArchiveOldData } from '@/lib/archiver'
import { sendSessionEndSMS } from '@/lib/sms'
import * as XLSX from 'xlsx'

import { ALL_SNACKS_MAP, PER_PERSON_RATE } from '@/constants/inventory'
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
    const [screenNumber, setScreenNumber] = useState<string>('')
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

    // Track sessions that have already received SMS
    const sentSMSRef = useRef<Set<string>>(new Set())

    // Update ref whenever entries change
    useEffect(() => {
        recentEntriesRef.current = recentEntries
    }, [recentEntries])

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)

        // Firebase Real-time Listener
        const q = query(collection(db, "entries"), orderBy("timestamp", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const entries = snapshot.docs.map(doc => {
                const data = doc.data()
                // Migration Logic for Old Data
                let parsedSnacks: SnackOrder[] = []

                if (Array.isArray(data.snacks)) {
                    if (data.snacks.length > 0 && typeof data.snacks[0] === 'string') {
                        // Old format: string[]
                        const counts: Record<string, number> = {}
                        data.snacks.forEach((s: string) => counts[s] = (counts[s] || 0) + 1)
                        // Try to map old keys to new inventory if possible, else generic
                        parsedSnacks = Object.entries(counts).map(([name, count]) => {
                            let unitPrice = 0
                            if (name === 'soda') unitPrice = 50
                            if (name === 'chips') unitPrice = 40
                            if (name === 'sandwich') unitPrice = 120
                            if (name === 'combo') unitPrice = 200

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
                        // New format
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

    // Check for old data to archive
    useEffect(() => {
        const runArchival = async () => {
            try {
                const result = await checkAndArchiveOldData(6); // 6 months
                if (result.status === 'success') {
                    toast({
                        title: "Data Archived",
                        description: `Successfully archived and deleted ${result.count} old records. File: ${result.fileName}`,
                        className: "bg-blue-500 border-blue-600 text-white"
                    })
                }
            } catch (error) {
                console.error("Archival failed:", error)
            }
        }
        // Run check once on mount
        runArchival();
    }, [])

    // Monitor sessions and send SMS when they complete
    useEffect(() => {
        const checkAndSendSMS = async () => {
            const now = currentTime.getTime();
            // Only send SMS to sessions that completed within the last 5 minutes
            const recentCompletionWindow = 5 * 60 * 1000; // 5 minutes in milliseconds

            for (const entry of recentEntries) {
                // Skip if SMS already sent (check both in-memory and database)
                if (sentSMSRef.current.has(entry.id) || entry.smsSent) {
                    continue;
                }

                // Check if session is completed
                const startTime = new Date(entry.timestamp).getTime();
                const durationMs = entry.duration * 60 * 60 * 1000;
                const totalPaused = entry.totalPausedTime || 0;
                const endTime = startTime + durationMs + totalPaused;

                // Calculate how long ago the session ended
                const timeSinceCompletion = now - endTime;

                // Only send SMS if:
                // 1. Session has ended (endTime <= now)
                // 2. Session is not paused
                // 3. Session completed recently (within the last 5 minutes)
                if (endTime <= now && !entry.isPaused && timeSinceCompletion <= recentCompletionWindow) {
                    console.log(`Session recently completed for ${entry.customerName} (${Math.round(timeSinceCompletion / 1000)}s ago), sending SMS...`);

                    const success = await sendSessionEndSMS({
                        phoneNumber: entry.phoneNumber,
                        customerName: entry.customerName,
                        sessionDuration: entry.duration
                    });

                    if (success) {
                        // Mark this session as SMS sent in memory
                        sentSMSRef.current.add(entry.id);

                        // Update Firestore to persist SMS status
                        try {
                            const entryRef = doc(db, "entries", entry.id);
                            await updateDoc(entryRef, {
                                smsSent: true
                            });
                            console.log(`SMS sent successfully to ${entry.customerName}`);
                        } catch (error) {
                            console.error(`Failed to update SMS status in database:`, error);
                        }
                    } else {
                        console.error(`Failed to send SMS to ${entry.customerName}`);
                    }
                } else if (endTime <= now && !entry.isPaused && timeSinceCompletion > recentCompletionWindow) {
                    // Session completed too long ago, mark as SMS sent without actually sending
                    // This prevents trying to send SMS to old sessions
                    if (!sentSMSRef.current.has(entry.id) && !entry.smsSent) {
                        console.log(`Session for ${entry.customerName} completed too long ago (${Math.round(timeSinceCompletion / 60000)} minutes), skipping SMS`);
                        sentSMSRef.current.add(entry.id);

                        // Optionally update database to mark as processed
                        try {
                            const entryRef = doc(db, "entries", entry.id);
                            await updateDoc(entryRef, {
                                smsSent: false // Mark as false to indicate it was skipped, not sent
                            });
                        } catch (error) {
                            console.error(`Failed to update SMS status:`, error);
                        }
                    }
                }
            }
        };

        // Check every 30 seconds for completed sessions
        const interval = setInterval(checkAndSendSMS, 30000);

        // Also check immediately
        checkAndSendSMS();

        return () => clearInterval(interval);
    }, [recentEntries, currentTime])




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

        return (durationNum * peopleNum * PER_PERSON_RATE) + snacksPrice
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
        if (!customerName || !phoneNumber || !duration || !screenNumber) {
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
                screenNumber: parseInt(screenNumber) || 0
            })

            setTimeout(() => {
                setCustomerName('')
                setPhoneNumber('')
                setNumberOfPeople('1')
                setDuration('')
                setAge('')
                setPaymentMode('offline')
                setScreenNumber('')
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
            const subTotal = (newDuration * newPeople * PER_PERSON_RATE) + snacksPrice

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
        try {
            await deleteDoc(doc(db, "entries", entryId))
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

    // Filter for today's entries for the stats bar
    const startOfToday = new Date(currentTime)
    startOfToday.setHours(0, 0, 0, 0)

    const todayEntries = recentEntries.filter(entry => {
        return new Date(entry.timestamp) >= startOfToday
    })

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

    // Use lifetime data (recentEntries) for Table View, otherwise use today's data (Dashboard & Analytics)
    // AND filter for only completed sessions for stats calculations
    const statsEntries = ((activeTab === 'table') ? recentEntries : todayEntries).filter(isSessionCompleted)

    const totalRevenue = statsEntries.reduce((sum, entry) => sum + entry.subTotal, 0)
    const totalCustomers = statsEntries.length
    const avgSessionValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
    const totalHours = statsEntries.reduce((sum, entry) => sum + entry.duration, 0)



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
        const tCash = completedEntries
            .filter(e => e.paymentMode === 'offline' || !e.paymentMode)
            .reduce((sum, entry) => sum + entry.subTotal, 0)
        const tOnline = completedEntries
            .filter(e => e.paymentMode === 'online')
            .reduce((sum, entry) => sum + entry.subTotal, 0)

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

    const handleDownloadExcel = () => {
        try {
            const data = recentEntries.map(entry => ({
                'Customer Name': entry.customerName,
                'Phone Number': entry.phoneNumber,
                'Age': entry.age || '-',
                'Payment Mode': entry.paymentMode || 'cash',
                'Number of People': entry.numberOfPeople || 1,
                'Duration (Hours)': entry.duration,
                'Snacks': entry.snacks.map(s => `${s.name} (x${s.quantity})`).join(', '),
                'Total Amount': entry.subTotal,
                'Date': entry.timestamp.toLocaleDateString(),
                'Time': entry.timestamp.toLocaleTimeString(),
                'Status': entry.isRenewed ? 'Renewed' : 'New'
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sessions");

            // Generate buffer
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

            // Create download link
            const url = window.URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SB_Gaming_Sessions_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Download Started",
                description: "Your Excel file is being downloaded.",
                className: "bg-blue-600 border-blue-500 text-white"
            })
        } catch (error) {
            console.error("Download failed:", error);
            toast({
                variant: "destructive",
                title: "Download Failed",
                description: "Could not generate Excel file.",
            })
        }
    }

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
                    totalCustomers={totalCustomers}
                    totalRevenue={totalRevenue}
                    avgSessionValue={avgSessionValue}
                    totalHours={totalHours}
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
                                    screenNumber={screenNumber}
                                    setScreenNumber={setScreenNumber}
                                />

                                <RecentActivity
                                    recentEntries={recentEntries}
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
                                    recentEntries={recentEntries}
                                    handleDownloadExcel={handleDownloadExcel}
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
            />
        </div>
    )
}
