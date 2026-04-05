import { useState, useMemo, useEffect } from 'react'
import { Download, CreditCard, Banknote, Calendar, Trash2, Loader2, Activity, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerEntry } from '@/types/dashboard'
import { cn } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import * as XLSX from 'xlsx'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDocs, writeBatch, doc, setDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { checkAndArchiveOldData } from '@/lib/archiver'

export interface SessionsTableProps {
    openEntryDetails: (entry: CustomerEntry) => void;
}

export function SessionsTable({
    openEntryDetails
}: SessionsTableProps) {
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'))
    const [selectedWeek, setSelectedWeek] = useState<string>('all')
    const [paymentFilter, setPaymentFilter] = useState<string>('all')
    const [monthlyEntries, setMonthlyEntries] = useState<CustomerEntry[]>([])
    const [isDeleting, setIsDeleting] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        const [yearStr, monthStr] = selectedMonth.split('-')
        const year = parseInt(yearStr, 10)
        const month = parseInt(monthStr, 10)
        const date = new Date(year, month - 1)
        const start = startOfMonth(date)
        const end = endOfMonth(date)

        const q = query(
            collection(db, "entries"),
            where("timestamp", ">=", Timestamp.fromDate(start)),
            where("timestamp", "<=", Timestamp.fromDate(end)),
            orderBy("timestamp", "desc")
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const entries = snapshot.docs.map(document => {
                const data = document.data()
                return {
                    id: document.id,
                    ...data,
                    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp)
                } as CustomerEntry
            })
            setMonthlyEntries(entries)
        })

        return () => unsubscribe()
    }, [selectedMonth])

    const handleDeleteMonthData = async () => {
        if (!confirm(`Are you absolutely sure you want to PERMANENTLY delete all records for ${selectedMonth}? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const [yearStr, monthStr] = selectedMonth.split('-')
            const year = parseInt(yearStr, 10)
            const month = parseInt(monthStr, 10)
            const date = new Date(year, month - 1);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const q = query(
                collection(db, "entries"),
                where("timestamp", ">=", Timestamp.fromDate(start)),
                where("timestamp", "<=", Timestamp.fromDate(end))
            );

            const snapshot = await getDocs(q);
            
            const chunks = [];
            for (let i = 0; i < snapshot.docs.length; i += 490) {
                chunks.push(snapshot.docs.slice(i, i + 490));
            }

            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach((document) => {
                    batch.delete(document.ref);
                });
                await batch.commit();
            }

            try {
                const summaryBatch = writeBatch(db);
                summaryBatch.delete(doc(db, "summaries", selectedMonth));
                await summaryBatch.commit();
            } catch (summaryError: any) {
                console.error("Failed to delete summary:", summaryError);
            }

            toast({
                title: "Data Deleted",
                description: `Successfully removed ${snapshot.size} records for ${selectedMonth}.`,
                className: "bg-green-600 border-green-500 text-white"
            });
            
            setSelectedMonth(format(new Date(), 'yyyy-MM'));
        } catch (error: any) {
            console.error("Error deleting month data:", error);
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: error.message || "Something went wrong while deleting data."
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleArchiveOldData = async () => {
        if (!confirm("This will download and PERMANENTLY delete all records older than 2 months (older than last month). Do you want to proceed?")) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await checkAndArchiveOldData(2);
            if (result.status === 'success') {
                toast({
                    title: "Data Archived",
                    description: `Successfully archived and deleted ${result.count} old records.`,
                    className: "bg-blue-600 border-blue-500 text-white"
                });
            } else {
                toast({
                    title: "No Old Data",
                    description: "No records found that are older than 2 months.",
                });
            }
        } catch (error: any) {
            console.error("Archival failed:", error);
            toast({
                variant: "destructive",
                title: "Archive Failed",
                description: error.message || "Something went wrong while archiving data."
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const isCurrentMonth = useMemo(() => {
        const now = new Date();
        return selectedMonth === format(now, 'yyyy-MM');
    }, [selectedMonth]);

    const monthOptions = useMemo(() => {
        const monthsSet = new Set<string>();
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        monthsSet.add(format(firstOfMonth, 'yyyy-MM'));
        monthsSet.add(format(lastMonth, 'yyyy-MM'));

        return Array.from(monthsSet)
            .sort((a, b) => b.localeCompare(a))
            .map(monthStr => {
                const [y, m] = monthStr.split('-').map(Number);
                const date = new Date(y, m - 1);
                return {
                    value: monthStr,
                    label: format(date, 'MMMM yyyy')
                };
            });
    }, []);

    useEffect(() => {
        setSelectedWeek('all')
    }, [selectedMonth])

    const weekOptions = useMemo(() => {
        if (!isCurrentMonth) return [];
        const weeksMap = new Map<string, Date>();
        monthlyEntries.forEach((entry: CustomerEntry) => {
            const date = new Date(entry.timestamp);
            const start = startOfWeek(date, { weekStartsOn: 1 });
            const key = format(start, 'yyyy-MM-dd');
            if (!weeksMap.has(key)) {
                weeksMap.set(key, start);
            }
        });

        return Array.from(weeksMap.entries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([key, date]) => {
                const end = endOfWeek(date, { weekStartsOn: 1 });
                const label = `Week of ${format(date, 'd MMM')} - ${format(end, 'd MMM')}`;
                return { value: key, label };
            });
    }, [monthlyEntries, isCurrentMonth]);

    const filteredEntries = useMemo(() => {
        let entries = monthlyEntries;
        if (isCurrentMonth && selectedWeek !== 'all') {
            entries = entries.filter((entry: CustomerEntry) => {
                const date = new Date(entry.timestamp);
                const start = startOfWeek(date, { weekStartsOn: 1 });
                return format(start, 'yyyy-MM-dd') === selectedWeek;
            });
        }
        if (paymentFilter !== 'all') {
            entries = entries.filter((entry: CustomerEntry) => {
                const isOnline = entry.paymentMode === 'online';
                if (paymentFilter === 'online') return isOnline;
                if (paymentFilter === 'cash') return (entry.paymentMode !== 'online');
                return true;
            });
        }
        return entries;
    }, [monthlyEntries, selectedWeek, isCurrentMonth, paymentFilter]);

    const stats = useMemo(() => {
        let cash = 0;
        let online = 0;
        filteredEntries.forEach((e: CustomerEntry) => {
            if (e.splitPayment) {
                cash += Number(e.splitPayment.cashAmount) || 0;
                online += Number(e.splitPayment.onlineAmount) || 0;
            } else if (e.paymentMode === 'online') {
                online += Number(e.subTotal) || 0;
            } else {
                cash += Number(e.subTotal) || 0;
            }
        });
        return { cash, online, total: cash + online };
    }, [filteredEntries]);

    const trueStats = useMemo(() => {
        let cash = 0; let online = 0; let customers = 0; let guests = 0;
        monthlyEntries.forEach((e: CustomerEntry) => {
            customers += 1;
            guests += e.numberOfPeople || 1;
            if (e.splitPayment) {
                cash += Number(e.splitPayment.cashAmount) || 0;
                online += Number(e.splitPayment.onlineAmount) || 0;
            } else if (e.paymentMode === 'online') {
                online += Number(e.subTotal) || 0;
            } else {
                cash += Number(e.subTotal) || 0;
            }
        });
        return { cash, online, total: cash + online, customers, guests };
    }, [monthlyEntries]);

    useEffect(() => {
        if (monthlyEntries.length === 0) return;
        const healSummary = async () => {
            try {
                const summaryRef = doc(db, "summaries", selectedMonth);
                await setDoc(summaryRef, {
                    totalRevenue: trueStats.total,
                    totalCash: trueStats.cash,
                    totalOnline: trueStats.online,
                    totalCustomers: trueStats.customers,
                    totalGuests: trueStats.guests
                }, { merge: true });
            } catch (summaryHealError: any) {
                console.error("Failed to heal summary:", summaryHealError);
            }
        };
        healSummary();
    }, [trueStats, selectedMonth]);

    const handleDownloadExcel = () => {
        try {
            const data = filteredEntries.map((entry: CustomerEntry) => ({
                'Customer Name': entry.customerName,
                'Phone Number': entry.phoneNumber,
                'Age': entry.age || '-',
                'Payment Mode': entry.paymentMode || 'cash',
                'Number of People': entry.numberOfPeople || 1,
                'Duration (Hours)': entry.duration,
                'Snacks': entry.snacks.map(s => `${s.name} (x${s.quantity})`).join(', '),
                'Total Amount': entry.subTotal,
                'Date': new Date(entry.timestamp).toLocaleDateString(),
                'Time': new Date(entry.timestamp).toLocaleTimeString(),
                'Status': entry.isRenewed ? 'Renewed' : 'New'
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Sessions");
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
            const url = window.URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SB_Gaming_Sessions_${selectedMonth}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({
                title: "Download Started",
                description: `Your Excel file for ${selectedMonth} is being downloaded.`,
                className: "bg-blue-600 border-blue-500 text-white"
            })
        } catch (downloadError: any) {
            console.error("Download failed:", downloadError);
            toast({
                variant: "destructive",
                title: "Download Failed",
                description: "Could not generate Excel file.",
            })
        }
    }

    const TableSection = () => (
        <div className="hidden md:block bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto overflow-y-auto max-h-[650px]">
                <Table className="w-full relative min-w-[800px]">
                    <TableHeader className="bg-red-900/90 backdrop-blur-md border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400 sticky top-0 z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="text-left p-4 font-semibold">Customer</TableHead>
                            <TableHead className="text-left p-4 font-semibold">Phone</TableHead>
                            <TableHead className="text-center p-4 font-semibold">Age</TableHead>
                            <TableHead className="text-center p-4 font-semibold">People</TableHead>
                            <TableHead className="text-center p-4 font-semibold">Duration</TableHead>
                            <TableHead className="text-center p-4 font-semibold">Method</TableHead>
                            <TableHead className="text-left p-4 font-semibold">Snacks</TableHead>
                            <TableHead className="text-right p-4 font-semibold">Total</TableHead>
                            <TableHead className="text-right p-4 font-semibold">Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-800/50">
                        {filteredEntries.map((entry: CustomerEntry) => (
                            <TableRow
                                key={entry.id}
                                onClick={() => openEntryDetails(entry)}
                                className="hover:bg-red-900/10 transition-colors duration-200 cursor-pointer group border-b-gray-800/50"
                            >
                                <TableCell className="p-4"><div className="font-bold text-white group-hover:text-red-400 transition-colors">{entry.customerName}</div></TableCell>
                                <TableCell className="p-4 text-gray-400 font-mono text-sm">{entry.phoneNumber}</TableCell>
                                <TableCell className="p-4 text-center text-gray-300">
                                    {entry.age ? <span className="text-xs font-semibold bg-gray-800 px-2 py-1 rounded text-gray-400">{entry.age}</span> : <span className="text-gray-600">-</span>}
                                </TableCell>
                                <TableCell className="p-4 text-center text-gray-300"><span className="inline-flex items-center justify-center bg-gray-800 rounded-md px-2 py-1 text-xs">{entry.numberOfPeople || 1}</span></TableCell>
                                <TableCell className="p-4 text-center text-gray-300"><span className="inline-flex items-center justify-center bg-gray-800 rounded-md px-2 py-1 text-xs">{entry.duration}h</span></TableCell>
                                <TableCell className="p-4 text-center">
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase",
                                        entry.splitPayment ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : entry.paymentMode === 'online' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"
                                    )}>
                                        {entry.splitPayment ? <div className="flex gap-1 items-center"><Banknote className="w-3 h-3" />/<CreditCard className="w-3 h-3" />Split</div> : <div className="flex gap-1 items-center">{entry.paymentMode === 'online' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}{entry.paymentMode || 'cash'}</div>}
                                    </div>
                                </TableCell>
                                <TableCell className="p-4"><div className="text-sm text-gray-400 max-w-[200px] truncate">{entry.snacks.length > 0 ? entry.snacks.map(s => `${s.quantity}x ${s.name}`).join(', ') : <span className="text-gray-600 italic">No snacks</span>}</div></TableCell>
                                <TableCell className="p-4 text-right"><span className="font-bold text-red-500 text-base">₹{entry.subTotal.toFixed(0)}</span></TableCell>
                                <TableCell className="p-4 text-right text-gray-500 text-xs font-mono">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br />{new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );

    const MobileSection = () => (
        <div className="md:hidden space-y-3 overflow-y-auto max-h-[650px] pr-2 pb-4">
            {filteredEntries.map((entry: CustomerEntry) => (
                <div
                    key={entry.id}
                    onClick={() => openEntryDetails(entry)}
                    className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 active:scale-[0.98] transition-all cursor-pointer hover:border-red-500/30"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div><h3 className="text-lg font-bold text-white mb-0.5">{entry.customerName}</h3><p className="text-xs text-gray-500 font-mono">{entry.phoneNumber}</p></div>
                        <div className="text-right"><div className="text-xl font-black text-red-500">₹{entry.subTotal.toFixed(0)}</div><div className="text-[10px] text-gray-500">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-800"><div className="text-[10px] text-gray-500 uppercase">Dur.</div><div className="text-sm font-semibold text-gray-300">{entry.duration}h</div></div>
                        <div className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-800"><div className="text-[10px] text-gray-500 uppercase">Ppl</div><div className="text-sm font-semibold text-gray-300">{entry.numberOfPeople || 1}</div></div>
                        <div className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-800"><div className="text-[10px] text-gray-500 uppercase">Age</div><div className="text-sm font-semibold text-gray-300">{entry.age || '-'}</div></div>
                        <div className="bg-gray-800/50 rounded-lg p-2 flex flex-col items-center justify-center border border-gray-800"><div className="text-[10px] text-gray-500 uppercase">Paid</div><div className="mt-1">{entry.splitPayment ? <div className="flex gap-1"><Banknote className="w-4 h-4 text-green-400" /><CreditCard className="w-4 h-4 text-blue-400" /></div> : entry.paymentMode === 'online' ? <CreditCard className="w-4 h-4 text-blue-400" /> : <Banknote className="w-4 h-4 text-green-400" />}</div></div>
                    </div>
                    {entry.snacks.length > 0 && (<div className="mt-3 pt-3 border-t border-gray-800/50"><div className="text-[10px] text-gray-500 uppercase mb-1.5">Snack Orders</div><div className="flex flex-wrap gap-1.5">{entry.snacks.map((s, idx) => (<span key={idx} className="inline-flex items-center bg-red-900/20 text-red-300 text-xs px-2 py-0.5 rounded border border-red-500/10"><span className="font-bold mr-1">{s.quantity}x</span> {s.name}</span>))}</div></div>)}
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-light text-white mb-1">Customer Sessions</h2>
                        <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>
                                {monthOptions.find(opt => opt.value === selectedMonth)?.label || selectedMonth}
                            </span>
                            {!isCurrentMonth && <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Archived</span>}
                            {isCurrentMonth && selectedWeek !== 'all' && (
                                <>
                                    <span>•</span>
                                    <span>Selected Week</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full sm:w-[180px] bg-gray-900 border-gray-800 text-white">
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-800 text-white">
                                {monthOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {isCurrentMonth && (
                            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                                <SelectTrigger className="w-full sm:w-[180px] bg-gray-900 border-gray-800 text-white">
                                    <SelectValue placeholder="Select Week" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                                    <SelectItem value="all">Current Month (All)</SelectItem>
                                    {weekOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                            <SelectTrigger className="w-full sm:w-[140px] bg-gray-900 border-gray-800 text-white">
                                <SelectValue placeholder="Payment" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-800 text-white">
                                <SelectItem value="all">All Methods</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                            </SelectContent>
                        </Select>

                        {!isCurrentMonth && (
                            <Button
                                onClick={handleDeleteMonthData}
                                disabled={isDeleting}
                                className="w-full md:w-auto bg-gray-900 border border-red-900/50 hover:bg-red-950 text-red-500 flex items-center justify-center gap-2 h-10 text-sm"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {isDeleting ? "Processing..." : "Delete Month Data"}
                            </Button>
                        )}

                        {isCurrentMonth && (
                            <Button
                                onClick={handleArchiveOldData}
                                disabled={isDeleting}
                                className="w-full md:w-auto bg-gray-900 border border-blue-900/50 hover:bg-blue-950 text-blue-500 flex items-center justify-center gap-2 h-10 text-sm"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                                {isDeleting ? "Archiving..." : "Archive Old Data (>2 Mo.)"}
                            </Button>
                        )}

                        <Button
                            onClick={handleDownloadExcel}
                            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 h-10 text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Download Excel
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
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
                    <div className="bg-gradient-to-br from-red-600/20 to-orange-600/10 p-3 sm:p-4 rounded-xl border border-red-500/20">
                        <div className="text-xs text-red-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" />
                            Total Revenue
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-red-500">₹{stats.total.toFixed(0)}</div>
                    </div>
                </div>
            </div>

            {filteredEntries.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-900/50 rounded-full flex items-center justify-center">
                        <div className="text-gray-600 text-2xl">📊</div>
                    </div>
                    <p className="text-gray-500">No data for this period</p>
                </div>
            ) : (
                <>
                    <TableSection />
                    <MobileSection />
                </>
            )}
        </div>
    )
}
