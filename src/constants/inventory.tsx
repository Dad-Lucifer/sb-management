import { CupSoda, Cookie, Pizza, Wheat, CookingPot as PastaIcon, Flame, IceCream, Star, Shapes } from 'lucide-react'

export const PER_PERSON_RATE = 50

export const getHourlyRate = (numberOfPeople: number): number => {
    if (numberOfPeople === 1) return 100
    if (numberOfPeople === 2) return 75
    return 50 // More than 2 people
}

export const calculateSessionPrice = (duration: number, numberOfPeople: number): number => {
    const hours = Math.ceil(duration)
    if (duration <= 0) return 0
    const ratePerPerson = getHourlyRate(numberOfPeople)
    return hours * numberOfPeople * ratePerPerson
}

export interface SnackItem {
    id: string;
    name: string;
    shortName?: string;
    price: number;
    description?: string;
    popular?: boolean;
}

export interface SnackCategory {
    label: string;
    icon: any;
    gradient: string;
    textColor: string;
    items: SnackItem[];
}

export const SNACK_INVENTORY: Record<string, SnackCategory> = {
    pizza: {
        label: "Pizza",
        icon: Pizza,
        gradient: "from-red-500/20 to-orange-600/5",
        textColor: "text-red-400",
        items: [
            { id: 'queen_m_pizza', name: 'Queen M. Pizza', price: 30 },
            { id: 'm_pizza', name: 'M Pizza', price: 30 },
            { id: 'only_c_pizza', name: 'Only C. Pizza', price: 30 },
            { id: 'cheese_corn_pizza', name: 'Cheese & Corn Pizza', price: 30 },
            { id: 'paneer_pizza', name: 'Paneer Pizza', price: 30 },
            { id: 'bbq_paneer_pizza', name: 'BBQ Paneer Pizza', price: 30 },
            { id: 'paneer_tikka', name: 'Paneer Tikka', price: 30 },
            { id: 'paneer_corn_pizza', name: 'Paneer Corn Pizza', price: 30 },
            { id: 'spicy_happiness_pizza', name: 'Spicy Happiness Pizza', price: 30 },
        ]
    },
    garlic_bread: {
        label: "Garlic Bread",
        icon: Wheat,
        gradient: "from-amber-600/20 to-yellow-600/5",
        textColor: "text-amber-400",
        items: [
            { id: 'plain_garlic_bread', name: 'Plain Garlic Bread', price: 30 },
            { id: 'cheese_garlic_bread', name: 'Cheese Garlic Bread', price: 30 },
            { id: 'cheese_sche_garlic_bread', name: 'Cheese Sche. Garlic Bread', price: 30 },
            { id: 'cheese_corn_garlic_bread', name: 'Cheese & Corn Garlic Bread', price: 30 },
            { id: 'cheese_chilli_garlic_bread', name: 'Cheese Chilli Garlic Bread', price: 30 },
        ]
    },
    pasta: {
        label: "Pasta",
        icon: PastaIcon,
        gradient: "from-orange-500/20 to-red-600/5",
        textColor: "text-orange-400",
        items: [
            { id: 'tangy_red_sauce', name: 'Tangy Red Sauce', price: 30 },
            { id: 'white_sauce', name: 'White Sauce', price: 30 },
            { id: 'red_sauce', name: 'Red Sauce', price: 30 },
            { id: 'white_sauce_pasta_cheese', name: 'White Sauce Pasta With Cheese', price: 30 },
        ]
    },
    momos: {
        label: "Momos",
        icon: Flame,
        gradient: "from-emerald-500/20 to-teal-600/5",
        textColor: "text-emerald-400",
        items: [
            { id: 'veg_sch_momos_s', name: 'Veg Sch. Momos (Steam)', price: 30 },
            { id: 'veg_sch_momos_f', name: 'Veg Sch. Momos (Fried)', price: 30 },
            { id: 'corn_cheese_momos_s', name: 'Corn & Cheese Momos (Steam)', price: 30 },
            { id: 'corn_cheese_momos_f', name: 'Corn & Cheese Momos (Fried)', price: 30 },
            { id: 'paneer_tikka_momos_s', name: 'Paneer Tikka Momos (Steam)', price: 30 },
            { id: 'paneer_tikka_momos_f', name: 'Paneer Tikka Momos (Fried)', price: 30 },
            { id: 'mix_veg_momos_s', name: 'Mix Veg Momos (Steam)', price: 30 },
            { id: 'mix_veg_momos_f', name: 'Mix Veg Momos (Fried)', price: 30 },
        ]
    },
    nachos: {
        label: "Nachos",
        icon: Shapes,
        gradient: "from-yellow-600/20 to-amber-700/5",
        textColor: "text-yellow-500",
        items: [
            { id: 'classic_nachos', name: 'Classic Nachos', price: 30 },
            { id: 'mexican_salsa_nachos', name: 'Mexican Salsa Nachos', price: 30 },
            { id: 'cheesy_mayo_nachos', name: 'Cheesy Mayo Nachos', price: 30 },
            { id: 'bbq_nachos', name: 'BBQ Nachos', price: 30 },
            { id: 'tandoor_nachos', name: 'Tandoor Nachos', price: 30 },
        ]
    },
    starters: {
        label: "Hot Snacks",
        icon: Star,
        gradient: "from-orange-600/20 to-red-700/5",
        textColor: "text-orange-500",
        items: [
            { id: 'fries_regular', name: 'French Fries', price: 30 },
            { id: 'fries_peri', name: 'Peri Peri Fries', price: 30 },
            { id: 'fries_cheese', name: 'Cheese French Fries', price: 30 },
            { id: 'fries_peri_cheese', name: 'Peri Peri Cheese Fries', price: 30 },
            { id: 'garlic_balls', name: 'Potato Garlic Balls (15pc)', price: 30 },
            { id: 'smilies', name: 'Smilies (10pc)', price: 30 },
            { id: 'nuggets_veg', name: 'Veggie Nuggets (10pc)', price: 30 },
            { id: 'nuggets_cheese', name: 'Cheese Corn Nuggets (10pc)', price: 30 },
        ]
    },
    shakes: {
        label: "Milkshakes",
        icon: IceCream,
        gradient: "from-pink-500/20 to-rose-600/5",
        textColor: "text-pink-400",
        items: [
            { id: 'vanilla_shake', name: 'Vanilla Shake', price: 30 },
            { id: 'strawberry_shake', name: 'Strawberry Shake', price: 30 },
            { id: 'butterscotch_shake', name: 'Butterscotch Shake', price: 30 },
            { id: 'chocolate_shake', name: 'Chocolate Shake', price: 30 },
            { id: 'mango_shake', name: 'Mango Shake', price: 30 },
            { id: 'rose_shake', name: 'Rose Shake', price: 30 },
        ]
    },
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
