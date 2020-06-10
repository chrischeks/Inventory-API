import { Document } from "mongoose";
import { IProperty } from "../interfaces/property";

export interface IPropertyModel extends IProperty, Document {
  //custom methods for your model would be defined here
}
