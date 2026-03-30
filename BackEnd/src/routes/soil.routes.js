import { Router } from 'express';
import {
  getSoilData,
  getIdealSoilData,
  createSoilData,
  getCropIdeals,
  createCropIdeal,
  updateCropIdeal,
  deleteCropIdeal,
} from '../controllers/soil.controller.js';
import { getTableView } from '../controllers/soilController.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';

const router = Router();
console.log("SOIL ROUTES LOADED");

// Public GET routes for soil data (remove auth for now)
router.route("/data").get(getSoilData).post(createSoilData);  // Removed verifyJWT for sensors
router.route("/ideals").get(getIdealSoilData);
router.route("/table").get(getTableView);
router.route('/crops').get(getCropIdeals).post(createCropIdeal);
router.route('/crops/:cropId').put(updateCropIdeal).delete(deleteCropIdeal);

export default router;
