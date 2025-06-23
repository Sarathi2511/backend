import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  items: IOrderItem[];
  total: number;
  status: 'pending' | 'invoice' | 'dispatched' | 'dc';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo?: string;
  deliveryPerson?: string;
  paymentCondition: 'immediate' | 'days15' | 'days30';
  priority: 'urgent' | 'normal';
  dispatchDate?: Date;
  scheduledDate?: Date;
  orderImage?: string;
  isPaid: boolean;
  paidAt?: Date;
  iswithout?: boolean;
}

const OrderItemSchema = new Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
});

const OrderSchema = new Schema({
  orderNumber: { type: String, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: false },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: false },
  items: [OrderItemSchema],
  total: { type: Number, required: true },
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'invoice', 'dispatched', 'dc'],
    default: 'pending'
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  assignedTo: { type: String, default: null },
  deliveryPerson: { type: String, default: null },
  paymentCondition: { 
    type: String, 
    enum: ['immediate', 'days15', 'days30'],
    default: 'immediate'
  },
  priority: {
    type: String,
    enum: ['urgent', 'normal'],
    default: 'normal'
  },
  dispatchDate: { type: Date },
  scheduledDate: { type: Date },
  orderImage: { type: String },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  iswithout: { type: Boolean, default: false }
});

// Update the updatedAt timestamp before saving
OrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate sequential order number before saving
OrderSchema.pre('save', async function(next) {
  console.log('Pre-save hook running, current orderNumber:', this.orderNumber);
  // Only set order number if it doesn't exist
  if (!this.orderNumber) {
    try {
      // Find the order with the highest number
      const lastOrder = await mongoose.model('Order').findOne(
        { orderNumber: { $exists: true, $ne: null } },  // Only find docs with orderNumber
        {},
        { sort: { 'orderNumber': -1 } }
      );
      console.log('Last order found:', lastOrder ? lastOrder.orderNumber : 'None');
      
      let nextNumber = 1;
      
      // If there's an existing order with a number
      if (lastOrder && lastOrder.orderNumber) {
        // Extract the number part
        const match = lastOrder.orderNumber.match(/ORD(\d+)/);
        console.log('Regex match:', match);
        if (match && match[1]) {
          // Increment the last number
          nextNumber = parseInt(match[1]) + 1;
          console.log('Next number will be:', nextNumber);
        }
      }
      
      // Format with leading zeros (e.g., ORD001)
      this.orderNumber = `ORD${nextNumber.toString().padStart(3, '0')}`;
      console.log(`Generated new order number: ${this.orderNumber}`);
    } catch (error) {
      console.error('Error generating order number:', error);
      // Fallback to timestamp-based ID if there's an error
      const timestamp = new Date().getTime();
      this.orderNumber = `ORD${timestamp}`;
    }
  }
  next();
});

export default mongoose.model<IOrder>('Order', OrderSchema); 