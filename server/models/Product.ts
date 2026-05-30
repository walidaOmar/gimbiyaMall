import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  categoryId: mongoose.Types.ObjectId;
  storeId?: mongoose.Types.ObjectId; // For virtual mall
  costPrice: number;
  baseSalePrice: number;
  commissionPercent: number;
  finalPrice: number;
  stockQuantity: number;
  soldQuantity: number;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  arEnabled: boolean; // Virtual mall feature
  limitedOffer?: string; // Virtual mall feature
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store" }, // For virtual mall
    costPrice: { type: Number, required: true, min: 0 },
    baseSalePrice: { type: Number, required: true, min: 0 },
    commissionPercent: { type: Number, default: 10, min: 0, max: 100 },
    finalPrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, default: 0, min: 0 },
    soldQuantity: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    arEnabled: { type: Boolean, default: false }, // Virtual mall feature
    limitedOffer: { type: String }, // Virtual mall feature
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

productSchema.index({ categoryId: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ name: "text", description: "text" });

export const Product = mongoose.model<IProduct>("Product", productSchema);
