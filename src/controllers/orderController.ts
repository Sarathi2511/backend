import { Request, Response } from 'express';
import Order, { IOrder } from '../models/Order';
import { cloudinary } from '../config/cloudinary';
import { Staff } from '../models/Staff';

// Get all orders
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};

// Get order by ID
export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error });
  }
};

// Create new order
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Received order request');
    
    // If we have a file, add the image URL to the order data
    if (req.file) {
      console.log('File received:', req.file);
      
      // Get the image URL from Cloudinary
      const file = req.file as any; // Cast to any to access Cloudinary fields
      if (file.path) {
        req.body.orderImage = file.path;
      } else if (file.secure_url) {
        req.body.orderImage = file.secure_url;
      }
    }
    
    // Check if order is assigned to Special Staff
    if (req.body.assignedTo) {
      const specialStaff = await Staff.findOne({ email: 'special@electrical.com' });
      if (specialStaff && req.body.assignedTo === specialStaff._id.toString()) {
        req.body.iswithout = true;
      }
    }
    
    console.log('Order data to save:', req.body);
    
    const order = new Order(req.body);
    await order.save();
    console.log('Order saved with orderNumber:', order.orderNumber);
    res.status(201).json(order);
  } catch (error: any) {
    console.error('Order creation error:', error);
    
    // Check for MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        message: 'Validation error', 
        details: validationErrors,
        error: error.message 
      });
    } else {
      res.status(400).json({ message: 'Error creating order', error: error.message });
    }
  }
};

// Update order
export const updateOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    // Handle file if it exists
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      req.body.orderImage = result.secure_url;
    }

    // Log the update operation for debugging
    console.log(`Updating order ${req.params.id} with data:`, req.body);
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    
    console.log(`Order updated successfully:`, order);
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(400).json({ message: 'Error updating order', error });
  }
};

// Delete order
export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    
    // Delete image from Cloudinary if exists
    if (order.orderImage) {
      const publicId = order.orderImage.split('/').pop()?.split('.')[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`electra-admin-orders/${publicId}`);
      }
    }
    
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error });
  }
};

// Get orders by status
export const getOrdersByStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.find({ status: req.params.status }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders by status', error });
  }
};

// Mark order as paid
export const markOrderAsPaid = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paidBy, paymentReceivedBy } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        isPaid: true,
        paidAt: new Date(),
        paidBy: paidBy || null,
        paymentReceivedBy: paymentReceivedBy || null
      },
      { new: true }
    );
    
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error marking order as paid', error });
  }
};

// Get orders by date range
export const getOrdersByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.params;
    
    if (!startDate || !endDate) {
      res.status(400).json({ message: 'Start date and end date are required' });
      return;
    }
    
    // Create date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include all orders on the end date
    
    // Query for orders where createdAt is within the range
    const orders = await Order.find({
      createdAt: { 
        $gte: start, 
        $lte: end 
      }
    }).sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders by date range', error });
  }
};

// Get orders by assignedTo
export const getOrdersByAssignedTo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { staffId } = req.params;
    
    if (!staffId) {
      res.status(400).json({ message: 'Staff ID is required' });
      return;
    }
    
    console.log(`Searching for orders with staff ID: ${staffId}`);
    
    // Find orders where assignedTo is specifically the given staffId
    const orders = await Order.find({
      assignedTo: staffId
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} orders specifically assigned to staff ID: ${staffId}`);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by assigned staff:', error);
    res.status(500).json({ message: 'Error fetching orders by assigned staff', error });
  }
};

// Get orders created by staff
export const getOrdersByCreator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { staffId } = req.params;
    
    if (!staffId) {
      res.status(400).json({ message: 'Staff ID is required' });
      return;
    }
    
    console.log(`Searching for orders created by staff ID: ${staffId}`);
    
    // Find orders where createdBy is the given staffId
    const orders = await Order.find({
      createdBy: staffId
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} orders created by staff ID: ${staffId}`);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by creator:', error);
    res.status(500).json({ message: 'Error fetching orders by creator', error });
  }
};

// Assign delivery person to an order
export const assignDeliveryPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { deliveryPersonId } = req.body;
    
    if (!deliveryPersonId) {
      res.status(400).json({ message: 'Delivery person ID is required' });
      return;
    }
    
    console.log(`Assigning delivery person ${deliveryPersonId} to order ${orderId}`);
    
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { deliveryPerson: deliveryPersonId },
      { new: true, runValidators: true }
    );
    
    if (!updatedOrder) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    
    console.log('Delivery person assigned successfully:', updatedOrder);
    res.json(updatedOrder);
  } catch (error) {
    console.error('Error assigning delivery person:', error);
    res.status(500).json({ message: 'Error assigning delivery person', error });
  }
};