import { Router } from 'express';
import {
  getSoilData,
  getIdealSoilData,
  createSoilData,
} from '../controllers/soil.controller.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';

const router = Router();
console.log("SOIL ROUTES LOADED");

// Public GET routes for soil data (remove auth for now)
router.route("/data").get(getSoilData).post(verifyJWT, createSoilData);
router.route("/ideals").get(getIdealSoilData);

export default router;
