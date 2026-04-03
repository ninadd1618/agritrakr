import { Router } from 'express';
import {
  getUserDevices,
  addDevice,
  updateDevice,
  deleteDevice,
  getDeviceById,
  updateDeviceStatus,
} from '../controllers/device.controller.js';
import { verifyJWT } from '../middlewares/verifyJWT.js';

const router = Router();

// All device routes require authentication
router.use(verifyJWT);

// Get all devices for the logged-in user
router.route('/').get(getUserDevices).post(addDevice);

// Get, update, or delete a specific device
router.route('/:id')
  .get(getDeviceById)
  .patch(updateDevice)
  .delete(deleteDevice);

// Update device status (for MQTT integration)
router.route('/status/:deviceId').patch(updateDeviceStatus);

export default router;
