import express from 'express';
import {
  getStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  deleteStaff,
  loginStaff,
  recordAttendance,
  getStaffAttendance,
  getAllStaffAttendanceByDate
} from '../controllers/staffController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/login', loginStaff);

// Protected routes (require authentication)
router.get('/', authenticateToken, getStaff);

// Role check middleware
const checkAdminRole = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can perform this action' });
  }
  next();
};

const checkAdminOrExecutiveRole = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!['admin', 'executive'].includes(req.user?.role || '')) {
    return res.status(403).json({ message: 'Only admin or executive can perform this action' });
  }
  next();
};

// Staff management routes
router.post('/', authenticateToken, checkAdminRole, createStaff);
router.put('/:id', authenticateToken, checkAdminRole, updateStaff);
router.delete('/:id', authenticateToken, checkAdminRole, deleteStaff);

// Attendance routes
router.get('/attendance/date', authenticateToken, checkAdminOrExecutiveRole, getAllStaffAttendanceByDate);
router.post('/:staffId/attendance', authenticateToken, checkAdminOrExecutiveRole, recordAttendance);
router.get('/:staffId/attendance', authenticateToken, checkAdminOrExecutiveRole, getStaffAttendance);

// Staff member specific routes
router.get('/:id', authenticateToken, getStaffMember);

export default router; 