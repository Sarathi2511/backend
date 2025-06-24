import express, { response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import staffRoutes from './routes/staffRoutes';
import { Staff } from './models/Staff';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://shreesarathielectricalsonline:Sarathi2511@clustersarathi.9azmyha.mongodb.net/?retryWrites=true&w=majority&appName=ClusterSarathi')
  .then(async () => {
    console.log('Connected to MongoDB');

    // Initialize admin user if not exists
    const adminExists = await Staff.findOne({ phone: '9876543210' });
    if (!adminExists) {
      await Staff.create({
        name: 'Admin User',
        phone: '9876543210',
        password: 'admin123',
        role: 'admin',
        email: 'admin@electrical.com',
      });
      console.log('Admin user created');
    }

     // Initialize Special Staff user if not exists
    const specialStafExists = await Staff.findOne({ phone: '7875353444' });
    if (!specialStafExists) {
      await Staff.create({
        name: 'Staff User',
        phone: '78753534444',
        password: 'staff123',
        role: 'staff',
        email: 'special@electrical.com',
      });
      console.log('Staff user created');
    }

    // Initialize Staff user if not exists
    const staffExists = await Staff.findOne({ phone: '9876543211' });
    if (!staffExists) {
      await Staff.create({
        name: 'Staff User',
        phone: '9876543211',
        password: 'staff123',
        role: 'staff',
        email: 'staff@electrical.com',
      });
      console.log('Staff user created');
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

 

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff', staffRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      status: 'ok',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/', (req, res) => {res.json("Welcome to Sarathi")});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 