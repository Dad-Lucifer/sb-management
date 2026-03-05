import { CupSoda, Cookie } from 'lucide-react'

export const PER_PERSON_RATE = 50

export const getHourlyRate = (numberOfPeople: number): number => {
    if (numberOfPeople === 1) return 100
    if (numberOfPeople === 2) return 75
    return 50 // More than 2 people
}

export const calculateSessionPrice = (duration: number, numberOfPeople: number): number => {
    const hours = Math.ceil(duration)
    // "Minimum 1-Hour Billing Rule" & "Billing should always round up to the nearest 1-hour block"
    // If duration is 0 (e.g. just started), maybe min 1 hour? Or 0?
    // Usually if duration > 0, ceil gives 1+.
    if (duration <= 0) return 0

    const ratePerPerson = getHourlyRate(numberOfPeople)
    return hours * numberOfPeople * ratePerPerson
}


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
            { id: 'diet_coke', name: 'Diet Coke', price: 50 },
            { id: 'pepsi', name: 'Pepsi', price: 50 },
            { id: 'pepsi_small', name: 'Pepsi Small', shortName: 'Pepsi S', price: 25 },
            { id: 'soda', name: 'Soda', shortName: 'Soda', price: 35 },
            { id: 'rio', name: 'Rio', price: 55 },
            { id: 'red_bull', name: 'Red Bull', price: 135 },
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
