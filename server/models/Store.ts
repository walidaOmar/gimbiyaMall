import mongoose, { Document, Schema } from "mongoose";

export interface IStore extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug?: string;
  category: 'store' | 'office';
  description?: string;
  live?: boolean;
  maintenance?: boolean;
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    city?: string;
    state?: string;
  };
  hours?: Record<string, { open: boolean; from: string; to: string }>;
  paymentMethods?: Record<string, boolean>;
  notifications?: Record<string, boolean>;
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  logoImageUrl?: string;
  bannerImageUrl?: string;
  buildingLevel: number;
  location?: { x: number; y: number };
  marketingPitch?: {
    headline?: string;
    promoText?: string;
    ctaLink?: string;
    videoUrl?: string;
  };
  flyers: Array<{
    title: string;
    description?: string;
    imageUrl?: string;
    validUntil?: Date;
  }>;
  products: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    category: { type: String, enum: ['store', 'office'], default: 'store' },
    description: { type: String },
    live: { type: Boolean, default: true },
    maintenance: { type: Boolean, default: false },
    contact: {
      email: { type: String },
      phone: { type: String },
      whatsapp: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
    },
    hours: { type: Schema.Types.Mixed },
    paymentMethods: { type: Schema.Types.Mixed },
    notifications: { type: Schema.Types.Mixed },
    brandColors: {
      primary: { type: String },
      secondary: { type: String },
      accent: { type: String },
    },
    logoImageUrl: { type: String },
    bannerImageUrl: { type: String },
    buildingLevel: { type: Number, default: 1 },
    location: {
      x: { type: Number },
      y: { type: Number }
    },
    marketingPitch: {
      headline: { type: String },
      promoText: { type: String },
      ctaLink: { type: String },
      videoUrl: { type: String }
    },
    flyers: [{
      title: { type: String, required: true },
      description: { type: String },
      imageUrl: { type: String },
      validUntil: { type: Date }
    }],
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storeSchema.index({ category: 1, isActive: 1 });
storeSchema.index({ buildingLevel: 1 });

export const Store = mongoose.model<IStore>("Store", storeSchema);