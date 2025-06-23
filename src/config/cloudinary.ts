import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sarathi-orders',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [
      { width: 1000, crop: 'limit' },
      { quality: 'auto:good' }, // Use Cloudinary's automatic quality optimization
      { fetch_format: 'auto' }, // Automatically choose the best format (WebP when supported)
      { flags: 'lossy' }, // Apply lossy compression
    ],
  } as any,
});

// Create multer upload middleware
const upload = multer({ storage });

export { cloudinary, upload };