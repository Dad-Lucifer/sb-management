


export interface DashboardHeaderProps {
    activeTab: 'dashboard' | 'table' | 'overview';
    setActiveTab: (tab: 'dashboard' | 'table' | 'overview') => void;
}

export function DashboardHeader({
    activeTab,
    setActiveTab
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

                </div>
            </div>
        </>
    )
}