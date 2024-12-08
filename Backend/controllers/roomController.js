const Room = require('../models/Room');
const multer = require('multer');

// Setup image upload using multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room', error });
  }
};

exports.getRoomsByHotel = async (req, res) => {
  try {
    const rooms = await Room.find({ hotel: req.params.hotelId });
    if (rooms.length === 0) {
      return res.status(404).json({ message: 'No rooms found for this hotel' });
    }
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms by hotel', error });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { hotel, roomType, pricePerNight, maxOccupancy, availability, amenities } = req.body;
    
    const room = new Room({
      hotel,
      roomType,
      pricePerNight,
      maxOccupancy,
      availability: availability || true,
      amenities: amenities || [],
      images: req.files.map(file => ({
        data: file.buffer,
        contentType: file.mimetype,
      })),
    });

    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error creating room', error });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { roomType, pricePerNight, maxOccupancy, availability, amenities } = req.body;
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { roomType, pricePerNight, maxOccupancy, availability, amenities },
      { new: true }
    );
    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Error updating room', error });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting room', error });
  }
};

// Add images to a room
exports.addRoomImages = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const newImages = req.files.map(file => ({
      data: file.buffer,
      contentType: file.mimetype,
    }));

    room.images.push(...newImages);
    await room.save();

    res.status(200).json({ message: 'Images added successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Error adding images to room', error });
  }
};

// Remove an image from a room
exports.removeRoomImage = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const { imageId } = req.body; // Assume `imageId` is the index of the image to be removed
    if (!room.images[imageId]) {
      return res.status(404).json({ message: 'Image not found' });
    }

    room.images.splice(imageId, 1);
    await room.save();

    res.status(200).json({ message: 'Image removed successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Error removing image from room', error });
  }
};
