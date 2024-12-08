const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { check } = require('express-validator');
const multer = require('multer');

const {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  searchTrips,
  getTripImage,
  deleteImage
} = require('../controllers/tripController');

const router = express.Router();

// Memory storage for direct database upload
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit


// Trip Validation Middleware
const tripValidation = [
  check('title').notEmpty().withMessage('Title is required'),
  check('description').notEmpty().withMessage('Description is required'),
  check('destination').notEmpty().withMessage('Destination is required'),
  check('duration').isNumeric().withMessage('Duration must be a number'),
  check('price').isNumeric().withMessage('Price must be a number'),
  check('tripType').isIn(['weekly', 'customized', 'corporate']).withMessage('Invalid trip type'),
  check('startDate').isISO8601().withMessage('Invalid start date'),
  check('endDate').isISO8601().withMessage('Invalid end date'),
  check('maxParticipants').isNumeric().withMessage('Max participants must be a number')
];

// Public Routes
router.get('/', getAllTrips);
router.get('/search', searchTrips);
router.get('/:id', getTripById);
router.get('/:id/image/:imageIndex', getTripImage);

// Protected Admin Routes
router.post('/', 
  protect, 
  authorize('admin'), 
  upload.array('images', 5),
  tripValidation, 
  createTrip
);

router.put('/:id', 
  protect, 
  authorize('admin'), 
  upload.array('images', 5),
  tripValidation, 
  updateTrip
);

router.delete('/:id', 
  protect, 
  authorize('admin'), 
  deleteTrip
);

// Image Management Routes
router.delete('/image/:id/:imageIndex', 
  protect, 
  authorize('admin'), 
  deleteImage
);

module.exports = router;