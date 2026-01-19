import { Download, CreditCard, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerEntry } from '@/types/dashboard'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export interface SessionsTableProps {
    recentEntries: CustomerEntry[];
    handleDownloadExcel: () => void;
    openEntryDetails: (entry: CustomerEntry) => void;
}

export function SessionsTable({
    recentEntries,
    handleDownloadExcel,
    openEntryDetails
}: SessionsTableProps) {
    const [selectedWeek, setSelectedWeek] = useState<string>('all')

    // Helper to get start of week (Monday)
    const getStartOfWeek = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }

    // Generate Week Options
    const weekOptions = useMemo(() => {
        const weeksMap = new Map<string, Date>();
        recentEntries.forEach(entry => {
            const date = new Date(entry.timestamp);
            const start = getStartOfWeek(date);
            const key = start.toISOString().split('T')[0]; // YYYY-MM-DD
            if (!weeksMap.has(key)) {
                weeksMap.set(key, start);
            }
        });

        // Convert to array and sort descending (newest first)
        return Array.from(weeksMap.entries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([key, date]) => {
                const end = new Date(date);
                end.setDate(date.getDate() + 6);
                const label = `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
                return { value: key, label };
            });
    }, [recentEntries]);

    // Filter Entries
    const filteredEntries = useMemo(() => {
        if (selectedWeek === 'all') return recentEntries;
        return recentEntries.filter(entry => {
            const date = new Date(entry.timestamp);
            const start = getStartOfWeek(date);
            return start.toISOString().split('T')[0] === selectedWeek;
        });
    }, [recentEntries, selectedWeek]);

    // Calculate Totals
    const stats = useMemo(() => {
        let cash = 0;
        let online = 0;
        filteredEntries.forEach(e => {
            if (e.paymentMode === 'online') {
                online += e.subTotal;
            } else {
                cash += e.subTotal;
            }
        });
        return { cash, online };
    }, [filteredEntries]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-light text-white mb-1">Customer Sessions</h2>
                        <p className="text-gray-500 text-xs md:text-sm">Overview of {selectedWeek === 'all' ? 'all' : 'selected week'} sessions</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                            <SelectTrigger className="w-full sm:w-[180px] bg-gray-900 border-gray-800 text-white">
                                <SelectValue placeholder="Select Week" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-800 text-white">
                                <SelectItem value="all">All Time</SelectItem>
                                {weekOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleDownloadExcel}
                            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 h-10 text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Download Excel
                        </Button>
                    </div>
                </div>

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-gray-900/40 p-3 sm:p-4 rounded-xl border border-gray-800">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Banknote className="w-3.5 h-3.5 text-green-500" />
                            Cash
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white">₹{stats.cash.toFixed(0)}</div>
                    </div>
                    <div className="bg-gray-900/40 p-3 sm:p-4 rounded-xl border border-gray-800">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                            Online
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white">₹{stats.online.toFixed(0)}</div>
                    </div>
                </div>
            </div>

            {filteredEntries.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-900/50 rounded-full flex items-center justify-center">
                        <div className="text-gray-600 text-2xl">📊</div>
                    </div>
                    <p className="text-gray-500">No data to display</p>
                    <p className="text-gray-600 text-sm mt-1">Add customers to see the table view</p>
                </div>
            ) : (
                <>
                    {/* Desktop/Tablet View */}
                    <div className="hidden md:block bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-900/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
                                    <tr>
                                        <th className="text-left p-4 font-semibold">Customer</th>
                                        <th className="text-left p-4 font-semibold">Phone</th>
                                        <th className="text-center p-4 font-semibold">Age</th>
                                        <th className="text-center p-4 font-semibold">People</th>
                                        <th className="text-center p-4 font-semibold">Duration</th>
                                        <th className="text-center p-4 font-semibold">Method</th>
                                        <th className="text-left p-4 font-semibold">Snacks</th>
                                        <th className="text-right p-4 font-semibold">Total</th>
                                        <th className="text-right p-4 font-semibold">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/50">
                                    {filteredEntries.map((entry) => (
                                        <tr
                                            key={entry.id}
                                            onClick={() => openEntryDetails(entry)}
                                            className="hover:bg-red-900/10 transition-colors duration-200 cursor-pointer group"
                                        >
                                            <td className="p-4">
                                                <div className="font-bold text-white group-hover:text-red-400 transition-colors">{entry.customerName}</div>
                                            </td>
                                            <td className="p-4 text-gray-400 font-mono text-sm">{entry.phoneNumber}</td>
                                            <td className="p-4 text-center text-gray-300">
                                                {entry.age ? (
                                                    <span className="text-xs font-semibold bg-gray-800 px-2 py-1 rounded text-gray-400">
                                                        {entry.age}
                                                    </span>
                                                ) : <span className="text-gray-600">-</span>}
                                            </td>
                                            <td className="p-4 text-center text-gray-300">
                                                <span className="inline-flex items-center justify-center bg-gray-800 rounded-md px-2 py-1 text-xs">
                                                    {entry.numberOfPeople || 1}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-gray-300">
                                                <span className="inline-flex items-center justify-center bg-gray-800 rounded-md px-2 py-1 text-xs">
                                                    {entry.duration}h
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase",
                                                    entry.paymentMode === 'online'
                                                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                        : "bg-green-500/10 text-green-400 border border-green-500/20"
                                                )}>
                                                    {entry.paymentMode === 'online' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                                                    {entry.paymentMode || 'cash'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-gray-400 max-w-[200px] truncate">
                                                    {entry.snacks.length > 0
                                                        ? entry.snacks.map(s => `${s.quantity}x ${s.name}`).join(', ')
                                                        : <span className="text-gray-600 italic">No snacks</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="font-bold text-red-500 text-base">₹{entry.subTotal.toFixed(0)}</span>
                                            </td>
                                            <td className="p-4 text-right text-gray-500 text-xs font-mono">
                                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                <br />
                                                {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {filteredEntries.map((entry) => (
                            <div
                                key={entry.id}
                                onClick={() => openEntryDetails(entry)}
                                className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 active:scale-[0.98] transition-all cursor-pointer hover:border-red-500/30"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-0.5">{entry.customerName}</h3>
                                        <p className="text-xs text-gray-500 font-mono">{entry.phoneNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-red-500">₹{entry.subTotal.toFixed(0)}</div>
                                        <div className="text-[10px] text-gray-500">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    <div className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-800">
                                        <div className="text-[10px] text-gray-500 uppercase">Dur.</div>
                                        <div className="text-sm font-semibold text-gray-300">{entry.duration}h</div>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-800">
                                        <div className="text-[10px] text-gray-500 uppercase">Ppl</div>
                                        <div className="text-sm font-semibold text-gray-300">{entry.numberOfPeople || 1}</div>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-800">
                                        <div className="text-[10px] text-gray-500 uppercase">Age</div>
                                        <div className="text-sm font-semibold text-gray-300">{entry.age || '-'}</div>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-2 flex flex-col items-center justify-center border border-gray-800">
                                        <div className="text-[10px] text-gray-500 uppercase">Paid</div>
                                        <div className="mt-1">
                                            {entry.paymentMode === 'online'
                                                ? <CreditCard className="w-4 h-4 text-blue-400" />
                                                : <Banknote className="w-4 h-4 text-green-400" />
                                            }
                                        </div>
                                    </div>
                                </div>

                                {entry.snacks.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-800/50">
                                        <div className="text-[10px] text-gray-500 uppercase mb-1.5">Snack Orders</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {entry.snacks.map((s, idx) => (
                                                <span key={idx} className="inline-flex items-center bg-red-900/20 text-red-300 text-xs px-2 py-0.5 rounded border border-red-500/10">
                                                    <span className="font-bold mr-1">{s.quantity}x</span> {s.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
