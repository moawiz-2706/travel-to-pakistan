const Hotel = require('../models/Hotel');
const { validationResult } = require('express-validator');

// Utility function to safely parse JSON
const safeJSONParse = (value, defaultValue = null) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn(`Failed to parse JSON: ${error.message}`);
      return defaultValue;
    }
  }
  return value || defaultValue;
};

// Get All Hotels
exports.getAllHotels = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'createdAt', 
      order = 'desc',
      city,
      country,
      status,
      minRating,
      amenities
    } = req.query;

    const query = {};
    
    // Filter by location
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (country) query['location.country'] = new RegExp(country, 'i');
    
    // Filter by status
    if (status) query.status = status;
    
    // Filter by minimum rating
    if (minRating) query.averageRating = { $gte: parseFloat(minRating) };
    
    // Filter by amenities (if multiple amenities are passed)
    if (amenities) {
      query.amenities = { $all: Array.isArray(amenities) ? amenities : [amenities] };
    }

    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    const hotels = await Hotel.find(query)
      //.select('-images') // Exclude large image data from initial fetch
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('owner', 'name email') // Optionally populate owner details
      .populate({
        path: 'rooms',
        select: 'roomNumber type capacity'
      });

    const total = await Hotel.countDocuments(query);

    res.json({
      hotels,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalHotels: total
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching hotels', 
      error: error.message 
    });
  }
};

// Get Hotel by ID
exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .select('-images') // Exclude images from initial fetch
      .populate('owner', 'name email')
      .populate({
        path: 'rooms',
        select: 'roomNumber type capacity price'
      });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching hotel', 
      error: error.message 
    });
  }
};

// Create Hotel
exports.createHotel = async (req, res) => {
  try {
    const hotelData = { ...req.body };

    // Set the owner to the currently logged-in user
    // Note: This assumes you have middleware to set req.user
    hotelData.owner = req.user._id;

    // Handle image uploads directly to database
    if (req.files && req.files.length > 0) {
      hotelData.images = req.files.map(file => ({
        data: file.buffer,
        contentType: file.mimetype
      }));
    }

    // Safely parse JSON fields
    const jsonFields = ['amenities', 'location'];
    jsonFields.forEach(field => {
      hotelData[field] = safeJSONParse(hotelData[field], 
        field === 'amenities' ? [] : 
        field === 'location' ? {} : {}
      );
    });

    // Ensure numeric fields are converted
    hotelData.averageRating = parseFloat(hotelData.averageRating) || 0;

    const hotel = await Hotel.create(hotelData);
    
    res.status(201).json({
      message: 'Hotel created successfully',
      hotel: {
        ...hotel.toObject(),
        images: hotel.images ? hotel.images.map((img, index) => ({
          contentType: img.contentType,
          index: index
        })) : []
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating hotel', 
      error: error.message 
    });
  }
};

// Update Hotel
exports.updateHotel = async (req, res) => {
  try {
    const hotelId = req.params.id;
    const existingHotel = await Hotel.findById(hotelId);

    if (!existingHotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const updateData = { ...req.body };

    // Handle image uploads directly to the database
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        data: file.buffer,
        contentType: file.mimetype
      }));

      // Replace existing images with new ones
      updateData.images = newImages;
    } else {
      // Retain existing images if no new images uploaded
      updateData.images = existingHotel.images || [];
    }

    // Safely parse JSON fields
    const jsonFields = ['amenities', 'location'];
    jsonFields.forEach(field => {
      updateData[field] = safeJSONParse(updateData[field], 
        field === 'amenities' ? [] : 
        field === 'location' ? {} : {}
      );
    });

    // Ensure numeric fields are converted
    updateData.averageRating = parseFloat(updateData.averageRating) || 0;

    const updatedHotel = await Hotel.findByIdAndUpdate(
      hotelId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedHotel) {
      return res.status(500).json({ message: 'Error saving updated hotel' });
    }

    res.json({
      message: 'Hotel updated successfully',
      hotel: {
        ...updatedHotel.toObject(),
        images: updatedHotel.images
          ? updatedHotel.images.map((img, index) => ({
              contentType: img.contentType,
              index: index
            }))
          : []
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating hotel',
      error: error.message
    });
  }
};

// Delete Hotel
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.json({ 
      message: 'Hotel deleted successfully',
      deletedHotel: {
        ...hotel.toObject(),
        images: hotel.images ? hotel.images.map((img, index) => ({
          contentType: img.contentType,
          index: index
        })) : []
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting hotel', 
      error: error.message 
    });
  }
};

// Get Hotel Image
exports.getHotelImage = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    
    if (!hotel || !hotel.images || hotel.images.length === 0) {
      return res.status(404).json({ message: 'No images found' });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= hotel.images.length) {
      return res.status(400).json({ message: 'Invalid image index' });
    }

    const image = hotel.images[imageIndex];
    res.contentType(image.contentType);
    res.send(image.data);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving image', 
      error: error.message 
    });
  }
};

// Delete Specific Image
exports.deleteImage = async (req, res) => {
  try {
    // Find the hotel
    const hotel = await Hotel.findById(req.params.id);
 console.log(hotel);
    if (!hotel || !hotel.images || hotel.images.length === 0) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    const imageIndex = parseInt(req.params.imageIndex);

    // Validate image index
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= hotel.images.length) {
      return res.status(400).json({ message: 'Invalid image index' });
    }

    // Remove the specific image
    hotel.images.splice(imageIndex, 1);

    // Save the updated hotel
    await hotel.save();

    res.json({
      message: 'Image deleted successfully',
      images: hotel.images.map((img, index) => ({
        contentType: img.contentType,
        index: index
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting image', 
      error: error.message 
    });
  }
};
