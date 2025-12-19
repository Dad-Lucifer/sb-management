import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    TrendingUp, Users, Clock, PieChart as PieChartIcon,
    BarChart2, Zap, DollarSign, Activity, Trophy, Flame
} from 'lucide-react'
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area
} from 'recharts'
import { COLORS } from '@/constants/inventory'
import { cn } from '@/lib/utils'

export interface AnalyticsOverviewProps {
    snacksData: any[];
    revenueData: any[];
    hourlyData: any[];
    overallStats: {
        totalRevenue: number;
        totalCustomers: number;
    };
}

export function AnalyticsOverview({ snacksData, revenueData, hourlyData, overallStats }: AnalyticsOverviewProps) {
    const [activeTab, setActiveTab] = useState<'revenue' | 'inventory' | 'traffic'>('revenue')

    // --- Calculated Metrics ---
    const peakHour = useMemo(() => {
        if (hourlyData.length === 0) return 'N/A'
        const peak = hourlyData.reduce((max, curr) =>
            (curr.customers > max.customers) ? curr : max
            , hourlyData[0])
        return peak.hour
    }, [hourlyData])



    const topSellingSnack = useMemo(() => {
        if (snacksData.length === 0) return 'None'
        const top = snacksData.reduce((max, curr) =>
            (curr.value > max.value) ? curr : max
            , snacksData[0])
        return top.name
    }, [snacksData])

    const hasRevenue = useMemo(() => revenueData.some(d => d.revenue > 0), [revenueData])

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header Section */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        Command Center
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                    </h2>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mt-1">Live Performance Telemetry</p>
                </div>

                {/* Minimal Tab Switcher */}
                <div className="flex p-1 bg-gray-900/80 rounded-full border border-gray-800 backdrop-blur-md">
                    <TabButton
                        active={activeTab === 'revenue'}
                        icon={DollarSign}
                        label="Revenue"
                        onClick={() => setActiveTab('revenue')}
                    />
                    <TabButton
                        active={activeTab === 'inventory'}
                        icon={PieChartIcon}
                        label="Inventory"
                        onClick={() => setActiveTab('inventory')}
                    />
                    <TabButton
                        active={activeTab === 'traffic'}
                        icon={Clock}
                        label="Traffic"
                        onClick={() => setActiveTab('traffic')}
                    />
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Revenue"
                    value={`₹${overallStats.totalRevenue.toLocaleString()}`}
                    icon={TrendingUp}
                    color="text-green-400"
                    gradient="from-green-500/20 to-green-900/5"
                    borderColor="border-green-500/20"
                />
                <StatCard
                    label="Total Guests"
                    value={overallStats.totalCustomers.toString()}
                    icon={Users}
                    color="text-blue-400"
                    gradient="from-blue-500/20 to-blue-900/5"
                    borderColor="border-blue-500/20"
                />
                <StatCard
                    label="Peak Hour"
                    value={peakHour}
                    icon={Zap}
                    color="text-yellow-400"
                    gradient="from-yellow-500/20 to-yellow-900/5"
                    borderColor="border-yellow-500/20"
                />
                <StatCard
                    label="Top Item"
                    value={topSellingSnack}
                    icon={Activity}
                    color="text-purple-400"
                    gradient="from-purple-500/20 to-purple-900/5"
                    borderColor="border-purple-500/20"
                />
            </div>

            {/* Main Visualizer Area */}
            <div className="bg-gradient-to-b from-gray-900/50 to-black/50 rounded-3xl border border-gray-800/50 backdrop-blur-xl relative overflow-hidden flex flex-col h-[500px]">
                {/* Background Glows */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

                <div className="flex-1 p-6 relative z-10">
                    <AnimatePresence mode="wait">
                        {activeTab === 'revenue' && (
                            <motion.div
                                key="revenue"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                                className="h-full flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-yellow-400" />
                                        Financial Growth
                                    </h3>
                                </div>
                                <div className="flex-1 w-full h-full min-h-0">
                                    {hasRevenue ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={revenueData}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                                <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area type="monotone" dataKey="revenue" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : <NoDataState />}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'inventory' && (
                            <motion.div
                                key="inventory"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                                className="h-full flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <PieChartIcon className="w-5 h-5 text-purple-400" />
                                        Inventory Intelligence
                                    </h3>
                                </div>

                                {snacksData.length > 0 ? (
                                    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Chart Side */}
                                        <div className="relative flex items-center justify-center h-[400px] lg:h-auto">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={snacksData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={90}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {snacksData.map((_, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-white text-3xl font-black">
                                                        {snacksData.reduce((a, b) => a + b.value, 0)}
                                                    </text>
                                                    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 text-xs uppercase tracking-widest font-bold">
                                                        Items Sold
                                                    </text>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Leaderboard Side */}
                                        <div className="overflow-y-auto pr-2 custom-scrollbar lg:max-h-[400px] h-full">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2 sticky top-0 bg-[#0c0c0c] py-2 z-10">
                                                <Trophy className="w-3 h-3 text-yellow-500" /> Top Movers
                                            </h4>
                                            <div className="space-y-3 pb-4">
                                                {[...snacksData].sort((a, b) => b.value - a.value).map((item, index) => {
                                                    const total = snacksData.reduce((acc, curr) => acc + curr.value, 0);
                                                    return (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: 20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            key={item.name}
                                                            className="bg-gray-900/40 rounded-xl p-3 flex items-center justify-between group hover:bg-gray-800 transition-all duration-300 border border-gray-800/50 hover:border-purple-500/30"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg transition-transform group-hover:scale-110",
                                                                    index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white" :
                                                                        index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white" :
                                                                            index === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white" :
                                                                                "bg-gray-800 text-gray-400"
                                                                )}>
                                                                    {index === 0 ? <Trophy className="w-4 h-4" /> :
                                                                        index < 3 ? <Flame className="w-4 h-4" /> :
                                                                            <span>#{index + 1}</span>}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{item.name}</p>
                                                                    <div className="w-32 h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
                                                                        <div
                                                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                                                            style={{
                                                                                width: `${(item.value / total) * 100}%`,
                                                                                backgroundColor: COLORS[index % COLORS.length]
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-black text-white">{item.value}</p>
                                                                <p className="text-[10px] text-gray-500 font-medium uppercase">Units</p>
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : <NoDataState />}
                            </motion.div>
                        )}

                        {activeTab === 'traffic' && (
                            <motion.div
                                key="traffic"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                                className="h-full flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-blue-400" />
                                        Peak Traffic Hours
                                    </h3>
                                </div>
                                <div className="flex-1 w-full h-full min-h-0">
                                    {hourlyData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={hourlyData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                                <XAxis dataKey="hour" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="customers" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                                    {hourlyData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.customers > 3 ? '#eab308' : '#3b82f6'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : <NoDataState />}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>

    )
}

function StatCard({ label, value, icon: Icon, color, gradient, borderColor }: any) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "relative overflow-hidden rounded-2xl border bg-gray-900/40 p-5 backdrop-blur-sm transition-all duration-300",
                borderColor
            )}
        >
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", gradient)} />
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{label}</p>
                    <Icon className={cn("w-4 h-4", color)} />
                </div>
                <div className="flex items-baseline gap-1">
                    <h4 className="text-2xl font-black text-white tracking-tight">{value}</h4>
                </div>
            </div>
        </motion.div>
    )
}

function TabButton({ active, icon: Icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300",
                active ? "text-white" : "text-gray-500 hover:text-gray-300"
            )}
        >
            {active && (
                <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-gray-800 shadow-inner rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
            )}
            <span className="relative z-10 flex items-center gap-2">
                <Icon className={cn("w-3.5 h-3.5", active ? "text-blue-400" : "text-gray-500")} />
                <span className="hidden sm:inline">{label}</span>
            </span>
        </button>
    )
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900/95 border border-gray-800 p-3 rounded-xl shadow-xl backdrop-blur-md">
                <p className="text-gray-400 text-xs font-medium mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-bold text-white">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}: <span className="text-gray-300 ml-1">{entry.value}</span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

function NoDataState() {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center opacity-50">
                <BarChart2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No Data Available</p>
                <p className="text-xs text-gray-600">Start operations to generate insights</p>
            </div>
        </div>
    )
}
