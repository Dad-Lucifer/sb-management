import { CupSoda, Cookie, UtensilsCrossed, Package } from 'lucide-react'

export const PER_PERSON_RATE = 60

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
    drinks: {
        label: "Thirst Quenchers",
        icon: CupSoda,
        gradient: "from-blue-500/20 to-blue-600/5",
        textColor: "text-blue-400",
        items: [
            { id: 'coke', name: 'Coca Cola', price: 50, popular: true },
            { id: 'pepsi', name: 'Pepsi', price: 50 },
            { id: 'redbull', name: 'Red Bull', price: 120, popular: true, description: "Energy Boost" },
            { id: 'water', name: 'Mineral Water', price: 20 },
            { id: 'coffee', name: 'Hot Coffee', price: 40 },
        ]
    },
    munchies: {
        label: "Crunchy Loot",
        icon: Cookie,
        gradient: "from-yellow-500/20 to-orange-600/5",
        textColor: "text-yellow-400",
        items: [
            { id: 'lays_classic', name: 'Lays Classic', shortName: "Lays Classic", price: 20 },
            { id: 'lays_magic', name: 'Lays Magic Masala', shortName: "Lays Magic", price: 20, popular: true },
            { id: 'doritos', name: 'Doritos Nacho', price: 40 },
            { id: 'pringles', name: 'Pringles', price: 100 },
        ]
    },
    food: {
        label: "Heavy Arsenal",
        icon: UtensilsCrossed,
        gradient: "from-red-500/20 to-red-600/5",
        textColor: "text-red-400",
        items: [
            { id: 'maggi', name: 'Masala Maggi', price: 50, popular: true },
            { id: 'sandwich_veg', name: 'Veg Grilled Sandwich', shortName: "Veg Sandwich", price: 80 },
            { id: 'sandwich_chicken', name: 'Chicken Sandwich', shortName: "Chicken Sandwich", price: 120, popular: true },
            { id: 'nuggets', name: 'Chicken Nuggets (6pc)', shortName: "Nuggets (6pc)", price: 100 },
        ]
    },
    combo: {
        label: "Battle Bundles",
        icon: Package,
        gradient: "from-purple-500/20 to-pink-600/5",
        textColor: "text-purple-400",
        items: [
            {
                id: 'combo_1',
                name: 'Gaming Duo (2 Coke + 1 Lays)',
                shortName: "Gaming Duo",
                description: "2 Coke + 1 Lays",
                price: 110,
                popular: true
            },
            {
                id: 'combo_2',
                name: 'Full Squad (4 Redbull + 2 Lays)',
                shortName: "Full Squad",
                description: "4 Redbull + 2 Lays",
                price: 500
            },
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
