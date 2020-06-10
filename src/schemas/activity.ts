
import { Schema, model } from "mongoose";

export let activitySchema: Schema = new Schema({
  secret: {
      description: String,
      actionType: String,
      previousEntity: Object,
      newEntity: Object,
  },
  schemaName: {
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});