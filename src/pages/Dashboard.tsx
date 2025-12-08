import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Phone, Clock, Coffee, Sparkles, Zap, Trophy, Gamepad2, ChevronDown, AlertTriangle, Timer, RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { db } from '@/lib/firebase'
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { checkAndArchiveOldData } from '@/lib/archiver'
import * as XLSX from 'xlsx'
import { sendSMS } from '@/lib/sms'

interface CustomerEntry {
    id: string
    customerName: string
    phoneNumber: string
    numberOfPeople: number
    duration: number
    snacks: string[]
    subTotal: number
    timestamp: Date
    isRenewed?: boolean
    smsSent?: boolean
}

const PER_PERSON_RATE = 60
const SNACKS_PRICES: { [key: string]: number } = {
    soda: 50,
    chips: 40,
    sandwich: 120,
    combo: 200
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280']

export default function GamingCafeDashboard() {
    const [customerName, setCustomerName] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [numberOfPeople, setNumberOfPeople] = useState('1')
    const [duration, setDuration] = useState('')
    const [snacks, setSnacks] = useState<string[]>([])
    const [recentEntries, setRecentEntries] = useState<CustomerEntry[]>([])
    const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'overview'>('dashboard')
    const [isAnimating, setIsAnimating] = useState(false)
    const [focusedField, setFocusedField] = useState<string | null>(null)
    const [selectedEntry, setSelectedEntry] = useState<CustomerEntry | null>(null)
    const [editDuration, setEditDuration] = useState('')
    const [editNumberOfPeople, setEditNumberOfPeople] = useState('1')
    const [editSnacks, setEditSnacks] = useState<string[]>([])
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
            const entries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp instanceof Timestamp ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
            })) as CustomerEntry[]
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
                        const message = `Thank You ${entry.customerName || "Valued Customer"} for Visiting - Thunder Gaming Cafe\nWe hope to see you soon!\n[${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}]`
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
        const snacksPrice = snacks.reduce((total, snack) => total + (SNACKS_PRICES[snack] || 0), 0)
        return (durationNum * peopleNum * PER_PERSON_RATE) + snacksPrice
    }

    const calculateEditSubTotal = () => {
        const durationNum = parseFloat(editDuration) || 0
        const peopleNum = parseInt(editNumberOfPeople) || 1
        const snacksPrice = editSnacks.reduce((total, snack) => total + (SNACKS_PRICES[snack] || 0), 0)
        return (durationNum * peopleNum * PER_PERSON_RATE) + snacksPrice
    }

    const handleSnackToggle = (value: string) => {
        setSnacks(prev =>
            prev.includes(value)
                ? prev.filter(item => item !== value)
                : [...prev, value]
        )
    }

    const handleEditSnackToggle = (value: string) => {
        setEditSnacks(prev =>
            prev.includes(value)
                ? prev.filter(item => item !== value)
                : [...prev, value]
        )
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
                snacks,
                subTotal: calculateSubTotal(),
                timestamp: Timestamp.now(),
                isRenewed: false,
                smsSent: false
            })

            setTimeout(() => {
                setCustomerName('')
                setPhoneNumber('')
                setNumberOfPeople('1')
                setDuration('')
                setSnacks([])
                setIsAnimating(false)
                toast({
                    title: "Session Started",
                    description: `Added ${customerName} to active sessions.`,
                    className: "bg-green-500 border-green-600 text-white"
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
        setEditDuration(entry.duration.toString())
        setEditNumberOfPeople((entry.numberOfPeople || 1).toString())
        setEditSnacks(entry.snacks)
    }

    const closeEntryDetails = () => {
        setSelectedEntry(null)
        setEditDuration('')
        setEditNumberOfPeople('1')
        setEditSnacks([])
    }

    const saveEntryChanges = async () => {
        if (!selectedEntry || !editDuration) return

        const newDuration = parseFloat(editDuration)
        const newPeople = parseInt(editNumberOfPeople) || 1
        const isRenewed = newDuration > selectedEntry.duration

        try {
            const entryRef = doc(db, "entries", selectedEntry.id)
            await updateDoc(entryRef, {
                duration: newDuration,
                numberOfPeople: newPeople,
                snacks: editSnacks,
                subTotal: calculateEditSubTotal(),
                isRenewed: selectedEntry.isRenewed || isRenewed
            })
            closeEntryDetails()
            toast({
                title: "Session Updated",
                description: "Customer details have been saved.",
                className: "bg-green-500 border-green-600 text-white"
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
    const getSnacksDistribution = () => {
        const distribution: { [key: string]: number } = {}
        recentEntries.forEach(entry => {
            if (entry.snacks.length === 0) {
                distribution['No Snacks'] = (distribution['No Snacks'] || 0) + 1
            } else {
                entry.snacks.forEach(snack => {
                    const snackName = snack.charAt(0).toUpperCase() + snack.slice(1)
                    distribution[snackName] = (distribution[snackName] || 0) + 1
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

    const getHourlyDistribution = () => {
        const hourlyData: { [key: string]: { customers: number; revenue: number } } = {}

        for (let i = 0; i < 24; i++) {
            hourlyData[i] = { customers: 0, revenue: 0 }
        }

        recentEntries.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours()
            hourlyData[hour].customers += 1
            hourlyData[hour].revenue += entry.subTotal
        })

        return Object.entries(hourlyData).map(([hour, data]) => ({
            hour: `${hour}:00`,
            customers: data.customers,
            revenue: data.revenue
        })).filter(item => item.customers > 0)
    }

    // Filter for today's entries for the stats bar
    const startOfToday = new Date(currentTime)
    startOfToday.setHours(0, 0, 0, 0)

    const todayEntries = recentEntries.filter(entry => {
        return new Date(entry.timestamp) >= startOfToday
    })

    // Use lifetime data (recentEntries) for Table View and Overview, otherwise use today's data
    const statsEntries = (activeTab === 'table' || activeTab === 'overview') ? recentEntries : todayEntries

    const totalRevenue = statsEntries.reduce((sum, entry) => sum + entry.subTotal, 0)
    const totalCustomers = statsEntries.length
    const avgSessionValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
    const totalHours = statsEntries.reduce((sum, entry) => sum + entry.duration, 0)

    const snacksData = getSnacksDistribution()
    const revenueData = getRevenueData()
    const hourlyData = getHourlyDistribution()

    const handleDownloadExcel = () => {
        try {
            const data = recentEntries.map(entry => ({
                'Customer Name': entry.customerName,
                'Phone Number': entry.phoneNumber,
                'Number of People': entry.numberOfPeople || 1,
                'Duration (Hours)': entry.duration,
                'Snacks': entry.snacks.join(', '),
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
            link.setAttribute('download', `Cafe_Sessions_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Download Started",
                description: "Your Excel file is being downloaded.",
                className: "bg-green-500 border-green-600 text-white"
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
        <div className="min-h-screen bg-black text-white">
            {/* Background Pattern */}
            <div className="fixed inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, #ff0000 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #ff0000 0%, transparent 50%)`
                }}></div>
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="border-b border-gray-900 backdrop-blur-lg bg-black/50">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-light tracking-tight text-white">
                                    THUNDER <span className="font-bold text-red-500">GAMING</span> ZONE
                                </h1>
                                <p className="text-gray-400 text-sm mt-1">Gaming Café Management System</p>
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center gap-2 bg-gray-900/50 rounded-full p-1">
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'dashboard'
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                        }`}
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'overview'
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('table')}
                                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'table'
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                        }`}
                                >
                                    Table View
                                </button>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="grid grid-cols-4 gap-6 mt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{totalCustomers}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Customers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-500">₹{totalRevenue.toFixed(0)}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Revenue</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">₹{avgSessionValue.toFixed(0)}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Avg Session</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{totalHours.toFixed(1)}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Hours</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {activeTab === 'overview' ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-light text-white mb-2 flex items-center gap-2">
                                        Analytics Overview
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                    </h2>
                                    <p className="text-gray-500 text-sm">Real-time visual insights into your gaming café performance</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Snacks Distribution Pie Chart */}
                                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                                    <Card className="bg-gray-900/40 border-gray-800 backdrop-blur-sm hover:border-red-500/30 transition-colors duration-300">
                                        <CardHeader>
                                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                                <Coffee className="w-5 h-5 text-purple-500" />
                                                Snacks Distribution
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {snacksData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <PieChart>
                                                        <Pie
                                                            data={snacksData}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                            outerRadius={80}
                                                            dataKey="value"
                                                        >
                                                            {snacksData.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" strokeWidth={2} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                                                            itemStyle={{ color: '#fff' }}
                                                        />
                                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-[300px] flex items-center justify-center">
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="text-center"
                                                    >
                                                        <div className="text-gray-600 text-5xl mb-4 animate-bounce">📊</div>
                                                        <p className="text-gray-500 font-medium">No data available</p>
                                                        <p className="text-gray-600 text-sm mt-1">Add customers to unlock insights</p>
                                                    </motion.div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>

                                {/* Revenue Trend Bar Chart */}
                                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                                    <Card className="bg-gray-900/40 border-gray-800 backdrop-blur-sm hover:border-green-500/30 transition-colors duration-300">
                                        <CardHeader>
                                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                                <Trophy className="w-5 h-5 text-green-500" />
                                                Revenue Trend (Last 7 Days)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {revenueData.some(data => data.revenue > 0) ? (
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={revenueData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                                        <XAxis
                                                            dataKey="date"
                                                            stroke="#9ca3af"
                                                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            stroke="#9ca3af"
                                                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tickFormatter={(value) => `₹${value}`}
                                                        />
                                                        <Tooltip
                                                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                                            contentStyle={{
                                                                backgroundColor: '#1f2937',
                                                                border: '1px solid #374151',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                            }}
                                                            labelStyle={{ color: '#f3f4f6', fontWeight: 'bold', marginBottom: '4px' }}
                                                        />
                                                        <Legend />
                                                        <Bar dataKey="revenue" fill="#ef4444" name="Revenue (₹)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                                        <Bar dataKey="customers" fill="#3b82f6" name="Customers" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-[300px] flex items-center justify-center">
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="text-center"
                                                    >
                                                        <div className="text-gray-600 text-5xl mb-4 animate-pulse">📈</div>
                                                        <p className="text-gray-500 font-medium">No revenue data</p>
                                                        <p className="text-gray-600 text-sm mt-1">Start earning to see trends</p>
                                                    </motion.div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* Hourly Distribution */}
                            <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}>
                                <Card className="bg-gray-900/40 border-gray-800 backdrop-blur-sm hover:border-blue-500/30 transition-colors duration-300">
                                    <CardHeader>
                                        <CardTitle className="text-white text-lg flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-blue-500" />
                                            Peak Hours Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {hourlyData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={hourlyData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                                    <XAxis
                                                        dataKey="hour"
                                                        stroke="#9ca3af"
                                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        stroke="#9ca3af"
                                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                                        contentStyle={{
                                                            backgroundColor: '#1f2937',
                                                            border: '1px solid #374151',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                        labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
                                                    />
                                                    <Legend />
                                                    <Bar dataKey="customers" fill="#8b5cf6" name="Customers" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                    <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-[300px] flex items-center justify-center">
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-center"
                                                >
                                                    <div className="text-gray-600 text-5xl mb-4 animate-spin-slow">⏰</div>
                                                    <p className="text-gray-500 font-medium">No hourly data</p>
                                                    <p className="text-gray-600 text-sm mt-1">Track peak hours automatically</p>
                                                </motion.div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>
                    ) : activeTab === 'dashboard' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Entry Form */}
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 bg-red-500/10 rounded-lg">
                                            <Gamepad2 className="w-6 h-6 text-red-500" />
                                        </div>
                                        <h2 className="text-xl font-light text-white">New Player Entry</h2>
                                    </div>
                                    <p className="text-gray-500 text-sm">Initialize a new gaming session</p>
                                </div>

                                <div id="entry-form" className="space-y-5 relative">
                                    {/* XP Progress Bar */}
                                    <div className="absolute -top-5 left-0 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                                            initial={{ width: "0%" }}
                                            animate={{
                                                width: `${((customerName ? 20 : 0) + (phoneNumber ? 20 : 0) + (numberOfPeople ? 20 : 0) + (duration ? 20 : 0) + (snacks.length > 0 ? 20 : 0))}%`
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="customerName" className="text-gray-400 text-sm font-medium flex items-center gap-2">
                                            <User className="w-4 h-4 text-red-500" />
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
                                                className={`bg-gray-900/50 border-gray-800 text-white placeholder-gray-600 rounded-lg pl-10 transition-all duration-300 ${focusedField === 'customerName' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'group-hover:border-gray-700'
                                                    } focus:border-red-500 focus:ring-0`}
                                            />
                                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'customerName' ? 'text-red-500' : 'text-gray-600'}`}>
                                                <User className="w-4 h-4" />
                                            </div>
                                            {customerName && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber" className="text-gray-400 text-sm font-medium flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-red-500" />
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
                                                className={`bg-gray-900/50 border-gray-800 text-white placeholder-gray-600 rounded-lg pl-20 transition-all duration-300 ${focusedField === 'phoneNumber' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'group-hover:border-gray-700'
                                                    } focus:border-red-500 focus:ring-0`}
                                            />
                                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'phoneNumber' ? 'text-red-500' : 'text-gray-600'}`}>
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <div className={`absolute left-9 top-1/2 -translate-y-1/2 font-medium transition-colors duration-300 ${focusedField === 'phoneNumber' ? 'text-red-500' : 'text-gray-500'}`}>
                                                +91
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="numberOfPeople" className="text-gray-400 text-sm font-medium flex items-center gap-2">
                                            <User className="w-4 h-4 text-red-500" />
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
                                                className={`bg-gray-900/50 border-gray-800 text-white placeholder-gray-600 rounded-lg pl-10 transition-all duration-300 ${focusedField === 'numberOfPeople' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'group-hover:border-gray-700'
                                                    } focus:border-red-500 focus:ring-0`}
                                            />
                                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'numberOfPeople' ? 'text-red-500' : 'text-gray-600'}`}>
                                                <User className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="duration" className="text-gray-400 text-sm font-medium flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-red-500" />
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
                                                    className={`bg-gray-900/50 border-gray-800 text-white placeholder-gray-600 rounded-lg pl-10 transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${focusedField === 'duration' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'group-hover:border-gray-700'
                                                        } focus:border-red-500 focus:ring-0`}
                                                />
                                                <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'duration' ? 'text-red-500' : 'text-gray-600'}`}>
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-gray-400 text-sm font-medium flex items-center gap-2">
                                                <Coffee className="w-4 h-4 text-red-500" />
                                                Power-ups
                                            </Label>
                                            <div className="relative">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={`w-full justify-between bg-gray-900/50 border-gray-800 text-white hover:bg-gray-900 hover:text-white pl-3 h-10 ${focusedField === 'snacks' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''}`}
                                                            onFocus={() => setFocusedField('snacks')}
                                                            onBlur={() => setFocusedField(null)}
                                                        >
                                                            <span className="truncate">
                                                                {snacks.length === 0 ? "Select Power-ups" : snacks.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}
                                                            </span>
                                                            <ChevronDown className="w-4 h-4 opacity-50" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800 text-white">
                                                        <DropdownMenuCheckboxItem
                                                            checked={snacks.includes('soda')}
                                                            onCheckedChange={() => handleSnackToggle('soda')}
                                                            className="focus:bg-red-500/20 focus:text-white"
                                                        >
                                                            Energy Potion (Soda) - ₹50
                                                        </DropdownMenuCheckboxItem>
                                                        <DropdownMenuCheckboxItem
                                                            checked={snacks.includes('chips')}
                                                            onCheckedChange={() => handleSnackToggle('chips')}
                                                            className="focus:bg-red-500/20 focus:text-white"
                                                        >
                                                            Crunchy Loot (Chips) - ₹40
                                                        </DropdownMenuCheckboxItem>
                                                        <DropdownMenuCheckboxItem
                                                            checked={snacks.includes('sandwich')}
                                                            onCheckedChange={() => handleSnackToggle('sandwich')}
                                                            className="focus:bg-red-500/20 focus:text-white"
                                                        >
                                                            Health Pack (Sandwich) - ₹120
                                                        </DropdownMenuCheckboxItem>
                                                        <DropdownMenuCheckboxItem
                                                            checked={snacks.includes('combo')}
                                                            onCheckedChange={() => handleSnackToggle('combo')}
                                                            className="focus:bg-red-500/20 focus:text-white"
                                                        >
                                                            Ultimate Combo - ₹200
                                                        </DropdownMenuCheckboxItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sub-Total Display */}
                                    <motion.div
                                        className="bg-gradient-to-r from-red-900/20 to-black border border-red-500/20 rounded-xl p-6 relative overflow-hidden group"
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors duration-300"></div>
                                        <div className="flex items-center justify-between relative z-10">
                                            <div>
                                                <div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                                    Total Loot Value
                                                </div>
                                                <div className="text-3xl font-bold text-white flex items-baseline gap-1">
                                                    <span className="text-red-500">₹</span>
                                                    {calculateSubTotal().toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                                    <Zap className="w-3 h-3" />
                                                    Gaming: ₹{((parseFloat(duration) || 0) * (parseInt(numberOfPeople) || 1) * PER_PERSON_RATE).toFixed(2)}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                                    <Coffee className="w-3 h-3" />
                                                    Snacks: ₹{snacks.reduce((total, s) => total + (SNACKS_PRICES[s] || 0), 0).toFixed(2)}
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
                                            className={`w-full py-6 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-lg shadow-red-500/25 relative overflow-hidden group ${isAnimating ? 'opacity-70 cursor-not-allowed' : ''
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

                            {/* Recent Entries */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-light text-white mb-2">Recent Activity</h2>
                                        <p className="text-gray-500 text-sm">Latest gaming sessions - Click to view details</p>
                                    </div>
                                    <div className="flex bg-gray-900/50 p-1 rounded-lg">
                                        <button
                                            onClick={() => setActivityTab('ongoing')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activityTab === 'ongoing'
                                                ? 'bg-gray-800 text-white shadow-lg'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            Ongoing
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activityTab === 'ongoing' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-500'}`}>
                                                {recentEntries.filter(entry => {
                                                    const startTime = new Date(entry.timestamp).getTime()
                                                    const durationMs = entry.duration * 60 * 60 * 1000
                                                    const endTime = startTime + durationMs
                                                    return endTime > currentTime.getTime()
                                                }).length}
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setActivityTab('completed')}
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activityTab === 'completed'
                                                ? 'bg-gray-800 text-white shadow-lg'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            Completed
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activityTab === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                                {recentEntries.filter(entry => {
                                                    const startTime = new Date(entry.timestamp).getTime()
                                                    const durationMs = entry.duration * 60 * 60 * 1000
                                                    const endTime = startTime + durationMs
                                                    return endTime <= currentTime.getTime()
                                                }).length}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <ScrollArea className="h-[600px]">
                                    {(() => {
                                        const filteredEntries = recentEntries.filter(entry => {
                                            const startTime = new Date(entry.timestamp).getTime()
                                            const durationMs = entry.duration * 60 * 60 * 1000
                                            const endTime = startTime + durationMs
                                            const isExpired = endTime <= currentTime.getTime()
                                            return activityTab === 'completed' ? isExpired : !isExpired
                                        })

                                        if (filteredEntries.length === 0) {
                                            return (
                                                <div className="text-center py-16">
                                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-900/50 rounded-full flex items-center justify-center">
                                                        <div className="text-gray-600 text-2xl">🎮</div>
                                                    </div>
                                                    <p className="text-gray-500">No {activityTab} sessions</p>
                                                    <p className="text-gray-600 text-sm mt-1">
                                                        {activityTab === 'ongoing' ? 'Start a new session to see it here' : 'Completed sessions will appear here'}
                                                    </p>
                                                </div>
                                            )
                                        }

                                        return (
                                            <div className="space-y-3">
                                                {filteredEntries.map((entry) => {
                                                    // Timer Logic
                                                    const startTime = new Date(entry.timestamp).getTime()
                                                    const durationMs = entry.duration * 60 * 60 * 1000
                                                    const endTime = startTime + durationMs
                                                    const now = currentTime.getTime()
                                                    const remaining = Math.max(0, endTime - now)
                                                    const isWarning = remaining > 0 && remaining <= 300000 // 5 minutes
                                                    const isExpired = remaining <= 0

                                                    // Format time
                                                    const h = Math.floor(remaining / (1000 * 60 * 60))
                                                    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
                                                    const s = Math.floor((remaining % (1000 * 60)) / 1000)
                                                    const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`

                                                    // Progress
                                                    const progress = Math.min(100, Math.max(0, (remaining / durationMs) * 100))

                                                    return (
                                                        <div
                                                            key={entry.id}
                                                            onClick={() => openEntryDetails(entry)}
                                                            className={`bg-gray-900/30 border border-gray-800 rounded-xl p-5 hover:bg-gray-900/50 transition-all duration-300 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5 cursor-pointer relative overflow-hidden group ${isWarning ? 'border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)] animate-pulse' : ''
                                                                } ${isExpired ? 'border-gray-800 opacity-60' : ''}`}
                                                        >
                                                            {/* Progress Bar Background */}
                                                            <div className="absolute bottom-0 left-0 h-0.5 bg-gray-800 w-full">
                                                                <div
                                                                    className={`h-full transition-all duration-1000 ${isWarning ? 'bg-yellow-400' : isExpired ? 'bg-gray-600' : 'bg-red-500'
                                                                        }`}
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>

                                                            <div className="flex items-start justify-between mb-3 relative z-10">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <h3 className="text-lg font-medium text-white">{entry.customerName}</h3>
                                                                        {entry.isRenewed && (
                                                                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0 h-5 gap-1">
                                                                                <RefreshCw className="w-3 h-3" />
                                                                                RENEWED
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-gray-500 text-sm flex items-center gap-2">
                                                                        {entry.phoneNumber} • {entry.numberOfPeople || 1} Person{entry.numberOfPeople !== 1 ? 's' : ''}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className={`text-2xl font-mono font-bold tracking-wider ${isWarning ? 'text-yellow-400' : isExpired ? 'text-gray-500' : 'text-red-500'
                                                                        }`}>
                                                                        {timeString}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                                                        {isExpired ? 'Session Ended' : isWarning ? (
                                                                            <span className="text-yellow-400 flex items-center gap-1 font-bold">
                                                                                <AlertTriangle className="w-3 h-3" />
                                                                                Expiring Soon
                                                                            </span>
                                                                        ) : (
                                                                            <span className="flex items-center gap-1">
                                                                                <Timer className="w-3 h-3" />
                                                                                Remaining
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between relative z-10">
                                                                <div className="flex items-center gap-4 text-sm">
                                                                    <span className="text-gray-400 flex items-center gap-1">
                                                                        <Coffee className="w-3 h-3" />
                                                                        {entry.snacks.length === 0 ? 'No snacks' : `${entry.snacks.length} items`}
                                                                    </span>
                                                                    <span className="text-gray-600">•</span>
                                                                    <span className="text-gray-500 text-xs">
                                                                        Started {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <div className="text-white font-medium">
                                                                    ₹{entry.subTotal.toFixed(2)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )
                                    })()}
                                </ScrollArea>
                            </div>
                        </div>
                    ) : (
                        /* Table View */
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-light text-white mb-2">Customer Sessions</h2>
                                    <p className="text-gray-500 text-sm">Complete overview of all gaming sessions - Click to view details</p>
                                </div>
                                <Button
                                    onClick={handleDownloadExcel}
                                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Excel
                                </Button>
                            </div>

                            {recentEntries.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-900/50 rounded-full flex items-center justify-center">
                                        <div className="text-gray-600 text-2xl">📊</div>
                                    </div>
                                    <p className="text-gray-500">No data to display</p>
                                    <p className="text-gray-600 text-sm mt-1">Add customers to see the table view</p>
                                </div>
                            ) : (
                                <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-900/50 border-b border-gray-800">
                                                <tr>
                                                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Customer</th>
                                                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Phone</th>
                                                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">People</th>
                                                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Duration</th>
                                                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Snacks</th>
                                                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Total</th>
                                                    <th className="text-left p-4 text-gray-400 font-medium text-sm uppercase tracking-wider">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                                {recentEntries.map((entry) => (
                                                    <tr
                                                        key={entry.id}
                                                        onClick={() => openEntryDetails(entry)}
                                                        className="hover:bg-gray-900/30 transition-colors duration-200 cursor-pointer"
                                                    >
                                                        <td className="p-4">
                                                            <div className="font-medium text-white">{entry.customerName}</div>
                                                        </td>
                                                        <td className="p-4 text-gray-400">{entry.phoneNumber}</td>
                                                        <td className="p-4 text-gray-400">{entry.numberOfPeople || 1}</td>
                                                        <td className="p-4 text-gray-400">{entry.duration}h</td>
                                                        <td className="p-4 text-gray-400 capitalize">{entry.snacks.join(', ') || 'None'}</td>
                                                        <td className="p-4">
                                                            <span className="font-medium text-red-500">₹{entry.subTotal.toFixed(2)}</span>
                                                        </td>
                                                        <td className="p-4 text-gray-500 text-sm">
                                                            {entry.timestamp.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Entry Details Modal */}
            <Dialog open={!!selectedEntry} onOpenChange={closeEntryDetails}>
                <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-light text-white">
                            Customer Details - {selectedEntry?.customerName}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedEntry && (
                        <div className="space-y-6">
                            {/* Customer Info */}
                            <div className="bg-gray-800/50 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-400 text-sm">Customer Name</Label>
                                        <div className="text-white font-medium">{selectedEntry.customerName}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-400 text-sm">Phone Number</Label>
                                        <div className="text-white font-medium">{selectedEntry.phoneNumber}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Editable Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="editDuration" className="text-gray-400 text-sm font-medium">Duration (hours)</Label>
                                    <Input
                                        id="editDuration"
                                        type="number"
                                        step="0.5"
                                        value={editDuration}
                                        onChange={(e) => setEditDuration(e.target.value)}
                                        className="bg-gray-800 border-gray-700 text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="editNumberOfPeople" className="text-gray-400 text-sm font-medium">Number of People</Label>
                                    <Input
                                        id="editNumberOfPeople"
                                        type="number"
                                        min="1"
                                        value={editNumberOfPeople}
                                        onChange={(e) => setEditNumberOfPeople(e.target.value)}
                                        className="bg-gray-800 border-gray-700 text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-400 text-sm font-medium">Snacks</Label>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                                            >
                                                <span className="truncate">
                                                    {editSnacks.length === 0 ? "Select Power-ups" : editSnacks.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}
                                                </span>
                                                <ChevronDown className="w-4 h-4 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 text-white">
                                            <DropdownMenuCheckboxItem
                                                checked={editSnacks.includes('soda')}
                                                onCheckedChange={() => handleEditSnackToggle('soda')}
                                                className="focus:bg-red-500/20 focus:text-white"
                                            >
                                                Energy Potion (Soda) - ₹50
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuCheckboxItem
                                                checked={editSnacks.includes('chips')}
                                                onCheckedChange={() => handleEditSnackToggle('chips')}
                                                className="focus:bg-red-500/20 focus:text-white"
                                            >
                                                Crunchy Loot (Chips) - ₹40
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuCheckboxItem
                                                checked={editSnacks.includes('sandwich')}
                                                onCheckedChange={() => handleEditSnackToggle('sandwich')}
                                                className="focus:bg-red-500/20 focus:text-white"
                                            >
                                                Health Pack (Sandwich) - ₹120
                                            </DropdownMenuCheckboxItem>
                                            <DropdownMenuCheckboxItem
                                                checked={editSnacks.includes('combo')}
                                                onCheckedChange={() => handleEditSnackToggle('combo')}
                                                className="focus:bg-red-500/20 focus:text-white"
                                            >
                                                Ultimate Combo - ₹200
                                            </DropdownMenuCheckboxItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Updated Price Display */}
                            <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Gaming ({parseFloat(editDuration) || 0}h × {parseInt(editNumberOfPeople) || 1}p × ₹{PER_PERSON_RATE})</span>
                                        <span className="text-white">₹{((parseFloat(editDuration) || 0) * (parseInt(editNumberOfPeople) || 1) * PER_PERSON_RATE).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Snacks</span>
                                        <span className="text-white">₹{editSnacks.reduce((total, s) => total + (SNACKS_PRICES[s] || 0), 0).toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-gray-700 pt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-medium text-white">Total Amount</span>
                                            <span className="text-2xl font-bold text-red-500">
                                                ₹{calculateEditSubTotal().toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-3">
                        <Button
                            variant="outline"
                            onClick={closeEntryDetails}
                            className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveEntryChanges}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
