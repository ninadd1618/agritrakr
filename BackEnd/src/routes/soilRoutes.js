import { Router } from 'express';
import { ingestReading, queryReadings, getIdeals, getTableView } from '../controllers/soilController.js';

const router = Router();

router.post('/data', ingestReading);
router.get('/data', queryReadings);
router.get('/ideals', getIdeals);
router.get('/table', getTableView);

export default router;
