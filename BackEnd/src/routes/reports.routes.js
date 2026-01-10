import { Router } from 'express';
import { getPlantReport, getSoilReport } from '../controllers/reports.controller.js';

const router = Router();

// Public routes (add authentication middleware if needed)
router.get('/plant', getPlantReport);
router.get('/soil', getSoilReport);

export default router;
