import express from 'express';
import { statsController } from '../controllers/stats.controller';

const router = express.Router();

router.get('/dashboard', statsController.getDashboardStats);

export default router; 