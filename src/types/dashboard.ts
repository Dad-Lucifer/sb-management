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
    smsSent?: boolean
}
