const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth'); // Import protect middleware
const roomController = require('../controllers/roomController');

const router = express.Router();

// Setup image upload using multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Public Routes
router.get('/', roomController.getAllRooms); // Get all rooms
router.get('/:id', roomController.getRoomById); // Get room by ID
router.get('/hotel/:hotelId', roomController.getRoomsByHotel); // Get rooms by hotel ID

// Protected Routes
router.post(
  '/',
  protect, // Only authenticated users can create rooms
  upload.array('images', 5), // Allow up to 5 images
  roomController.createRoom // Create room controller
);

router.put(
  '/:id',
  protect, // Only authenticated users can update rooms
  roomController.updateRoom // Update room controller
);

router.delete('/:id', protect, roomController.deleteRoom); // Delete room by ID

// Additional routes for managing images
router.post(
  '/:id/images',
  protect, // Only authenticated users can add images
  upload.array('images', 5), // Allow up to 5 images
  roomController.addRoomImages // Add images to a room
);

router.delete(
  '/:id/images',
  protect, // Only authenticated users can remove images
  roomController.removeRoomImage // Remove an image from a room
);

module.exports = router;
