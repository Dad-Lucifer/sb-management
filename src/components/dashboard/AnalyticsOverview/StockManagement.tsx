import React, { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, LayoutGrid, List, AlertTriangle,
    Package, DollarSign, RefreshCw, Save, Plus, Minus,
    X
} from 'lucide-react'
import { SNACK_INVENTORY } from '@/constants/inventory'
import { cn } from '@/lib/utils'

// --- Types ---

interface StockManagementProps {
    stockData: Record<string, number>;
    onUpdateStock: (id: string, newQuantity: number) => Promise<void>;
}

type ViewMode = 'card' | 'list';
type FilterStatus = 'all' | 'low' | 'medium' | 'high';

interface EnrichedSnackItem {
    id: string;
    name: string;
    price: number;
    categoryLabel: string;
    categoryColor: string;
    currentStock: number;
    status: 'low' | 'medium' | 'high';
    shortName?: string;
}

const STOCK_THRESHOLDS = { LOW: 5, MEDIUM: 20 } as const;

// --- Sub-Components ---

/**
 * Mobile-First Stat Card
 * - Uses responsive width (42vw) to ensure 2.x cards are visible on 320px screens
 * - Enforces minimum touch/view areas
 * - Snap-aligned for horizontal scrolling
 */
const StatCard = memo(({ label, value, icon: Icon, colorClass }: {
    label: string,
    value: string | number,
    icon: React.ElementType,
    colorClass: string
}) => (
    <div className="min-w-[42vw] sm:min-w-[160px] md:min-w-[200px] flex-1 relative overflow-hidden rounded-2xl bg-gray-900/60 border border-white/5 p-4 backdrop-blur-xl snap-start scroll-ml-4">
        <div className={cn("absolute -right-3 -top-3 opacity-10 p-3 rounded-full", colorClass)}>
            <Icon className="w-16 h-16" />
        </div>
        <div className="flex flex-col h-full justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
                <div className={cn("flex items-center justify-center w-6 h-6 rounded-lg bg-white/10", colorClass)}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[80%]">{label}</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">{value}</span>
        </div>
    </div>
));
StatCard.displayName = 'StatCard';

/**
 * Mobile-First Stock Item Card
 * - Touch targets: All interactive elements min-h-[44px]
 * - Layout: Fluid flexbox with truncation, never breaks on 320px
 * - Interactions: Local state for instant feedback
 */
