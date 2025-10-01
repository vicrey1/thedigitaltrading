// src/pages/admin/Cars.js
import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import debounce from 'lodash/debounce';
import { getAdminCars, createCar, updateCar, deleteCar } from '../../services/carAPI';

const AdminCars = () => {
  const { isDarkMode } = useTheme();
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: 'make',
    direction: 'asc'
  });
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    color: '',
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    bodyType: 'Sedan',
    description: '',
    features: [],
        images: [],
    condition: 'Used',
    location: {
      city: '',
      state: '',
      zipCode: ''
    },
    contactInfo: {
      phone: '',
      email: ''
    },
    status: 'Available',
    featured: false
  });

  useEffect(() => {
    fetchCars();
  // Only fetch cars once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((term) => {
      fetchCars();
    }, 300),
    [] // Empty dependency array since fetchCars is stable
  );

  // Effect to handle search term changes
  useEffect(() => {
    debouncedSearch(searchTerm);
    // Clean up debounce on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const filters = {
        search: searchTerm,
        status: filter !== 'all' ? filter : undefined
      };
      const response = await getAdminCars(filters);
      setCars(response.cars || []);
    } catch (error) {
          // Show error message to user
      alert('Failed to load cars. Please try again.');
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (data) => {
    const errors = {};
    const currentYear = new Date().getFullYear();

    if (data.year < 1900 || data.year > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}`;
    }

    if (data.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    if (data.mileage < 0) {
      errors.mileage = 'Mileage cannot be negative';
    }

    if (data.contactInfo.phone && !/^\+?[\d\s-()]+$/.test(data.contactInfo.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    if (data.contactInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactInfo.email)) {
      errors.email = 'Invalid email format';
    }

    if (data.images.length === 0) {
      errors.images = 'At least one image is required';
    }

    return errors;
  };

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstError}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare form data with proper image handling
      const submitData = {
        ...formData,
        // Only include new file uploads, not existing images
        images: formData.images.filter(img => img.file).map(img => img.file),
        // Don't stringify here - carAPI.js will handle the stringification
        location: formData.location,
        contactInfo: formData.contactInfo
      };

      // For updates, add flag to keep existing images if no new images are uploaded
      if (!isCreating) {
        const hasNewImages = submitData.images.length > 0;
        const hasExistingImages = formData.images.some(img => !img.file);
        
        if (hasExistingImages && hasNewImages) {
          // Keep existing images and add new ones
          submitData.keepExistingImages = 'true';
        } else if (hasExistingImages && !hasNewImages) {
          // Keep existing images only (no new uploads)
          submitData.keepExistingImages = 'true';
          submitData.images = []; // No new images to upload
        }
        // If only new images, replace all (default behavior)
      }
      
      if (isCreating) {
        const response = await createCar(submitData);
        if (response.error) {
          throw new Error(response.error);
        }
      } else {
        const response = await updateCar(selectedCar._id, submitData);
        if (response.error) {
          throw new Error(response.error);
        }
      }
      await fetchCars();
      resetForm();
      // Show success message
      alert(isCreating ? 'Car created successfully!' : 'Car updated successfully!');
    } catch (error) {
      // Set specific error message based on the error
      setFormErrors({
        submit: error.message || 'Failed to save car. Please try again.'
      });
      // Scroll error into view
      const errorElement = document.querySelector('[data-error="submit"]');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const currentImages = formData.images || [];
    const newImages = files.map(file => ({
      file,
      isPrimary: currentImages.length === 0 // First image is primary by default
    }));
    
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...newImages].slice(0, 10) // Limit to 10 images
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => {
      const currentImages = prev.images || [];
      const newImages = currentImages.filter((_, i) => i !== index);
      // If we removed the primary image, make the first remaining image primary
      if (currentImages[index] && currentImages[index].isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return { ...prev, images: newImages };
    });
  };

  const setPrimaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, carId: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (car) => {
    setDeleteConfirmation({
      show: true,
      carId: car._id,
      carName: `${car.year} ${car.make} ${car.model}`
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirmation.carId) return;
    
    setIsDeleting(true);
    try {
      await deleteCar(deleteConfirmation.carId);
      await fetchCars();
      alert('Car deleted successfully!');
    } catch (error) {
      alert('Failed to delete car. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({ show: false, carId: null, carName: '' });
    }
  };

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: '',
      price: '',
      mileage: '',
      color: '',
      fuelType: 'Gasoline',
      transmission: 'Automatic',
      bodyType: 'Sedan',
      description: '',
      features: [],
      images: [],
      condition: 'Used',
      location: {
        city: '',
        state: '',
        zipCode: ''
      },
      contactInfo: {
        phone: '',
        email: ''
      },
      status: 'Available',
      featured: false
    });
    setSelectedCar(null);
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleEdit = (car) => {
    setSelectedCar(car);
    setFormData({
      ...car,
      features: car.features || [],
      // Structure existing images to match the expected format
      images: (car.images || []).map(img => ({
        url: img.url || img,
        isPrimary: img.isPrimary || false,
        alt: img.alt || '',
        // No 'file' property for existing images
      }))
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // If clicking the same column, toggle direction
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      // If clicking a different column, sort ascending by that column
      return { key, direction: 'asc' };
    });
  };

  // Function to sort cars based on current sort config
  const sortCars = (cars) => {
    return [...cars].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested properties (e.g., 'location.city')
      if (sortConfig.key.includes('.')) {
        const keys = sortConfig.key.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      const compareResult = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === 'asc' ? compareResult : -compareResult;
    });
  };

  const filteredCars = sortCars(cars.filter(car => {
    const matchesSearch = car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         car.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || car.status === filter;
    return matchesSearch && matchesFilter;
  }));

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Car Management</h1>
          <button
            onClick={handleCreate}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FiPlus /> Add New Car
          </button>
        </div>

  {/* Search and Filter */}
  <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search cars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 px-4 py-2 rounded-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
            }`}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border w-full md:w-auto ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
            }`}
          >
            <option value="all">All Status</option>
            <option value="Available">Available</option>
            <option value="Sold">Sold</option>
            <option value="Reserved">Reserved</option>
            <option value="Under Maintenance">Under Maintenance</option>
          </select>
        </div>

        {/* Car Form */}
        {(isCreating || isEditing) && (
          <div className={`mb-8 p-6 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}>
            <h2 className="text-xl font-semibold mb-4">
              {isCreating ? 'Add New Car' : 'Edit Car'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Make"
                value={formData.make}
                onChange={(e) => setFormData({...formData, make: e.target.value})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
                required
              />
              <input
                type="text"
                placeholder="Model"
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                } ${formErrors.model ? 'border-red-500' : ''}`}
                required
              />
              <input
                type="number"
                name="year"
                placeholder="Year"
                value={formData.year}
                onChange={(e) => {
                  setFormData({...formData, year: e.target.value});
                  if (formErrors.year) {
                    const newErrors = {...formErrors};
                    delete newErrors.year;
                    setFormErrors(newErrors);
                  }
                }}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                } ${formErrors.year ? 'border-red-500' : ''}`}
                required
              />
              {formErrors.year && (
                <div className="md:col-span-2 text-red-500 text-sm mt-1">
                  {formErrors.year}
                </div>
              )}
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
                required
              />
              <input
                type="number"
                placeholder="Mileage"
                value={formData.mileage}
                onChange={(e) => setFormData({...formData, mileage: e.target.value})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
              <input
                type="text"
                placeholder="Color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
                required
              />
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({...formData, fuelType: e.target.value})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="Gasoline">Gasoline</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
                <option value="LPG">LPG</option>
              </select>
              <select
                value={formData.transmission}
                onChange={(e) => setFormData({...formData, transmission: e.target.value})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
                <option value="CVT">CVT</option>
                <option value="Semi-Automatic">Semi-Automatic</option>
              </select>
              <select
                value={formData.bodyType}
                onChange={(e) => setFormData({...formData, bodyType: e.target.value})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Coupe">Coupe</option>
                <option value="Convertible">Convertible</option>
                <option value="Wagon">Wagon</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
              </select>
              <input
                type="text"
                placeholder="City"
                value={formData.location.city}
                onChange={(e) => setFormData({...formData, location: {...formData.location, city: e.target.value}})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
                required
              />
              <input
                type="text"
                placeholder="State"
                value={formData.location.state}
                onChange={(e) => setFormData({...formData, location: {...formData.location, state: e.target.value}})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
                required
              />
              <input
                type="text"
                placeholder="Zip Code (Optional)"
                value={formData.location.zipCode}
                onChange={(e) => setFormData({...formData, location: {...formData.location, zipCode: e.target.value}})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
              <input
                type="tel"
                placeholder="Contact Phone"
                value={formData.contactInfo.phone}
                onChange={(e) => setFormData({...formData, contactInfo: {...formData.contactInfo, phone: e.target.value}})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
                required
              />
              <input
                type="email"
                placeholder="Contact Email"
                value={formData.contactInfo.email}
                onChange={(e) => setFormData({...formData, contactInfo: {...formData.contactInfo, email: e.target.value}})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
                required
              />
              <select
                value={formData.condition}
                onChange={(e) => setFormData({...formData, condition: e.target.value})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Certified Pre-Owned">Certified Pre-Owned</option>
              </select>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className={`px-4 py-2 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
                <option value="Reserved">Reserved</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={`md:col-span-2 px-4 py-2 rounded-lg border h-24 ${
                  isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              />
              
              {/* Image Upload Section */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Car Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <p className="text-sm text-gray-500 mt-1">Upload up to 10 images (max 5MB each)</p>
                
                {/* Image Preview */}
                {formData.images && formData.images.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Uploaded Images:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {formData.images.map((image, index) => {
                        // Generate image source with error handling
                        let imageSrc;
                        try {
                          if (image.url) {
                            // Existing image with URL
                            imageSrc = image.url;
                          } else if (image.file) {
                            // New uploaded file
                            imageSrc = URL.createObjectURL(image.file);
                          } else {
                            // Fallback for malformed image objects
                            imageSrc = null;
                          }
                        } catch (error) {
                          console.error('Error creating image URL:', error);
                          imageSrc = null;
                        }

                        return (
                          <div key={index} className="relative">
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={`${index + 1}`}
                                className="w-full h-24 object-cover rounded border"
                                onError={(e) => {
                                  console.error('Image failed to load:', e.target.src);
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-24 bg-gray-200 rounded border flex items-center justify-center">
                                <span className="text-gray-500 text-xs">Invalid Image</span>
                              </div>
                            )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                          <div className="mt-1 flex items-center gap-1">
                            <input
                              type="radio"
                              name="primaryImage"
                              checked={image.isPrimary}
                              onChange={() => setPrimaryImage(index)}
                              className="w-3 h-3"
                            />
                            <label className="text-xs">Primary</label>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                  className="w-4 h-4"
                />
                <label htmlFor="featured">Featured Car</label>
              </div>
              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-white ${
                    isSubmitting
                      ? 'bg-green-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {isCreating ? 'Creating...' : 'Updating...'}
                    </>
                  ) : (
                    <>{isCreating ? 'Create Car' : 'Update Car'}</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className={`px-6 py-2 rounded-lg text-white ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  Cancel
                </button>
              </div>

              {Object.keys(formErrors).length > 0 && (
                <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mt-4">
                  <p className="font-medium">Please fix the following errors:</p>
                  <ul className="list-disc list-inside mt-2">
                    {Object.values(formErrors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Cars List: table on md+, stacked cards on small screens */}
        <div className={`rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
          {/* Table for medium+ screens */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <tr>
                  <th 
                    onClick={() => handleSort('make')}
                    className={`text-left p-4 cursor-pointer select-none hover:bg-gray-50 ${
                      isDarkMode ? 'hover:bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Car
                      {sortConfig.key === 'make' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('year')}
                    className={`text-left p-4 cursor-pointer select-none hover:bg-gray-50 ${
                      isDarkMode ? 'hover:bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Year
                      {sortConfig.key === 'year' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('price')}
                    className={`text-left p-4 cursor-pointer select-none hover:bg-gray-50 ${
                      isDarkMode ? 'hover:bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Price
                      {sortConfig.key === 'price' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('mileage')}
                    className={`text-left p-4 cursor-pointer select-none hover:bg-gray-50 ${
                      isDarkMode ? 'hover:bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Mileage
                      {sortConfig.key === 'mileage' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className={`text-left p-4 cursor-pointer select-none hover:bg-gray-50 ${
                      isDarkMode ? 'hover:bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortConfig.key === 'status' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('featured')}
                    className={`text-left p-4 cursor-pointer select-none hover:bg-gray-50 ${
                      isDarkMode ? 'hover:bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      Featured
                      {sortConfig.key === 'featured' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.map((car) => (
                  <tr key={car._id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="p-4">
                      <div>
                        <div className="font-semibold">{car.make} {car.model}</div>
                        <div className="text-sm opacity-70">{car.bodyType} • {car.fuelType}</div>
                      </div>
                    </td>
                    <td className="p-4">{car.year}</td>
                    <td className="p-4">${car.price?.toLocaleString()}</td>
                    <td className="p-4">{car.mileage?.toLocaleString()} miles</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        car.status === 'available' ? 'bg-green-100 text-green-800' :
                        car.status === 'sold' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {car.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {car.featured && (
                        <span className="text-yellow-500">⭐</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(car)} className="text-blue-600 hover:text-blue-800 p-1" title="Edit Car"><FiEdit /></button>
                        <button onClick={() => handleDeleteClick(car)} className="text-red-600 hover:text-red-800 p-1" title="Delete Car"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked card view for small screens */}
          <div className="md:hidden space-y-3 p-3">
            {filteredCars.map((car) => (
              <div key={car._id} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-24 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    {car.images && car.images[0] ? (
                      <img src={car.images[0].url || car.images[0]} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Image</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold truncate">{car.make} {car.model}</div>
                        <div className="text-sm text-gray-500 truncate">{car.bodyType} • {car.fuelType}</div>
                      </div>
                      <div className="text-sm font-medium ml-2">${car.price?.toLocaleString()}</div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                      <div>{car.year} • {car.mileage?.toLocaleString()} mi</div>
                      <div>
                        {car.featured && <span className="text-yellow-500 mr-2">⭐</span>}
                        <span className={`px-2 py-1 rounded-full text-xs ${car.status === 'available' ? 'bg-green-100 text-green-800' : car.status === 'sold' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{car.status}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleEdit(car)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded">Edit</button>
                      <button onClick={() => handleDelete(car._id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredCars.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No cars found.</p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`relative max-w-md w-full rounded-lg shadow-lg p-6 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
              <p className="mb-6">
                Are you sure you want to delete this car?
                <br />
                <span className="font-semibold">{deleteConfirmation.carName}</span>
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeleteConfirmation({ show: false, carId: null })}
                  disabled={isDeleting}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-gray-200 hover:bg-gray-300'
                  } text-gray-900`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`px-4 py-2 rounded-lg text-white ${
                    isDeleting
                      ? 'bg-red-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Deleting...
                    </div>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCars;