import { Document } from "mongoose";
import { IInventoryCategory } from "../interfaces/category";

export interface IInventoryCategoryModel extends IInventoryCategory, Document {
  //custom methods for your model would be defined here
}
