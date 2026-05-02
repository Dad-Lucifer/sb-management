


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

            <div className="border-b border-yellow-600/30 bg-[#1a0505]/90 backdrop-blur-xl sticky top-0 z-40 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 md:py-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl md:text-4xl font-cinzel font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#FFF2CD] via-[#FFD700] to-[#B8860B] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                    SB Gaming Cafe
                                </h1>
                                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 bg-[#2A0800] border border-yellow-500/40 rounded-full shadow-[inset_0_0_8px_rgba(255,215,0,0.2)]">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
                                    <span className="text-[9px] font-bold tracking-widest text-yellow-500 uppercase">VIP_ACTIVE</span>
                                </div>
                            </div>
                            <p className="text-yellow-600/70 text-[11px] font-semibold uppercase tracking-[0.3em] mt-1">Exclusive Premium Access</p>
                        </div>

                        {/* Navigation - VIP Cards */}
                        <div className="flex items-center gap-2 bg-[#2A0800] p-1.5 border border-yellow-900/50 rounded-xl shadow-inner overflow-x-auto no-scrollbar max-w-full">
                            {['dashboard', 'overview', 'table'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => handleTabClick(tab as any)}
                                    className={`relative flex-1 md:flex-none px-6 py-2 md:py-2.5 text-xs md:text-sm font-semibold uppercase tracking-widest transition-all duration-500 whitespace-nowrap overflow-hidden group rounded-lg ${activeTab === tab
                                        ? 'text-[#1a0505]'
                                        : 'text-yellow-600/70 hover:text-yellow-400'
                                        }`}
                                >
                                    {/* Active background - Gold Card */}
                                    <div className={`absolute inset-0 transition-opacity duration-500 rounded-lg ${activeTab === tab ? 'bg-gradient-to-br from-[#FFD700] via-[#DAA520] to-[#B8860B] opacity-100 shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'opacity-0 group-hover:opacity-10 bg-yellow-500'}`} />
                                    
                                    {activeTab === tab && (
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] bg-[position:200%_0,0_0] bg-no-repeat animate-[shine_3s_infinite_ease-in-out]" />
                                    )}

                                    <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
                                        {tab === 'dashboard' && <span className={activeTab === tab ? "text-[#1a0505]" : "text-yellow-500"}>✦</span>}
                                        {tab === 'table' ? 'VAULT' : tab}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </>
    )
}