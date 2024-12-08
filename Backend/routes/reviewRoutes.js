const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { reviewValidation } = require('../utils/validation');
const {
  getReviews,
  createReview,
  deleteReview
} = require('../controllers/reviewController');

const router = express.Router();

router.get('/', getReviews);
router.post('/', protect, authorize('user'), reviewValidation, createReview);
router.delete('/:id', protect, authorize('user', 'admin'), deleteReview);

module.exports = router;