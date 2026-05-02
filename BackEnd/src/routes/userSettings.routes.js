import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getFarms,
  createFarm,
  updateFarm,
  deleteFarm,
  getBoundary,
  saveBoundary,
} from '../controllers/userSettings.controller.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// ── Profile ──────────────────────────────────────────────────────────────────
router.route('/profile')
  .get(getProfile)
  .patch(updateProfile);

// ── Farms ────────────────────────────────────────────────────────────────────
router.route('/farms')
  .get(getFarms)
  .post(createFarm);

router.route('/farms/:id')
  .put(updateFarm)
  .delete(deleteFarm);

// ── Farm Boundary ─────────────────────────────────────────────────────────────
router.route('/farms/:id/boundary')
  .get(getBoundary)
  .put(saveBoundary);

// ── Members ───────────────────────────────────────────────────────────────────
router.route('/members')
  .get((req, res) => {
    // Temporary placeholder - return empty members array
    res.status(200).json({
      success: true,
      data: [],
      message: "Members endpoint - not implemented yet"
    });
  });

export default router;

