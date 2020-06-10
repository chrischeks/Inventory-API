import { Schema, model } from "mongoose";

export let settingsSchema: Schema = new Schema({
  secret: {
    enableApprovalForProcurement: {
      type: Boolean,
      default: false
    },
    procurementApprovers: {
      type: Array,
      default: []
    },
    enableRequisitionApprover: {
      type: Boolean,
      default: false
    },
    maxApprovalDelay: {
      type: Number
    },
    requisitionApprovers: {
      type: Array,
      default: []
    },
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
  },
  lastUpdatedAt: {
    type: Date
  }
});
