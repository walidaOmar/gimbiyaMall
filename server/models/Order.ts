import mongoose, { Document, Schema } from "mongoose";

export type OrderStatus = "pending" | "paid" | "processing" | "assigned" | "in_transit" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  costPrice: number;
  baseSalePrice: number;
  commissionPercent: number;
  commissionAmount: number;
  finalPrice: number;
  subtotal: number;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: string;
  buyerId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  commissionAmount: number;
  finalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState?: string;
  shippingZipCode?: string;
  shippingCountry: string;
  buyerPhone: string;
  deliveryRiderId?: mongoose.Types.ObjectId;
  deliveryNotes?: string;
  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    costPrice: { type: Number, required: true },
    baseSalePrice: { type: Number, required: true },
    commissionPercent: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    commissionAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "processing", "assigned", "in_transit", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentReference: { type: String },
    shippingAddress: { type: String, required: true },
    shippingCity: { type: String, required: true },
    shippingState: { type: String },
    shippingZipCode: { type: String },
    shippingCountry: { type: String, required: true, default: "Nigeria" },
    buyerPhone: { type: String, required: true },
    deliveryRiderId: { type: Schema.Types.ObjectId, ref: "User" },
    deliveryNotes: { type: String },
    referralCode: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryRiderId: 1 });
orderSchema.index({ orderId: 1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);
