const Review = require('../models/Review');
const Trip = require('../models/Trip');
const Hotel = require('../models/Hotel');
const Vehicle = require('../models/Vehicle');
const { validationResult } = require('express-validator');

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('item');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

exports.createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const review = await Review.create({
      ...req.body,
      user: req.user.id
    });

    // Update average rating for the reviewed item
    const Model = {
      trip: Trip,
      hotel: Hotel,
      car: Vehicle
    }[req.body.itemType];

    const allReviews = await Review.find({
      itemType: req.body.itemType,
      item: req.body.item
    });

    const averageRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;

    await Model.findByIdAndUpdate(req.body.item, { averageRating });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};