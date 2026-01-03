import { CupSoda, Cookie } from 'lucide-react'

export const PER_PERSON_RATE = 50

export interface SnackItem {
    id: string;
    name: string;
    shortName?: string; // Optimized for Mobile Views
    price: number;
    description?: string;
    popular?: boolean;
}

export interface SnackCategory {
    label: string;
    icon: any;
    gradient: string; // Background gradient for UI Cards
    textColor: string; // Text color for UI
    items: SnackItem[];
}

export const SNACK_INVENTORY: Record<string, SnackCategory> = {
    munchies: {
        label: "Munchies",
        icon: Cookie,
        gradient: "from-yellow-500/20 to-orange-600/5",
        textColor: "text-yellow-400",
        items: [
            { id: 'chips_15', name: 'Chips', price: 15 },
            { id: 'big_packet', name: 'big packet', price: 50 },
        ]
    },
    drinks: {
        label: "Drinks",
        icon: CupSoda,
        gradient: "from-blue-500/20 to-blue-600/5",
        textColor: "text-blue-400",
        items: [
            { id: 'water', name: 'Water', price: 10 },
        ]
    }
}

// Flat map for easy lookup with full type safety
export const ALL_SNACKS_MAP = Object.values(SNACK_INVENTORY)
    .flatMap(cat => cat.items)
    .reduce((acc, item) => {
        acc[item.id] = item
        return acc
    }, {} as Record<string, SnackItem>)

export const COLORS = ['#3b82f6', '#eab308', '#ef4444', '#a855f7', '#06b6d4', '#4ade80', '#f97316', '#ec4899']
