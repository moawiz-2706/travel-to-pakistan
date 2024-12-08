const { check } = require('express-validator');

exports.tripValidation = [
  check('title').notEmpty().trim(),
  check('description').notEmpty(),
  check('destination').notEmpty(),
  check('duration').isNumeric(),
  check('price').isNumeric(),
  check('tripType').isIn(['weekly', 'customized', 'corporate']),
  check('startDate').isISO8601(),
  check('endDate').isISO8601(),
  check('maxParticipants').isNumeric()
];

exports.hotelValidation = [
  check('name').notEmpty().trim(),
  check('description').notEmpty(),
  check('location').notEmpty(),
  check('amenities').isArray()
];

exports.vehicleValidation = [
  check('make').notEmpty().trim(),
  check('model').notEmpty().trim(),
  check('year').isNumeric(),
  check('type').isIn(['sedan', 'suv', 'van', 'luxury']),
  check('seats').isNumeric(),
  check('pricePerDay').isNumeric(),
  check('features').isArray()
];

exports.reviewValidation = [
  check('itemType').isIn(['trip', 'hotel', 'car']),
  check('rating').isInt({ min: 1, max: 5 }),
  check('comment').notEmpty().trim()
];

exports.bookingValidation = [
  check('bookingType').isIn(['trip', 'hotel', 'car']),
  check('startDate').isISO8601(),
  check('endDate').isISO8601(),
  check('totalPrice').isNumeric()
];