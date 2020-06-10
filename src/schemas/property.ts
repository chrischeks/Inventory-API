import { Schema, model } from "mongoose";
export let propertySchema: Schema = new Schema({
  secret: {
    name: String,
    description: String,
    property_type: String,
    options: [String],
    required: {
      type: Boolean,
      default: false
    }
  },
  nameHash: {
    type: String,
    required: true
  },
  tenantId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedAt: {
    type: Date
  }
});
