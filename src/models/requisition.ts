import { Document } from "mongoose";
import { IInventoryRequisition } from "../interfaces/requisition";

export interface IInventoryRequisitionModel extends IInventoryRequisition, Document {
    //custom methods for your model would be defined here
}