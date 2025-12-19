import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerEntry } from '@/types/dashboard'

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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-light text-white mb-2">Customer Sessions</h2>
                    <p className="text-gray-500 text-sm">Complete overview of all gaming sessions</p>
                </div>
                <Button
                    onClick={handleDownloadExcel}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
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
                                        className="hover:bg-gray-900/30 transition-colors duration-200"
                                    >
                                        <td className="p-4">
                                            <div className="font-medium text-white">{entry.customerName}</div>
                                        </td>
                                        <td className="p-4 text-gray-400">{entry.phoneNumber}</td>
                                        <td className="p-4 text-gray-400">{entry.numberOfPeople || 1}</td>
                                        <td className="p-4 text-gray-400">{entry.duration}h</td>
                                        <td className="p-4 text-gray-400 capitalize">{entry.snacks.map(s => s.name).join(', ') || 'None'}</td>
                                        <td className="p-4">
                                            <span className="font-medium text-blue-500">₹{entry.subTotal.toFixed(2)}</span>
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
    )
}
