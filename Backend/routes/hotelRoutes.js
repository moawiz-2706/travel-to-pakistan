const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');

const {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  searchHotels,
  getHotelImage,
  deleteImage
} = require('../controllers/hotelController');

const router = express.Router();

// Memory storage for direct database upload
const upload = multer({ 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept image files only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Validation Middleware
const hotelValidationRules = [
  body('name').trim().notEmpty().withMessage('Hotel name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('pricePerNight')
    .isNumeric().withMessage('Price must be a number')
    .toFloat(),
  body('status')
    .optional()
    .isIn(['available', 'unactive'])
    .withMessage('Invalid status'),
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  body('averageRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5')
];

// Middleware to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Public Routes
router.get('/', getAllHotels); // Get all hotels with pagination and filtering
//router.get('/search', searchHotels); // Search for hotels
router.get('/:id', getHotelById); // Get hotel by ID
router.get('/:id/image/:imageIndex', getHotelImage); // Get specific image of a hotel

// Protected Admin Routes
router.post(
  '/',
  protect, // Only authenticated users can create hotels
  upload.array('images', 5), // Max 5 images upload
  hotelValidationRules, // Apply validation
  validate, // Handle validation errors
  createHotel // Create the hotel
);

router.put(
  '/:id',
  protect, // Only authenticated users can update hotels
  upload.array('images', 5), // Max 5 images upload
  hotelValidationRules, // Apply validation
  validate, // Handle validation errors
  updateHotel // Update the hotel
);

router.delete('/:id', protect, deleteHotel); // Delete hotel by ID

// Image Management Routes
router.delete('/image/:id/:imageIndex', protect, deleteImage); // Delete image from hotel

module.exports = router;
