import express from 'express';
import {
  getTodaySummary,
  quickIncrement,
  quickDecrement,
  getHistoryLogs,
  deleteLog
} from '../controllers/peachController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/today', protect, getTodaySummary);
router.post('/increment', protect, quickIncrement);
router.post('/decrement', protect, quickDecrement);
router.get('/history', protect, getHistoryLogs);
router.delete('/:id', protect, deleteLog);

export default router;
