export interface IInventoryCategory {
  name?: string;
  description?: string;
  barcode?: boolean;
  properties?: [String]
  parentCategory?: string
}
