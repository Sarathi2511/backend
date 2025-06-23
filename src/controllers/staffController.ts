import { Request, Response } from 'express';
import { Staff, IStaff } from '../models/Staff';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Get all staff members
export const getStaff = async (req: Request, res: Response) => {
  try {
    const staff = await Staff.find().select('-password');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff members' });
  }
};

// Get a single staff member
export const getStaffMember = async (req: Request, res: Response) => {
  try {
    const staff = await Staff.findById(req.params.id).select('-password');
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff member' });
  }
};

// Create a new staff member
export const createStaff = async (req: Request, res: Response) => {
  try {
    const { name, phone, password, role, email } = req.body;

    console.log('Received staff creation request:', { 
      name, 
      phone, 
      role, 
      email,
      userRole: req.user?.role,
      userId: req.user?.id
    });

    // Validate required fields
    if (!name || !phone || !password || !role) {
      console.log('Missing required fields:', { name: !!name, phone: !!phone, password: !!password, role: !!role });
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: { name: !!name, phone: !!phone, password: !!password, role: !!role }
      });
    }

    // Validate role
    if (!['admin', 'staff', 'executive'].includes(role)) {
      console.log('Invalid role received:', role);
      return res.status(400).json({ 
        message: 'Invalid role specified',
        receivedRole: role,
        validRoles: ['admin', 'staff', 'executive']
      });
    }

    // Special logging for executive role
    if (role === 'executive') {
      console.log('Creating executive staff member...');
      console.log('Environment:', process.env.NODE_ENV);
      console.log('MongoDB connection state:', mongoose.connection.readyState);
      console.log('User making request:', {
        id: req.user?.id,
        role: req.user?.role,
        phone: req.user?.phone
      });
    }

    // Check if phone already exists
    const existingStaff = await Staff.findOne({ phone });
    if (existingStaff) {
      console.log('Phone number already exists:', phone);
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    console.log('Creating new staff member with role:', role);

    const staff = new Staff({
      name,
      phone,
      password,
      role,
      email,
    });

    // Validate the staff document before saving
    const validationError = staff.validateSync();
    if (validationError) {
      console.error('Validation error before save:', validationError);
      return res.status(400).json({ 
        message: 'Validation error',
        details: validationError.errors 
      });
    }

    console.log('Attempting to save staff member...');
    await staff.save();
    
    // Create a new object without the password field
    const { password: _, ...staffWithoutPassword } = staff.toObject();
    
    console.log('Staff member created successfully:', staffWithoutPassword);
    
    res.status(201).json(staffWithoutPassword);
  } catch (error: any) {
    console.error('Detailed error creating staff:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      errors: error.errors,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      userRole: req.user?.role,
      userId: req.user?.id
    });
    
    // Check for specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        details: error.errors 
      });
    }
    
    if (error.code === 11000) { // MongoDB duplicate key error
      return res.status(400).json({ 
        message: 'Duplicate key error',
        field: Object.keys(error.keyPattern)[0]
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating staff member',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update a staff member
export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { name, phone, password, role, email } = req.body;
    const updateData: any = { name, phone, role, email };

    // Only update password if provided
    if (password) {
      updateData.password = password;
    }

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error updating staff member' });
  }
};

// Delete a staff member
export const deleteStaff = async (req: Request, res: Response) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting staff member' });
  }
};

// Staff login
export const loginStaff = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    // Find staff member
    const staff = await Staff.findOne({ phone });
    if (!staff) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await staff.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: staff._id,
        phone: staff.phone,
        role: staff.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return staff data without password using destructuring
    const { password: _, ...staffData } = staff.toObject();

    res.json({
      token,
      staff: staffData
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};

// Record attendance for a staff member
export const recordAttendance = async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const { date, isPresent, remarks } = req.body;
    
    // Validate the date format
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Find staff member
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    // Check if attendance for this date already exists
    const today = new Date(attendanceDate);
    today.setHours(0, 0, 0, 0);
    
    const existingAttendanceIndex = staff.attendance.findIndex(a => {
      const attendanceDate = new Date(a.date);
      attendanceDate.setHours(0, 0, 0, 0);
      return attendanceDate.getTime() === today.getTime();
    });
    
    if (existingAttendanceIndex !== -1) {
      // Update existing attendance
      staff.attendance[existingAttendanceIndex].isPresent = isPresent;
      if (remarks) {
        staff.attendance[existingAttendanceIndex].remarks = remarks;
      }
    } else {
      // Add new attendance record
      staff.attendance.push({
        date: today,
        isPresent,
        remarks
      });
    }
    
    await staff.save();
    
    // Return the updated staff without password
    const updatedStaff = await Staff.findById(staffId).select('-password');
    res.json(updatedStaff);
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ message: 'Error recording attendance' });
  }
};

// Get attendance for a staff member 
export const getStaffAttendance = async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Find staff member
    const staff = await Staff.findById(staffId).select('-password');
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    // Filter attendance by date range if provided
    let filteredAttendance = staff.attendance;
    
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate as string) : new Date(0);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      // Set end date to end of day
      end.setHours(23, 59, 59, 999);
      
      filteredAttendance = staff.attendance.filter(a => {
        const attendanceDate = new Date(a.date);
        return attendanceDate >= start && attendanceDate <= end;
      });
    }
    
    // Sort attendance by date (newest first)
    filteredAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    res.json({
      staffId: staff._id,
      name: staff.name,
      attendance: filteredAttendance
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
};

// Get all staff attendance for a specific date
export const getAllStaffAttendanceByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    
    console.log('getAllStaffAttendanceByDate called with date:', date);
    
    if (!date) {
      console.log('Error: Date parameter is missing');
      return res.status(400).json({ message: 'Date parameter is required' });
    }
    
    // Convert date string to Date object
    const targetDate = new Date(date as string);
    targetDate.setHours(0, 0, 0, 0);
    
    if (isNaN(targetDate.getTime())) {
      console.log('Error: Invalid date format:', date);
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Find all staff members
    const allStaff = await Staff.find().select('-password');
    console.log(`Found ${allStaff.length} staff members`);
    
    // Map staff data with their attendance for the specified date
    const staffAttendance = allStaff.map(staff => {
      const attendanceForDate = staff.attendance?.find(a => {
        const attendanceDate = new Date(a.date);
        attendanceDate.setHours(0, 0, 0, 0);
        return attendanceDate.getTime() === targetDate.getTime();
      });
      
      return {
        staffId: staff._id,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
        attendance: attendanceForDate || null
      };
    });
    
    console.log('Sending response with staffAttendance:', staffAttendance.length);
    
    res.json({
      date: targetDate,
      staffAttendance
    });
  } catch (error) {
    console.error('Error fetching all staff attendance:', error);
    res.status(500).json({ message: 'Error fetching all staff attendance' });
  }
}; 