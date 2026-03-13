export interface SnackOrder {
    id: string
    name: string
    category: string
    quantity: number
    unitPrice: number
    totalPrice: number
}

export interface CustomerEntry {
    id: string
    customerName: string
    phoneNumber: string
    numberOfPeople: number
    duration: number
    snacks: SnackOrder[]
    subTotal: number
    timestamp: Date
    isRenewed?: boolean

    age?: number
    paymentMode?: 'online' | 'offline'


    // Split Payment Fields
    splitPayment?: {
        cashAmount: number;
        onlineAmount: number;
    }

    screenNumber?: number
    // Pause functionality
    isPaused?: boolean
    pausedAt?: Date
    totalPausedTime?: number
}
