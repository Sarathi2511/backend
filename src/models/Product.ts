import mongoose, { Schema, Document } from 'mongoose';

export type ProductDimension = 'Bag' | 'Bundle' | 'Box' | 'Carton' | 'Coils' | 'Dozen' | 'Ft' | 'Gross' | 'Kg' | 'Mtr' | 'Pc' | 'Pkt' | 'Set' | 'Not Applicable';

export interface IProduct extends Document {
  name: string;
  stock: number;
  dimension?: ProductDimension;
  threshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema({
  name: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  dimension: {
    type: String,
    enum: ['Bag', 'Bundle', 'Box', 'Carton', 'Coils', 'Dozen', 'Ft', 'Gross', 'Kg', 'Mtr', 'Pc', 'Pkt', 'Set', 'Not Applicable'],
    default: 'Pc'
  },
  threshold: { type: Number, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
ProductSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  console.log('Saving product with data:', JSON.stringify(this, null, 2));
  next();
});

// Add a pre-hook for findOneAndUpdate to log updates
ProductSchema.pre('findOneAndUpdate', function(next) {
  console.log('Updating product with data:', JSON.stringify(this.getUpdate(), null, 2));
  next();
});

export default mongoose.model<IProduct>('Product', ProductSchema); 