import express from 'express';
import {
  getWeeklyStats,
  getThreeMonthComparative,
  runManualPrune
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/weekly', protect, getWeeklyStats);
router.get('/comparative', protect, getThreeMonthComparative);
router.post('/cleanup', runManualPrune);

export default router;
