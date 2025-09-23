const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const auth = require('../middleware/auth');
const authAdmin = require('../middleware/authAdmin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for car image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/cars';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'car-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// PUBLIC ROUTES

// Get all cars (public view with filters)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      make,
      model,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      fuelType,
      transmission,
      bodyType,
      condition,
      location,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'Available' };
    
    if (make) filter.make = new RegExp(make, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (minYear || maxYear) {
      filter.year = {};
      if (minYear) filter.year.$gte = Number(minYear);
      if (maxYear) filter.year.$lte = Number(maxYear);
    }
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;
    if (bodyType) filter.bodyType = bodyType;
    if (condition) filter.condition = condition;
    if (location) {
      filter.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.state': new RegExp(location, 'i') }
      ];
    }
    if (featured === 'true') filter.featured = true;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;
    
    const cars = await Car.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select('-createdBy -updatedBy');

    const total = await Car.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      cars,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalCars: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single car by ID (public view)
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)
      .select('-createdBy -updatedBy');
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.status !== 'Available') {
      return res.status(404).json({ message: 'Car not available' });
    }

    // Increment views
    await car.incrementViews();

    res.json({ car });
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get filter options (for frontend dropdowns)
router.get('/filters/options', async (req, res) => {
  try {
    const makes = await Car.distinct('make', { status: 'Available' });
    const fuelTypes = await Car.distinct('fuelType', { status: 'Available' });
    const transmissions = await Car.distinct('transmission', { status: 'Available' });
    const bodyTypes = await Car.distinct('bodyType', { status: 'Available' });
    const conditions = await Car.distinct('condition', { status: 'Available' });
    
    const priceRange = await Car.aggregate([
      { $match: { status: 'Available' } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    const yearRange = await Car.aggregate([
      { $match: { status: 'Available' } },
      {
        $group: {
          _id: null,
          minYear: { $min: '$year' },
          maxYear: { $max: '$year' }
        }
      }
    ]);

    res.json({
      makes: makes.sort(),
      fuelTypes,
      transmissions,
      bodyTypes,
      conditions,
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
      yearRange: yearRange[0] || { minYear: 2000, maxYear: new Date().getFullYear() }
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN ROUTES

// Get all cars (admin view)
router.get('/admin/all', auth, authAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      make,
      model,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (make) filter.make = new RegExp(make, 'i');
    if (model) filter.model = new RegExp(model, 'i');

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;
    
    const cars = await Car.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');

    const total = await Car.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      cars,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalCars: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching cars (admin):', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new car (admin only)
router.post('/admin', auth, authAdmin, upload.array('images', 10), async (req, res) => {
  try {
    console.log('=== DEBUG: Received req.body ===');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('=== END DEBUG ===');
    
    const carData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Parse features if it's a string
    if (typeof carData.features === 'string') {
      carData.features = carData.features.split(',').map(f => f.trim()).filter(f => f);
    }

    // Parse location if it's a string
    if (typeof carData.location === 'string') {
      carData.location = JSON.parse(carData.location);
    }

    // Parse contactInfo if it's a string
    if (typeof carData.contactInfo === 'string') {
      carData.contactInfo = JSON.parse(carData.contactInfo);
    }

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      carData.images = req.files.map((file, index) => ({
        url: `/uploads/cars/${file.filename}`,
        alt: `${carData.make} ${carData.model} - Image ${index + 1}`,
        isPrimary: index === 0
      }));
    }

    const car = new Car(carData);
    await car.save();

    res.status(201).json(car);
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update car (admin only)
router.put('/admin/:id', auth, authAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Exclude createdBy from updates as it should never be modified
    const { createdBy, ...bodyData } = req.body;
    const updateData = {
      ...bodyData,
      updatedBy: req.user.id
    };

    // Parse features if it's a string
    if (typeof updateData.features === 'string') {
      updateData.features = updateData.features.split(',').map(f => f.trim()).filter(f => f);
    }

    // Parse location if it's a string
    if (typeof updateData.location === 'string') {
      updateData.location = JSON.parse(updateData.location);
    }

    // Parse contactInfo if it's a string
    if (typeof updateData.contactInfo === 'string') {
      updateData.contactInfo = JSON.parse(updateData.contactInfo);
    }

    // Handle new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/cars/${file.filename}`,
        alt: `${updateData.make || car.make} ${updateData.model || car.model} - Image ${index + 1}`,
        isPrimary: index === 0 && (!updateData.keepExistingImages || updateData.keepExistingImages === 'false')
      }));

      if (updateData.keepExistingImages === 'true') {
        updateData.images = [...car.images, ...newImages];
      } else {
        updateData.images = newImages;
      }
    }

    Object.assign(car, updateData);
    await car.save();

    res.json(car);
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete car (admin only)
router.delete('/admin/:id', auth, authAdmin, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Delete associated images
    car.images.forEach(image => {
      const imagePath = path.join(__dirname, '..', image.url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single car by ID (admin view)
router.get('/admin/:id', auth, authAdmin, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('updatedBy', 'username email');
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json(car);
  } catch (error) {
    console.error('Error fetching car (admin):', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid car ID format' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Get car statistics (admin only)
router.get('/admin/stats', auth, authAdmin, async (req, res) => {
  try {
    const totalCars = await Car.countDocuments();
    const availableCars = await Car.countDocuments({ status: 'Available' });
    const soldCars = await Car.countDocuments({ status: 'Sold' });
    const featuredCars = await Car.countDocuments({ featured: true });
    
    const totalViews = await Car.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);

    const topMakes = await Car.aggregate([
      { $group: { _id: '$make', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalCars,
      availableCars,
      soldCars,
      featuredCars,
      totalViews: totalViews[0]?.totalViews || 0,
      topMakes
    });
  } catch (error) {
    console.error('Error fetching car stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;