const StockItemCard = memo(({ item, onUpdate, isUpdating, viewMode }: {
    item: EnrichedSnackItem,
    onUpdate: (id: string, qty: number) => void,
    isUpdating: boolean,
    viewMode: ViewMode
}) => {
    const [draftStock, setDraftStock] = useState<number>(item.currentStock);
    const [isDirty, setIsDirty] = useState(false);

    // Sync state when props change (refresh) but not during local edits
    useEffect(() => {
        if (!isDirty) setDraftStock(item.currentStock);
    }, [item.currentStock, isDirty]);

    const handleDelta = useCallback((delta: number) => {
        setDraftStock(prev => {
            const next = Math.max(0, prev + delta);
            setIsDirty(next !== item.currentStock);
            return next;
        });
    }, [item.currentStock]);

    const handleSave = useCallback(async () => {
        await onUpdate(item.id, draftStock);
        setIsDirty(false);
    }, [item.id, draftStock, onUpdate]);

    const statusColors = {
        low: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        high: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    };

    // LIST VIEW: Horizontal Row (Density optimized)
    if (viewMode === 'list') {
        return (
            <motion.div
                layout="position"
                className={cn(
                    "flex items-center gap-3 p-3 pl-4 rounded-xl border bg-gray-900/40 backdrop-blur-sm transition-all focus-within:ring-1 focus-within:ring-blue-500/50",
                    isDirty ? "border-blue-500/50 bg-blue-500/5" : "border-gray-800"
                )}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-100 text-sm truncate">{item.name}</h3>
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase shrink-0", statusColors[item.status])}>
                            {item.status}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">₹{item.price} / unit</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                        "text-lg font-bold tabular-nums w-8 text-right transition-colors",
                        isDirty ? "text-blue-400" : "text-white"
                    )}>
                        {draftStock}
                    </span>

                    {/* Controls Group */}
                    <div className="flex items-center bg-gray-950 rounded-lg border border-gray-800 p-0.5 h-11">
                        <button
                            onClick={() => handleDelta(-1)}
                            className="w-10 h-full flex items-center justify-center rounded-md hover:bg-white/10 active:bg-white/20 active:scale-95 text-gray-400 hover:text-white transition-all touch-manipulation"
                            aria-label="Decrease stock"
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                        <div className="w-[1px] h-4 bg-gray-800" />
                        <button
                            onClick={() => handleDelta(1)}
                            className="w-10 h-full flex items-center justify-center rounded-md hover:bg-white/10 active:bg-white/20 active:scale-95 text-gray-400 hover:text-white transition-all touch-manipulation"
                            aria-label="Increase stock"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Float Save Button */}
                    <AnimatePresence>
                        {isDirty && (
                            <motion.button
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                onClick={handleSave}
                                disabled={isUpdating}
                                className="w-11 h-11 flex items-center justify-center bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20 active:scale-95 touch-manipulation ml-1"
                                aria-label="Save changes"
                            >
                                {isUpdating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        );
    }

    // CARD VIEW: Vertical Stack (Visual optimized)
    return (
        <motion.div
            layout="position"
            className={cn(
                "flex flex-col p-4 rounded-2xl border bg-gradient-to-br from-gray-900/80 to-gray-900/40 backdrop-blur-sm transition-all relative overflow-hidden group",
                isDirty ? "border-blue-500/50 shadow-[0_0_20px_-10px_rgba(59,130,246,0.3)]" : "border-gray-800"
            )}
        >
            {/* Upper Content */}
            <div className="flex justify-between items-start mb-4">
                <div className="min-w-0 flex-1 mr-4">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block truncate">
                        {item.categoryLabel}
                    </span>
                    <h3 className="text-lg font-bold text-gray-100 leading-tight truncate">{item.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs font-mono text-gray-400 bg-gray-950 px-2 py-1 rounded-md border border-gray-800">
                            ₹{item.price}
                        </span>
                        <span className={cn("text-[10px] px-2 py-1 rounded-md border font-bold uppercase shadow-sm", statusColors[item.status])}>
                            {item.status}
                        </span>
                    </div>
                </div>
                {/* Large Counter */}
                <div className="text-right shrink-0">
                    <div className={cn("text-4xl font-black tabular-nums tracking-tighter transition-colors", isDirty ? "text-blue-400" : "text-white")}>
                        {draftStock}
                    </div>
                </div>
            </div>

            {/* Bottom Controls - Full Width Touch Targets */}
            <div className="mt-auto pt-2 grid grid-cols-[1fr,auto] gap-2">
                <div className="flex items-center bg-black/40 rounded-xl border border-gray-800 p-1 h-12">
                    <button
                        onClick={() => handleDelta(-1)}
                        className="flex-1 h-full flex items-center justify-center rounded-lg hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all text-gray-400 hover:text-white touch-manipulation"
                        aria-label="Decrease stock"
                    >
                        <Minus className="w-5 h-5" />
                    </button>
                    <div className="px-3 text-[10px] font-bold text-gray-600 uppercase select-none">Qty</div>
                    <button
                        onClick={() => handleDelta(1)}
                        className="flex-1 h-full flex items-center justify-center rounded-lg hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all text-gray-400 hover:text-white touch-manipulation"
                        aria-label="Increase stock"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <AnimatePresence mode="popLayout">
                    {isDirty && (
                        <motion.button
                            initial={{ width: 0, opacity: 0, scale: 0.8 }}
                            animate={{ width: 'auto', opacity: 1, scale: 1 }}
                            exit={{ width: 0, opacity: 0, scale: 0.8 }}
                            onClick={handleSave}
                            disabled={isUpdating}
                            className="h-12 w-14 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center touch-manipulation"
                            aria-label="Save Stock"
                        >
                            {isUpdating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
});
StockItemCard.displayName = 'StockItemCard';


export function StockManagement({ stockData, onUpdateStock }: StockManagementProps) {
    // --- State ---
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

    // --- Processing ---
    const enrichedItems = useMemo<EnrichedSnackItem[]>(() => {
        return Object.values(SNACK_INVENTORY).flatMap(category =>
            category.items.map(item => {
                const stock = stockData[item.id] ?? 0;
                let status: EnrichedSnackItem['status'] = 'high';
                if (stock < STOCK_THRESHOLDS.LOW) status = 'low';
                else if (stock < STOCK_THRESHOLDS.MEDIUM) status = 'medium';

                return {
                    ...item,
                    currentStock: stock,
                    categoryLabel: category.label,
                    categoryColor: category.textColor,
                    status
                };
            })
        );
    }, [stockData]);

    const stats = useMemo(() => ({
        totalItems: enrichedItems.reduce((acc, i) => acc + i.currentStock, 0),
        totalValue: enrichedItems.reduce((acc, i) => acc + (i.currentStock * i.price), 0),
        lowStock: enrichedItems.filter(i => i.status === 'low').length,
    }), [enrichedItems]);

    const filteredItems = useMemo(() => {
        return enrichedItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;
            if (activeFilter === 'all') return true;
            return item.status === activeFilter;
        });
    }, [enrichedItems, searchQuery, activeFilter]);

    // --- Handlers ---
    const handleUpdateStock = useCallback(async (id: string, newQty: number) => {
        setUpdatingIds(prev => new Set(prev).add(id));
        try {
            await onUpdateStock(id, newQty);
        } catch (error) {
            console.error("Update failed", error);
        } finally {
            setUpdatingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        }
    }, [onUpdateStock]);

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-white overflow-hidden font-sans">

            {/* 1. Mobile-First Header Stack */}
            <div className="shrink-0 flex flex-col gap-4 p-1 sm:p-0 pb-4 w-full max-w-[100vw]">

                {/* Stats Row - Horizontal Snap Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 sm:mx-0 sm:px-0 scrollbar-hide snap-x scroll-pl-1">
                    <StatCard label="Total Stock" value={stats.totalItems} icon={Package} colorClass="bg-blue-500" />
                    <StatCard label="Total Value" value={`₹${stats.totalValue.toLocaleString()}`} icon={DollarSign} colorClass="bg-emerald-500" />
                    <StatCard label="Alerts" value={stats.lowStock} icon={AlertTriangle} colorClass={stats.lowStock > 0 ? "bg-rose-500" : "bg-gray-500"} />
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Field - Height 48px */}
                    <div className="relative flex-1 group h-12">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full h-full rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-base sm:text-sm pl-11 pr-11 outline-none transition-all placeholder:text-gray-600 appearance-none text-white"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-0 w-12 flex items-center justify-center text-gray-500 active:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar h-12">
                        {/* Filter Chips - Height 44px range */}
                        <div className="flex items-center bg-gray-900 rounded-xl p-1 border border-gray-800 h-full">
                            {(['all', 'low', 'medium'] as FilterStatus[]).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setActiveFilter(status)}
                                    className={cn(
                                        "px-4 h-full flex items-center justify-center rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap",
                                        activeFilter === status
                                            ? "bg-gray-800 text-white shadow-sm ring-1 ring-white/5"
                                            : "text-gray-500 hover:text-gray-300 active:bg-white/5"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        <div className="w-px h-6 bg-gray-800 shrink-0 mx-1" />

                        {/* Layout Toggle - Height 44px range */}
                        <div className="flex items-center bg-gray-900 rounded-xl p-1 border border-gray-800 h-full shrink-0">
                            <button
                                onClick={() => setViewMode('card')}
                                className={cn("w-10 h-full flex items-center justify-center rounded-lg transition-colors", viewMode === 'card' ? "bg-gray-800 text-white" : "text-gray-500")}
                                aria-label="Card View"
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("w-10 h-full flex items-center justify-center rounded-lg transition-colors", viewMode === 'list' ? "bg-gray-800 text-white" : "text-gray-500")}
                                aria-label="List View"
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Scrollable Content - Mobile Safe Bottom Padding */}
            <div className="flex-1 min-h-0 relative -mx-1 px-1 sm:mx-0 sm:px-0">
                <div className="absolute inset-0 overflow-y-auto pb-40 custom-scrollbar">
                    {filteredItems.length > 0 ? (
                        <div className={cn(
                            "grid gap-3 transition-all",
                            viewMode === 'card'
                                ? "grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                : "grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3"
                        )}>
                            {filteredItems.map(item => (
                                <StockItemCard
                                    key={item.id}
                                    item={item}
                                    onUpdate={handleUpdateStock}
                                    isUpdating={updatingIds.has(item.id)}
                                    viewMode={viewMode}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="text-sm font-bold text-gray-400">No inventory found</p>
                            <p className="text-xs opacity-50">Try adjusting filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
