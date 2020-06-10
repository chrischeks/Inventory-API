
export interface IInventoryRequisition {
    cart?: [{ itemId?: string, quantity?: number, skus?: [string] }];
    comment?: string
    approval_status?: string
    requisition_number?: string;
    access_code?: string;
    acceptance_code?: string;
}