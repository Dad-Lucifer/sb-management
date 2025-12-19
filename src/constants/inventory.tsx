import { CupSoda, Cookie, UtensilsCrossed, Package } from 'lucide-react'

export const PER_PERSON_RATE = 60

export const SNACK_INVENTORY: Record<string, { label: string, icon: any, items: { id: string, name: string, price: number }[] }> = {
    drinks: {
        label: "Thirst Quenchers",
        icon: CupSoda,
        items: [
            { id: 'coke', name: 'Coca Cola', price: 50 },
            { id: 'pepsi', name: 'Pepsi', price: 50 },
            { id: 'redbull', name: 'Red Bull', price: 120 },
            { id: 'water', name: 'Mineral Water', price: 20 },
            { id: 'coffee', name: 'Hot Coffee', price: 40 },
        ]
    },
    munchies: {
        label: "Crunchy Loot",
        icon: Cookie,
        items: [
            { id: 'lays_classic', name: 'Lays Classic', price: 20 },
            { id: 'lays_magic', name: 'Lays Magic Masala', price: 20 },
            { id: 'doritos', name: 'Doritos Nacho', price: 40 },
            { id: 'pringles', name: 'Pringles', price: 100 },
        ]
    },
    food: {
        label: "Heavy Arsenal",
        icon: UtensilsCrossed,
        items: [
            { id: 'maggi', name: 'Masala Maggi', price: 50 },
            { id: 'sandwich_veg', name: 'Veg Grilled Sandwich', price: 80 },
            { id: 'sandwich_chicken', name: 'Chicken Sandwich', price: 120 },
            { id: 'nuggets', name: 'Chicken Nuggets (6pc)', price: 100 },
        ]
    },
    combo: {
        label: "Battle Bundles",
        icon: Package,
        items: [
            { id: 'combo_1', name: 'Gaming Duo (2 Coke + 1 Lays)', price: 110 },
            { id: 'combo_2', name: 'Full Squad (4 Redbull + 2 Lays)', price: 500 },
        ]
    }
}

// Flat map for easy lookup
export const ALL_SNACKS_MAP = Object.values(SNACK_INVENTORY).flatMap(cat => cat.items).reduce((acc, item) => {
    acc[item.id] = item
    return acc
}, {} as Record<string, { id: string, name: string, price: number }>)

export const COLORS = ['#3b82f6', '#eab308', '#1d4ed8', '#facc15', '#60a5fa', '#fde047', '#2563eb', '#fbbf24']
