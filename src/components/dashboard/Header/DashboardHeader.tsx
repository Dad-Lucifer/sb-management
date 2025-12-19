
export interface DashboardHeaderProps {
    activeTab: 'dashboard' | 'table' | 'overview';
    setActiveTab: (tab: 'dashboard' | 'table' | 'overview') => void;
    totalCustomers: number;
    totalRevenue: number;
    avgSessionValue: number;
    totalHours: number;
}

export function DashboardHeader({
    activeTab,
    setActiveTab,
    totalCustomers,
    totalRevenue,
    avgSessionValue,
    totalHours
}: DashboardHeaderProps) {
    return (
        <div className="border-b border-gray-900 backdrop-blur-lg bg-black/50">
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-white">
                            THUNDER <span className="font-bold text-blue-500">GAMING</span> ZONE
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Gaming Café Management System</p>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2 bg-gray-900/50 rounded-full p-1">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'dashboard'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'overview'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('table')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === 'table'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            Table View
                        </button>
                    </div>
                </div>

                {/* Stats Bar - Only Visible in Table View */}
                {activeTab === 'table' && (
                    <div className="grid grid-cols-4 gap-6 mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">{totalCustomers}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wider">Customers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-500">₹{totalRevenue.toFixed(0)}</div>
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
                )}


            </div>
        </div>
    )
}
