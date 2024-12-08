const Trip = require('../models/Trip');
const { validationResult } = require('express-validator');

// Get All Trips
exports.getAllTrips = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'createdAt', 
      order = 'desc',
      destination,
      minPrice,
      maxPrice,
      tripType
    } = req.query;

    const query = {};
    if (destination) query.destination = new RegExp(destination, 'i');
    if (minPrice) query.price = { $gte: parseFloat(minPrice) };
    if (maxPrice) query.price = { 
      ...query.price, 
      $lte: parseFloat(maxPrice) 
    };
    if (tripType) query.tripType = tripType;

    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    const trips = await Trip.find(query)
       // Exclude large image data from initial fetch
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Trip.countDocuments(query);

    res.json({
      trips,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalTrips: total
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching trips', 
      error: error.message 
    });
  }
};

// Get Trip by ID
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching trip', 
      error: error.message 
    });
  }
};

// Create Trip
exports.createTrip = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const tripData = { ...req.body };

    // Handle image uploads directly to database
    if (req.files && req.files.length > 0) {
      tripData.images = req.files.map(file => ({
        data: file.buffer,
        contentType: file.mimetype
      }));
    }

    // Parse JSON fields
    ['itinerary', 'includes', 'excludes'].forEach(field => {
      if (tripData[field] && typeof tripData[field] === 'string') {
        try {
          tripData[field] = JSON.parse(tripData[field]);
        } catch (error) {
          console.warn(`Failed to parse ${field}:`, error);
        }
      }
    });

    // Convert dates and numbers
    ['startDate', 'endDate'].forEach(field => {
      if (tripData[field]) {
        tripData[field] = new Date(tripData[field]);
      }
    });

    ['duration', 'price', 'maxParticipants'].forEach(field => {
      if (tripData[field]) {
        tripData[field] = Number(tripData[field]);
      }
    });

    const trip = await Trip.create(tripData);
    
    res.status(201).json({
      message: 'Trip created successfully',
      trip: {
        ...trip.toObject(),
        images: trip.images ? trip.images.map((img, index) => ({
          contentType: img.contentType,
          index: index
        })) : []
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating trip', 
      error: error.message 
    });
  }
};

// Update Trip
// exports.updateTrip = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     console.error("Validation Errors:", errors.array());
//     return res.status(400).json({ errors: errors.array() });
//   }

//   try {
//     const tripId = req.params.id;
//     const existingTrip = await Trip.findById(tripId);

//     if (!existingTrip) {
//       console.log('Trip not found');
//       return res.status(404).json({ message: 'Trip not found' });
      
//     }

//     const updateData = { ...req.body };

//     // Handle image uploads directly to database
//     if (req.files && req.files.length > 0) {
//       const newImages = req.files.map(file => ({
//         data: file.buffer,
//         contentType: file.mimetype
//       }));
//       updateData.images = [
//         ...(existingTrip.images || []),
//         ...newImages
//       ];
//     }

//     // Parse JSON fields
//     ['itinerary', 'includes', 'excludes'].forEach(field => {
//       if (updateData[field] && typeof updateData[field] === 'string') {
//         try {
//           updateData[field] = JSON.parse(updateData[field]);
//         } catch (error) {
//           console.warn(`Failed to parse ${field}:`, error);
//         }
//       }
//     });

//     // Convert dates and numbers
//     ['startDate', 'endDate'].forEach(field => {
//       if (updateData[field]) {
//         updateData[field] = new Date(updateData[field]);
//       }
//     });

//     ['duration', 'price', 'maxParticipants'].forEach(field => {
//       if (updateData[field]) {
//         updateData[field] = Number(updateData[field]);
//       }
//     });

//     const updatedTrip = await Trip.findByIdAndUpdate(
//       tripId, 
//       updateData, 
//       { new: true, runValidators: true }
//     );

//     res.json({
//       message: 'Trip updated successfully'
//       // trip: {
//       //   ...updatedTrip.toObject(),
//       //   images: updatedTrip.images ? updatedTrip.images.map((img, index) => ({
//       //     contentType: img.contentType,
//       //     index: index
//       //   })) : []
//       // }
//     });
//   } catch (error) {
//     console.log('Error updating trip',error);
//     res.status(500).json({ 
//       message: 'Error updating trip', 
//       error: error.message 
//     });
//   }
// };

// Delete Trip

exports.updateTrip = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("Validation Errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const tripId = req.params.id;
    const existingTrip = await Trip.findById(tripId);

    if (!existingTrip) {
      console.log('Trip not found');
      return res.status(404).json({ message: 'Trip not found' });
    }

    const updateData = { ...req.body };

    // Handle image uploads directly to the database
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        data: file.buffer,
        contentType: file.mimetype
      }));

      // If new images are uploaded, replace the old images (or merge as needed)
      if (newImages.length > 0) {
        updateData.images = newImages;  // Replace the old images with new ones
      } else {
        updateData.images = existingTrip.images || []; // Keep existing images if no new images
      }
    } else {
      // If no new images are uploaded, retain the existing images
      updateData.images = existingTrip.images || [];
    }

    // Parse JSON fields
    ['itinerary', 'includes', 'excludes'].forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (error) {
          console.warn(`Failed to parse ${field}:`, error);
        }
      }
    });

    // Convert dates and numbers
    ['startDate', 'endDate'].forEach(field => {
      if (updateData[field]) {
        updateData[field] = new Date(updateData[field]);
      }
    });

    ['duration', 'price', 'maxParticipants'].forEach(field => {
      if (updateData[field]) {
        updateData[field] = Number(updateData[field]);
      }
    });

    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTrip) {
      console.log("Error saving updated trip", error);
      return res.status(500).json({ message: 'Error saving updated trip' });
    }

    res.json({
      message: 'Trip updated successfully',
      trip: {
        ...updatedTrip.toObject(),
        images: updatedTrip.images
          ? updatedTrip.images.map((img, index) => ({
              contentType: img.contentType,
              index: index
            }))
          : []
      }
    });
  } catch (error) {
    console.error('Error updating trip', error);
    res.status(500).json({
      message: 'Error updating trip',
      error: error.message
    });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json({ 
      message: 'Trip deleted successfully',
      deletedTrip: {
        ...trip.toObject(),
        images: trip.images ? trip.images.map((img, index) => ({
          contentType: img.contentType,
          index: index
        })) : []
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting trip', 
      error: error.message 
    });
  }
};

// Search Trips
exports.searchTrips = async (req, res) => {
  try {
    const { query } = req.query;
    
    const trips = await Trip.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { destination: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).select('-images').limit(10);

    res.json(trips);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error searching trips', 
      error: error.message 
    });
  }
};

// Get Trip Image
exports.getTripImage = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip || !trip.images || trip.images.length === 0) {
      return res.status(404).json({ message: 'No images found' });
    }

    const imageIndex = parseInt(req.params.imageIndex);
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= trip.images.length) {
      return res.status(400).json({ message: 'Invalid image index' });
    }

    const image = trip.images[imageIndex];
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
    //const { tripId, imageIndex } = req.body;

    // Find the trip
    const trip = await Trip.findById(req.params.id);

    if (!trip|| !trip.images || trip.images.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    const imageIndex = parseInt(req.params.imageIndex);

    // Validate image index
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= trip.images.length) {
      return res.status(400).json({ message: 'Invalid image index' });
    }

    // Remove the specific image
    trip.images.splice(imageIndex, 1);

    // Save the updated trip
    await trip.save();

    res.json({
      message: 'Image deleted successfully',
      images: trip.images.map((img, index) => ({
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