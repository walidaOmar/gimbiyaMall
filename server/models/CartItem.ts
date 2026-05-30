import mongoose, { Document, Schema } from "mongoose";

export interface ICartItem extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { timestamps: true }
);

cartItemSchema.index({ userId: 1 });
// One entry per product per user
cartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const CartItem = mongoose.model<ICartItem>("CartItem", cartItemSchema);
