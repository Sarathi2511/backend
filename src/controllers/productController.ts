import { Request, Response } from 'express';
import Product, { IProduct } from '../models/Product';

// Get all products
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    
    // Log the first product data
    if (products.length > 0) {
      console.log('Sample product from database:', JSON.stringify(products[0], null, 2));
      
      // Check explicitly for threshold field
      const firstProduct = products[0];
      console.log('Threshold value:', firstProduct.threshold);
      console.log('Threshold type:', typeof firstProduct.threshold);
      console.log('All product keys:', Object.keys(firstProduct.toObject()));
    }
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error });
  }
};

// Get product by ID
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error });
  }
};

// Create new product
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Received product data:', JSON.stringify(req.body, null, 2));
    
    // Log the product schema for debugging
    console.log('Product schema:', JSON.stringify(Product.schema.obj.dimension, null, 2));
    
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error: any) {
    console.error('Product creation error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`Field "${key}" error:`, error.errors[key].message);
        if (error.errors[key].kind === 'enum') {
          console.error(`  Valid enum values:`, error.errors[key].properties.enumValues);
          console.error(`  Received value:`, error.errors[key].value);
        }
      });
    }
    
    // Check for MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        message: 'Validation error', 
        details: validationErrors,
        error: error.message 
      });
    } else {
      res.status(400).json({ message: 'Error creating product', error: error.message });
    }
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error updating product', error });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Deleting product with ID:', req.params.id);
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      console.log('Product not found for deletion');
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    console.log('Product deleted successfully:', product.name);
    res.json({ message: 'Product deleted successfully', product });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error });
  }
}; 