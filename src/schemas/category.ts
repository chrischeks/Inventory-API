import { Schema, model } from "mongoose";
import * as mongoose from 'mongoose';
export let inventoryCategorySchema: Schema = new Schema({
  secret: {
    name: String,
    description: String,
    barcode: {
      type: Boolean,
      default: false
    }
  },
  parentCategoryId: {type: mongoose.Schema.Types.ObjectId, ref: 'InventoryCategory'},
  properties: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
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
}, { toJSON: { virtuals: true } });

inventoryCategorySchema.virtual('ItemAttachedToThisCategory', {
  ref: 'Inventory',
  localField: '_id',
  foreignField: 'category',
  justOne: false
});


inventoryCategorySchema.virtual('childCategoryAttached', {
  ref: 'InventoryCategory',
  localField: '_id',
  foreignField: 'parentCategoryId',
  justOne: false
});

  