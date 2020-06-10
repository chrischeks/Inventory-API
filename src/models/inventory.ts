import { Document } from "mongoose";
import { IInventoryItem } from "../interfaces/inventory";

export interface IInventoryItemModel extends IInventoryItem, Document {
    //custom methods for your model would be defined here
}