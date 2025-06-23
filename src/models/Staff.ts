import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

interface IAttendance {
  date: Date;
  isPresent: boolean;
  remarks?: string;
}

export interface IStaff extends Document {
  name: string;
  phone: string;
  password: string;
  role: 'admin' | 'staff' | 'executive';
  email?: string;
  createdAt: Date;
  attendance: IAttendance[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AttendanceSchema = new Schema({
  date: {
    type: Date,
    required: true,
  },
  isPresent: {
    type: Boolean,
    required: true,
    default: true,
  },
  remarks: {
    type: String,
  }
}, { _id: false });

const staffSchema = new Schema<IStaff>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number'],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'staff', 'executive'],
      message: 'Role must be either admin, staff, or executive'
    },
    default: 'staff',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  attendance: {
    type: [AttendanceSchema],
    default: [],
  }
});

// Hash password before saving
staffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password for login
staffSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

export const Staff = mongoose.model<IStaff>('Staff', staffSchema); 