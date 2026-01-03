import { useState, useEffect, useRef } from 'react'
import { db } from '@/lib/firebase'
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { checkAndArchiveOldData } from '@/lib/archiver'
import * as XLSX from 'xlsx'
import { sendSMS } from '@/lib/sms'
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
    // New State for Structured Snacks
    const [selectedSnacks, setSelectedSnacks] = useState<Record<string, number>>({})

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
                    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp)
                }
            }) as CustomerEntry[]
            setRecentEntries(entries)
        })

        return () => {
            clearInterval(timer)
            unsubscribe()
        }
    }, [])

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

    // Check for expired sessions and send SMS
    useEffect(() => {
        const checkExpiry = async () => {
            // console.log("Running SMS check (Interval)...", new Date().toLocaleTimeString());
            const now = new Date().getTime()

            recentEntriesRef.current.forEach(async (entry) => {
                const startTime = new Date(entry.timestamp).getTime()
                const durationMs = entry.duration * 60 * 60 * 1000
                const endTime = startTime + durationMs

                // If session is expired and SMS not sent yet
                if (now > endTime && !entry.smsSent) {
                    const cleanNumber = entry.phoneNumber.replace(/\D/g, '').slice(-10);

                    // Skip invalid numbers (e.g. test data)
                    if (cleanNumber.length !== 10) {
                        console.log(`Skipping SMS for invalid number: ${entry.phoneNumber}`);
                        // Mark as sent to stop checking this entry
                        const entryRef = doc(db, "entries", entry.id)
                        await updateDoc(entryRef, { smsSent: true })
                        return;
                    }

                    console.log(`Triggering SMS for ${entry.customerName}`);
                    try {
                        // 1. Send SMS
                        const message = `Thank You ${entry.customerName || "Valued Customer"} for Visiting - SB Gaming Cafe\nWe hope to see you soon!\n[${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}]`
                        await sendSMS(entry.phoneNumber, message)

                        // 2. Update Firestore
                        const entryRef = doc(db, "entries", entry.id)
                        await updateDoc(entryRef, {
                            smsSent: true
                        })

                        toast({
                            title: "SMS Sent",
                            description: `Thank you message sent to ${entry.customerName}`,
                            className: "bg-blue-500 border-blue-600 text-white"
                        })

                    } catch (error: any) {
                        console.error("Failed to send SMS:", error)
                        // Don't show toast for every failure to avoid spamming if API is down
                        if (error.message.includes("Invalid phone number")) {
                            // Mark as sent if it's an invalid number error to stop retrying
                            const entryRef = doc(db, "entries", entry.id)
                            await updateDoc(entryRef, { smsSent: true })
                        }
                    }
                }
            })
        }

        // Run check every 10 seconds
        const interval = setInterval(checkExpiry, 10000)

        // Run immediately on mount too
        checkExpiry();

        return () => clearInterval(interval)
    }, []) // Empty dependency array ensures this interval persists correctly

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
                smsSent: false,
                age: parseInt(age) || 0,
                paymentMode: paymentMode
            })

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
            const subTotal = (newDuration * newPeople * PER_PERSON_RATE) + snacksPrice

            const entryRef = doc(db, "entries", selectedEntry.id)
            await updateDoc(entryRef, {
                duration: newDuration,
                numberOfPeople: newPeople,
                snacks: snacks,
                subTotal: subTotal,
                isRenewed: selectedEntry.isRenewed || isRenewed
            })
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

    // Data for charts
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

    const getRevenueData = () => {
        const last7Days = []
        const today = new Date()

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0)

            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)

            const dayEntries = recentEntries.filter(entry => {
                const entryDate = new Date(entry.timestamp)
                return entryDate >= date && entryDate < nextDate
            })

            const revenue = dayEntries.reduce((sum, entry) => sum + entry.subTotal, 0)
            const customers = dayEntries.length

            last7Days.push({
                date: date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
                revenue,
                customers
            })
        }

        return last7Days
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

    // Use lifetime data (recentEntries) for Table View and Overview, otherwise use today's data
    // Use lifetime data (recentEntries) for Table View, otherwise use today's data (Dashboard & Analytics)
    const statsEntries = (activeTab === 'table') ? recentEntries : todayEntries

    const totalRevenue = statsEntries.reduce((sum, entry) => sum + entry.subTotal, 0)
    const totalCustomers = statsEntries.length
    const avgSessionValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
    const totalHours = statsEntries.reduce((sum, entry) => sum + entry.duration, 0)

    const totalCash = statsEntries
        .filter(e => e.paymentMode === 'offline' || !e.paymentMode)
        .reduce((sum, entry) => sum + entry.subTotal, 0)

    const totalOnline = statsEntries
        .filter(e => e.paymentMode === 'online')
        .reduce((sum, entry) => sum + entry.subTotal, 0)


    const snacksData = getSnacksDistribution(todayEntries)
    // Analytics: Map hourly data to 'date' key for the AreaChart (showing Today's Hourly Revenue)
    const hourlyData = getHourlyDistribution(todayEntries)
    const revenueData = hourlyData.map(d => ({
        date: d.hour,
        revenue: d.revenue,
        customers: d.customers
    }))

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
                                    snacksData={snacksData}
                                    revenueData={revenueData}
                                    hourlyData={hourlyData}
                                    overallStats={{
                                        totalRevenue,
                                        totalCustomers,
                                        totalCash,
                                        totalOnline
                                    }}
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
                                    recentEntries={recentEntries}
                                    activityTab={activityTab}
                                    setActivityTab={setActivityTab}
                                    currentTime={currentTime}
                                    openEntryDetails={openEntryDetails}
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
