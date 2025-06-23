import { Router } from 'express';
import { 
  getProducts, 
  getProduct,
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all products
router.get('/', getProducts);

// Get product by ID
router.get('/:id', getProduct);

// Create new product (authenticated)
router.post('/', authenticateToken, createProduct);

// Update product (authenticated)
router.put('/:id', authenticateToken, updateProduct);

// Delete product (authenticated)
router.delete('/:id', authenticateToken, deleteProduct);

export default router; 