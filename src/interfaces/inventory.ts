
export interface IInventoryItem {
    name?: string,
    description?: string,
    quantity?: number,
    category?: string,
    properties?: [{ id?: string, value?: string }],
    image?: string,

}