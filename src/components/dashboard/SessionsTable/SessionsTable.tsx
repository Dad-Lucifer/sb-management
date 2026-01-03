import { Download, CreditCard, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerEntry } from '@/types/dashboard'
import { cn } from '@/lib/utils'

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
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-light text-white mb-1">Customer Sessions</h2>
                    <p className="text-gray-500 text-xs md:text-sm">Complete overview of all gaming sessions</p>
                </div>
                <Button
                    onClick={handleDownloadExcel}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 h-12 md:h-10 text-base md:text-sm"
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
                                    {recentEntries.map((entry) => (
                                        <tr
                                            key={entry.id}
                                            onClick={() => openEntryDetails(entry)}
                                            className="hover:bg-blue-900/10 transition-colors duration-200 cursor-pointer group"
                                        >
                                            <td className="p-4">
                                                <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{entry.customerName}</div>
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
                                                <span className="font-bold text-blue-500 text-base">₹{entry.subTotal.toFixed(0)}</span>
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
                        {recentEntries.map((entry) => (
                            <div
                                key={entry.id}
                                onClick={() => openEntryDetails(entry)}
                                className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 active:scale-[0.98] transition-all cursor-pointer hover:border-blue-500/30"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-0.5">{entry.customerName}</h3>
                                        <p className="text-xs text-gray-500 font-mono">{entry.phoneNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-blue-500">₹{entry.subTotal.toFixed(0)}</div>
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
                                                <span key={idx} className="inline-flex items-center bg-blue-900/20 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-500/10">
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
