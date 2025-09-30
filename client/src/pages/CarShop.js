// src/pages/CarShop.js
import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiEye, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { getCars } from '../services/carAPI';
import { getCarImageUrl } from '../utils/imageUtils';

const CarShop = () => {
  const { isDarkMode } = useTheme();
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    make: '',
    bodyType: '',
    fuelType: '',
    transmission: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCars();
      setCars(response.cars || []);
    } catch (error) {
      console.error('Failed to fetch cars:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = cars.filter(car => {
      const matchesSearch = 
        car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMake = !filters.make || car.make === filters.make;
      const matchesBodyType = !filters.bodyType || car.bodyType === filters.bodyType;
      const matchesFuelType = !filters.fuelType || car.fuelType === filters.fuelType;
      const matchesTransmission = !filters.transmission || car.transmission === filters.transmission;
      const matchesCondition = !filters.condition || car.condition === filters.condition;
      const matchesMinPrice = !filters.minPrice || car.price >= parseInt(filters.minPrice);
      const matchesMaxPrice = !filters.maxPrice || car.price <= parseInt(filters.maxPrice);
      const matchesMinYear = !filters.minYear || car.year >= parseInt(filters.minYear);
      const matchesMaxYear = !filters.maxYear || car.year <= parseInt(filters.maxYear);
      
      return matchesSearch && matchesMake && matchesBodyType && matchesFuelType && 
             matchesTransmission && matchesCondition && matchesMinPrice && 
             matchesMaxPrice && matchesMinYear && matchesMaxYear;
    });

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'year-new':
        filtered.sort((a, b) => b.year - a.year);
        break;
      case 'year-old':
        filtered.sort((a, b) => a.year - b.year);
        break;
      case 'mileage-low':
        filtered.sort((a, b) => a.mileage - b.mileage);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    setFilteredCars(filtered);
  }, [cars, searchTerm, filters, sortBy]);

  useEffect(() => {
    fetchCars();
  // Only fetch cars once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
  // Dependencies are tracked in the useCallback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyFilters]);

  const resetFilters = () => {
    setFilters({
      make: '',
      bodyType: '',
      fuelType: '',
      transmission: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
      minYear: '',
      maxYear: ''
    });
    setSearchTerm('');
  };

  const getUniqueValues = (field) => {
    return [...new Set(cars.map(car => car[field]).filter(Boolean))];
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading cars...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Hero Section */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Premium Car Collection</h1>
            <p className="text-lg opacity-80 mb-8">Discover your perfect luxury vehicle from our curated selection</p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by make, model, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-lg border text-lg ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
            >
              <FiFilter /> Filters
            </button>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="year-new">Year: Newest First</option>
              <option value="year-old">Year: Oldest First</option>
              <option value="mileage-low">Mileage: Low to High</option>
            </select>
          </div>
          
          <div className="text-sm opacity-70">
            {filteredCars.length} of {cars.length} cars
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className={`mb-8 p-6 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <select
                value={filters.make}
                onChange={(e) => setFilters({...filters, make: e.target.value})}
                className={`px-3 py-2 rounded border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">All Makes</option>
                {getUniqueValues('make').map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
              
              <select
                value={filters.bodyType}
                onChange={(e) => setFilters({...filters, bodyType: e.target.value})}
                className={`px-3 py-2 rounded border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">All Body Types</option>
                {getUniqueValues('bodyType').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              <select
                value={filters.fuelType}
                onChange={(e) => setFilters({...filters, fuelType: e.target.value})}
                className={`px-3 py-2 rounded border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">All Fuel Types</option>
                {getUniqueValues('fuelType').map(fuel => (
                  <option key={fuel} value={fuel}>{fuel}</option>
                ))}
              </select>
              
              <select
                value={filters.condition}
                onChange={(e) => setFilters({...filters, condition: e.target.value})}
                className={`px-3 py-2 rounded border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">All Conditions</option>
                {getUniqueValues('condition').map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                className={`px-3 py-2 rounded border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                className={`px-3 py-2 rounded border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
              <input
                type="number"
                placeholder="Min Year"
                value={filters.minYear}
                onChange={(e) => setFilters({...filters, minYear: e.target.value})}
                className={`px-3 py-2 rounded border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
              <input
                type="number"
                placeholder="Max Year"
                value={filters.maxYear}
                onChange={(e) => setFilters({...filters, maxYear: e.target.value})}
                className={`px-3 py-2 rounded border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
            </div>
            
            <button
              onClick={resetFilters}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Cars Grid */}
        {filteredCars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl opacity-70">No cars found matching your criteria.</p>
            <button
              onClick={resetFilters}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Clear filters to see all cars
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCars.map((car) => (
              <div key={car._id} className={`rounded-lg border overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${
                isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                {/* Car Image */}
                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  {car.images && car.images.length > 0 ? (
                    <img 
                      src={getCarImageUrl(car.images[0], `/uploads/cars/${car.images[0]}`)}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/400/300';
                      }}
                    />
                  ) : (
                    <div className="text-gray-500 text-center">
                      <div className="text-4xl mb-2">🚗</div>
                      <div>No Image</div>
                    </div>
                  )}
                </div>
                
                {/* Car Details */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{car.make} {car.model}</h3>
                    {car.featured && (
                      <span className="text-yellow-500 text-xl">⭐</span>
                    )}
                  </div>
                  
                  <div className="text-2xl font-bold text-green-600 mb-3">
                    ${car.price?.toLocaleString()}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm opacity-80 mb-4">
                    <div>Year: {car.year}</div>
                    <div>Mileage: {car.mileage?.toLocaleString()} mi</div>
                    <div>Fuel: {car.fuelType}</div>
                    <div>Type: {car.bodyType}</div>
                  </div>
                  
                  <p className="text-sm opacity-70 mb-4 line-clamp-2">
                    {car.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm opacity-70 mb-4">
                    <FiMapPin className="w-4 h-4" />
                    <span>
                      {car.location && typeof car.location === 'object' 
                        ? `${car.location.city || ''}, ${car.location.state || ''} ${car.location.zipCode || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '')
                        : car.location || 'Location not specified'
                      }
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link
                      to={`/cars/${car._id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center flex items-center justify-center gap-2"
                    >
                      <FiEye /> View Details
                    </Link>
                    
                    {car.contactInfo?.phone && (
                      <a
                        href={`tel:${car.contactInfo.phone}`}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center"
                      >
                        <FiPhone />
                      </a>
                    )}
                    
                    {car.contactInfo?.email && (
                      <a
                        href={`mailto:${car.contactInfo.email}`}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center justify-center"
                      >
                        <FiMail />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarShop;