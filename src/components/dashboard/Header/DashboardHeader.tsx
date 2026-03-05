


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


    const handleTabClick = (tab: 'dashboard' | 'table' | 'overview') => {
        if (tab !== activeTab) {
            setActiveTab(tab);
        }
    };

    return (
        <>

            <div className="border-b border-gray-900 backdrop-blur-lg bg-black/50">
                <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white/90">
                                SB <span className="font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">GAMING</span> CAFE
                            </h1>
                            <p className="text-gray-400 text-xs md:text-sm mt-1">Premium Gaming Experience</p>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-1 md:gap-2 bg-gray-900/50 rounded-full p-1 overflow-x-auto no-scrollbar max-w-full border border-gray-800">
                            {['dashboard', 'overview', 'table'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => handleTabClick(tab as any)}
                                    className={`flex-1 md:flex-none px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-300 whitespace-nowrap capitalize ${activeTab === tab
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                        }`}
                                >
                                    {tab === 'table' ? 'Table View' : tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats Bar - Only Visible in Table View */}
                    {activeTab === 'table' && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mt-4 md:mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="bg-gray-900/30 p-3 md:p-0 rounded-xl md:bg-transparent md:rounded-none text-center">
                                <div className="text-xl md:text-2xl font-bold text-white">{totalCustomers}</div>
                                <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">Customers</div>
                            </div>
                            <div className="bg-gray-900/30 p-3 md:p-0 rounded-xl md:bg-transparent md:rounded-none text-center">
                                <div className="text-xl md:text-2xl font-bold text-red-500">₹{totalRevenue.toFixed(0)}</div>
                                <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">Total Revenue</div>
                            </div>
                            <div className="bg-gray-900/30 p-3 md:p-0 rounded-xl md:bg-transparent md:rounded-none text-center">
                                <div className="text-xl md:text-2xl font-bold text-white">₹{avgSessionValue.toFixed(0)}</div>
                                <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">Avg Session</div>
                            </div>
                            <div className="bg-gray-900/30 p-3 md:p-0 rounded-xl md:bg-transparent md:rounded-none text-center">
                                <div className="text-xl md:text-2xl font-bold text-white">{totalHours.toFixed(1)}</div>
                                <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">Total Hours</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}