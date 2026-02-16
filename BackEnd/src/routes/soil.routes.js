import { Router } from 'express';
import {
  getSoilData,
  getIdealSoilData,
  createSoilData,
} from '../controllers/soil.controller.js';
import { getTableView } from '../controllers/soilController.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';

const router = Router();
console.log("SOIL ROUTES LOADED");

// Public GET routes for soil data (remove auth for now)
router.route("/data").get(getSoilData).post(createSoilData);  // Removed verifyJWT for sensors
router.route("/ideals").get(getIdealSoilData);
router.route("/table").get(getTableView);

export default router;
