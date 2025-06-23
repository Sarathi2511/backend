import express, { RequestHandler, Request, Response, NextFunction } from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByStatus,
  markOrderAsPaid,
  getOrdersByDateRange,
  getOrdersByAssignedTo,
  getOrdersByCreator,
  assignDeliveryPerson,
} from '../controllers/orderController';
import { upload } from '../config/cloudinary';

const router = express.Router();

// Middleware to handle orderData JSON parsing
const parseOrderData = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.orderData && typeof req.body.orderData === 'string') {
    try {
      const parsedData = JSON.parse(req.body.orderData);
      req.body = { ...req.body, ...parsedData };
    } catch (error) {
      return res.status(400).json({ message: 'Invalid order data format' });
    }
  }
  next();
};

// Get all orders
router.get('/', getOrders as RequestHandler);

// Get orders by status - must be before /:id route to avoid conflict
router.get('/status/:status', getOrdersByStatus as RequestHandler);

// Get orders by date range
router.get('/date-range/:startDate/:endDate', getOrdersByDateRange as RequestHandler);

// Get orders by assigned staff
router.get('/assigned/:staffId', getOrdersByAssignedTo as RequestHandler);

// Get orders by creator
router.get('/created/:staffId', getOrdersByCreator as RequestHandler);

// Get order by ID
router.get('/:id', getOrder as RequestHandler);

// Create new order with file upload
router.post('/', upload.single('orderImage'), parseOrderData, createOrder as RequestHandler);

// Update order with file upload
router.put('/:id', upload.single('orderImage'), parseOrderData, updateOrder as RequestHandler);

// Mark order as paid
router.put('/:id/paid', markOrderAsPaid as RequestHandler);

// Assign delivery person to order
router.put('/:orderId/delivery-person', assignDeliveryPerson as RequestHandler);

// Delete order
router.delete('/:id', deleteOrder as RequestHandler);

export default router; 