import { Router } from 'express';
import {
  bulkUploadSoilData,
  bulkUploadFinalData,
  uploadDataFromFile,
  getDataStats
} from '../controllers/data.controller.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/json', 'text/csv', 'application/csv'];
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.endsWith('.json') || 
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON and CSV files are allowed'), false);
    }
  }
});

const router = Router();
console.log("DATA ROUTES LOADED");

// Bulk upload routes (protected)
router.route("/soil/bulk").post(verifyJWT, bulkUploadSoilData);
router.route("/final/bulk").post(verifyJWT, bulkUploadFinalData);

// File upload route (protected)
router.route("/upload").post(verifyJWT, upload.single('file'), uploadDataFromFile);

// Statistics route (public for now)
router.route("/stats").get(getDataStats);

export default router;
