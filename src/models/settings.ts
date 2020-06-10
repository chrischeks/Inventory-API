import { Document } from "mongoose";
import { ISettings } from "../interfaces/settings";

export interface ISettingsModel extends ISettings, Document {
  //custom methods for your model would be defined here
}