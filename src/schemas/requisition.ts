import { Schema, model } from "mongoose";
import * as mongoose from 'mongoose';
export let requisitionSchema: Schema = new Schema({
  secret: {

  },
  cart: [{ itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }, quantity: Number, skus: [String] }],
  comment: String,
  remark: String,
  approval_status: {
    type: String,
    default: 'pending'
  },
  itemId_skus: Object,
  moved: {
    type: Boolean,
    default: false
  },
  fulfilled_date: {
    type: Date
  },
  fulfilled_by: {
    type: String
  },
  requisition_number: {
    type: String
  },
  access_code: {
    type: String,
  },
  acceptance_code: {
    type: String
  },
  approved_by: {
    type: String
  },
  declined_by: {
    type: String
  },
  approved_date: {
    type: Date
  },
  declined_date: {
    type: Date
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
