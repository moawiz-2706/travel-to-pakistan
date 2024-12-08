const Vehicle = require('../models/Vehicle');
const { validationResult } = require('express-validator');

exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate('owner', 'name email');
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicles', error: error.message });
  }
};

exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('owner', 'name email');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle', error: error.message });
  }
};

exports.createVehicle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const vehicle = await Vehicle.create({
      ...req.body,
      owner: req.user.id
    });
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error creating vehicle', error: error.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this vehicle' });
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vehicle', error: error.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this vehicle' });
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vehicle', error: error.message });
  }
};

exports.verifyVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error verifying vehicle', error: error.message });
  }
};