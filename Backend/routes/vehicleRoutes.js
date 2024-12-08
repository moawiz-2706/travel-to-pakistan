const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { vehicleValidation } = require('../utils/validation');
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  verifyVehicle
} = require('../controllers/vehicleController');

const router = express.Router();

router.get('/', getVehicles);
router.get('/:id', getVehicle);

router.post('/', protect, authorize('car_owner'), vehicleValidation, createVehicle);
router.put('/:id', protect, authorize('car_owner', 'admin'), vehicleValidation, updateVehicle);
router.delete('/:id', protect, authorize('car_owner', 'admin'), deleteVehicle);
router.put('/:id/verify', protect, authorize('admin'), verifyVehicle);

module.exports = router;