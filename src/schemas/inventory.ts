import { Schema, model } from "mongoose";
import * as mongoose from 'mongoose';
export let inventoryItemSchema: Schema = new Schema({
    secret: {
        name: String,
        description: String,
        quantity: Number,
        image: Array,
        comment: String,
        temporary_quantity: {type: Number, default:0}
    },
    // category: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryCategory' },
    properties: [{ id: { type: Schema.Types.ObjectId, ref: 'Property' }, value: String }],
    inventorySku: [{
        upc: { type: String, default: 123 },
        sku: String,
        status: { type: String, default: 'available' },
        createdAt: { type: Date, default: new Date() },
        userId: { type: String },
    }],
    approval_status: {
        type: String,
        default: 'pending'
    },
    isActive: {
        type: Boolean,
        default: true
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date
    }
});
