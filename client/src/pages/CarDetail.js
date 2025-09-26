// src/pages/CarDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPhone, FiMail, FiMapPin, FiCalendar, FiTrendingUp, FiSettings, FiZap } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { getCarById, getCars } from '../services/carAPI';
import { getCarImageUrl } from '../utils/imageUtils';

const CarDetail = () => {
  const { id } = useParams();
  const { isDarkMode } = useTheme();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [relatedCars, setRelatedCars] = useState([]);

  useEffect(() => {
    fetchCarDetail();
  }, [id, fetchCarDetail]);

  const fetchCarDetail = useCallback(async () => {
    setLoading(true);
    try {
      const carData = await getCarById(id);
      setCar(carData.car);
      
      // Fetch related cars (same make or similar price range)
      const filters = {
        make: carData.car.make,
        limit: 4
      };
      const response = await getCars(filters);
      const related = (response.cars || []).filter(relatedCar => relatedCar._id !== id);
      setRelatedCars(related);
    } catch (error) {
      console.error('Failed to fetch car details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const nextImage = () => {
    if (car.images && car.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
    }
  };

  const prevImage = () => {
    if (car.images && car.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading car details...</div>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Car Not Found</h1>
            <Link to="/cars" className="text-blue-600 hover:text-blue-800">
              ← Back to Car Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          to="/cars" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
        >
          <FiArrowLeft /> Back to Car Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div>
            <div className="relative mb-4">
              <div className="h-96 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden">
                {car.images && car.images.length > 0 ? (
                  <img
                    src={getCarImageUrl(car.images[currentImageIndex], `/uploads/cars/${car.images[currentImageIndex]}`)}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/600/400';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🚗</div>
                      <div>No Image Available</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image Navigation */}
              {car.images && car.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    ←
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                  >
                    →
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {car.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-3 h-3 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {car.images && car.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {car.images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-20 rounded border-2 overflow-hidden ${
                      index === currentImageIndex ? 'border-blue-500' : 'border-gray-300'
                    }`}
                  >
                    <img 
                      src={getCarImageUrl(image, `/uploads/cars/${image}`)}
                      alt={`${car.make} ${car.model} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Failed to load thumbnail:', e.target.src);
                        e.target.style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Car Information */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{car.make} {car.model}</h1>
                <div className="text-4xl font-bold text-green-600 mb-4">
                  ${car.price?.toLocaleString()}
                </div>
              </div>
              {car.featured && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  ⭐ Featured
                </span>
              )}
            </div>

            {/* Key Specifications */}
            <div className={`grid grid-cols-2 gap-4 p-6 rounded-lg border mb-6 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <FiCalendar className="text-blue-500" />
                <div>
                  <div className="text-sm opacity-70">Year</div>
                  <div className="font-semibold">{car.year}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <FiTrendingUp className="text-green-500" />
                <div>
                  <div className="text-sm opacity-70">Mileage</div>
                  <div className="font-semibold">{car.mileage?.toLocaleString()} miles</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <FiZap className="text-yellow-500" />
                <div>
                  <div className="text-sm opacity-70">Fuel Type</div>
                  <div className="font-semibold capitalize">{car.fuelType}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <FiSettings className="text-purple-500" />
                <div>
                  <div className="text-sm opacity-70">Transmission</div>
                  <div className="font-semibold capitalize">{car.transmission}</div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className={`p-6 rounded-lg border mb-6 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Vehicle Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="opacity-70">Body Type:</span>
                  <span className="ml-2 font-medium capitalize">{car.bodyType}</span>
                </div>
                <div>
                  <span className="opacity-70">Condition:</span>
                  <span className="ml-2 font-medium capitalize">{car.condition}</span>
                </div>
                <div className="col-span-2">
                  <span className="opacity-70">Location:</span>
                  <span className="ml-2 font-medium flex items-center gap-1">
                    <FiMapPin className="w-4 h-4" />
                    {car.location && typeof car.location === 'object' 
                      ? `${car.location.city || ''}, ${car.location.state || ''} ${car.location.zipCode || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '')
                      : car.location || 'Location not specified'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={`p-6 rounded-lg border mb-6 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Contact Seller</h3>
              <div className="flex gap-4">
                {car.contactInfo?.phone && (
                  <a
                    href={`tel:${car.contactInfo.phone}`}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
                  >
                    <FiPhone /> Call {car.contactInfo.phone}
                  </a>
                )}
                
                {car.contactInfo?.email && (
                  <a
                    href={`mailto:${car.contactInfo.email}?subject=Inquiry about ${car.make} ${car.model}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
                  >
                    <FiMail /> Email Seller
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {car.description && (
          <div className={`p-6 rounded-lg border mb-12 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-xl font-semibold mb-4">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {car.description}
            </p>
          </div>
        )}

        {/* Features */}
        {car.features && car.features.length > 0 && (
          <div className={`p-6 rounded-lg border mb-12 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className="text-xl font-semibold mb-4">Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {car.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Cars */}
        {relatedCars.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold mb-6">Similar Cars</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCars.slice(0, 3).map((relatedCar) => (
                <Link
                  key={relatedCar._id}
                  to={`/cars/${relatedCar._id}`}
                  className={`block rounded-lg border overflow-hidden hover:shadow-lg transition-shadow ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300">
                    {relatedCar.images && relatedCar.images.length > 0 ? (
                      <img 
                        src={getCarImageUrl(relatedCar.images[0], `/uploads/cars/${relatedCar.images[0]}`)}
                        alt={`${relatedCar.make} ${relatedCar.model}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/300/200';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        🚗
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-semibold mb-1">{relatedCar.make} {relatedCar.model}</h4>
                    <div className="text-green-600 font-bold mb-2">
                      ${relatedCar.price?.toLocaleString()}
                    </div>
                    <div className="text-sm opacity-70">
                      {relatedCar.year} • {relatedCar.mileage?.toLocaleString()} miles
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarDetail;