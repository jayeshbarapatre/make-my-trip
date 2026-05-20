import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { vendorHotelsService, vendorFlightsService, vendorBusesService } from '../services/vendorService';
import { adminService, adminFlightsService, adminHotelsService, adminBusesService } from '../services/adminService';

const SaaSContext = createContext();

// Predefined field configurations for dynamic listings form matching standard schemas
const DEFAULT_FIELDS = {
  hotel: [
    { name: 'name', label: 'Hotel Name', type: 'text', required: true, section: 'Basic Information', placeholder: 'Grand Palace Resort' },
    { name: 'city', label: 'City', type: 'text', required: true, section: 'Basic Information', placeholder: 'Mumbai' },
    { name: 'location', label: 'Location / Address', type: 'text', required: false, section: 'Basic Information', placeholder: 'Marine Drive' },
    { name: 'description', label: 'Description', type: 'textarea', required: false, section: 'Basic Information', placeholder: 'Tell guests about your hotel...' },
    { name: 'image', label: 'Image URL', type: 'url', required: false, section: 'Basic Information', placeholder: 'https://images.unsplash.com/...' },
    { name: 'pricePerNight', label: 'Price Per Night (₹)', type: 'number', required: true, section: 'Pricing & Inventory', placeholder: '3500' },
    { name: 'price', label: 'Base Price (₹)', type: 'number', required: true, section: 'Pricing & Inventory', placeholder: '3500' },
    { name: 'rooms', label: 'Total Rooms Available', type: 'number', required: false, section: 'Pricing & Inventory', placeholder: '50' },
    { name: 'rating', label: 'Rating (0-5)', type: 'number', required: false, section: 'Pricing & Inventory', placeholder: '4.5' },
    { name: 'checkin', label: 'Check-in Time', type: 'time', required: false, section: 'Check-in & Check-out', placeholder: '14:00' },
    { name: 'checkout', label: 'Check-out Time', type: 'time', required: false, section: 'Check-in & Check-out', placeholder: '11:00' },
  ],
  flight: [
    { name: 'flightNumber', label: 'Flight Number', type: 'text', required: true, section: 'Basic Information', placeholder: 'AI-101' },
    { name: 'airline', label: 'Airline Name', type: 'text', required: true, section: 'Basic Information', placeholder: 'Air India' },
    { name: 'from', label: 'Departure City', type: 'text', required: true, section: 'Basic Information', placeholder: 'Delhi' },
    { name: 'to', label: 'Arrival City', type: 'text', required: true, section: 'Basic Information', placeholder: 'Mumbai' },
    { name: 'departureTime', label: 'Departure Date & Time', type: 'datetime-local', required: true, section: 'Schedule', placeholder: '' },
    { name: 'arrivalTime', label: 'Arrival Date & Time', type: 'datetime-local', required: true, section: 'Schedule', placeholder: '' },
    { name: 'price', label: 'Ticket Price (₹)', type: 'number', required: true, section: 'Pricing & Inventory', placeholder: '5500' },
    { name: 'seatsAvailable', label: 'Seats Available', type: 'number', required: true, section: 'Pricing & Inventory', placeholder: '180' },
  ],
  bus: [
    { name: 'name', label: 'Travels / Company Name', type: 'text', required: true, section: 'Basic Information', placeholder: 'Neeta Travels' },
    { name: 'busNumber', label: 'Bus Number', type: 'text', required: true, section: 'Basic Information', placeholder: 'MH-04-AB-1234' },
    { name: 'from', label: 'From City', type: 'text', required: true, section: 'Route Details', placeholder: 'Pune' },
    { name: 'to', label: 'To City', type: 'text', required: true, section: 'Route Details', placeholder: 'Goa' },
    { name: 'departureTime', label: 'Departure Time', type: 'time', required: true, section: 'Schedule', placeholder: '21:00' },
    { name: 'arrivalTime', label: 'Arrival Time', type: 'time', required: true, section: 'Schedule', placeholder: '07:00' },
    { name: 'busType', label: 'Bus Type', type: 'select', required: true, section: 'Basic Information', options: ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Luxury Multi-axle Volvo'] },
    { name: 'price', label: 'Ticket Price (₹)', type: 'number', required: true, section: 'Pricing & Inventory', placeholder: '1200' },
    { name: 'seats', label: 'Total Seats', type: 'number', required: true, section: 'Pricing & Inventory', placeholder: '36' },
  ]
};

const DEFAULT_CATEGORIES = [
  { id: 'hotel', name: 'Hotels', icon: '🏨', description: 'Accommodations, resorts, homestays, and boutique villas.', fieldCount: DEFAULT_FIELDS.hotel.length },
  { id: 'flight', name: 'Flights', icon: '✈️', description: 'Commercial flights, domestic & international air travels.', fieldCount: DEFAULT_FIELDS.flight.length },
  { id: 'bus', name: 'Buses', icon: '🚌', description: 'Intercity coaches, sleeper buses, and public route services.', fieldCount: DEFAULT_FIELDS.bus.length },
  { id: 'cab', name: 'Cabs', icon: '🚖', description: 'Local car rentals, outstation trips, and hourly chauffeurs.', fieldCount: 6 },
  { id: 'cruise', name: 'Cruises', icon: '🚢', description: 'Luxury cruise packages and ocean liner tours.', fieldCount: 6 }
];

export const SaaSProvider = ({ children }) => {
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('saas-categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [categoryFields, setCategoryFields] = useState(() => {
    const saved = localStorage.getItem('saas-category-fields');
    return saved ? JSON.parse(saved) : DEFAULT_FIELDS;
  });

  // Local state listings fallback for dynamic categories
  const [customListings, setCustomListings] = useState(() => {
    const saved = localStorage.getItem('saas-custom-listings');
    return saved ? JSON.parse(saved) : [];
  });

  // Notifications
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('saas-notifications');
    return saved ? JSON.parse(saved) : [
      { id: 'n1', title: 'System setup completed', desc: 'SaaS Platform design system loaded successfully.', time: 'Just now', read: false },
      { id: 'n2', title: 'Category cruise registered', desc: 'New generic category Ocean Cruises is ready for submissions.', time: '10 min ago', read: false },
    ];
  });

  useEffect(() => {
    localStorage.setItem('saas-categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('saas-category-fields', JSON.stringify(categoryFields));
  }, [categoryFields]);

  useEffect(() => {
    localStorage.setItem('saas-custom-listings', JSON.stringify(customListings));
  }, [customListings]);

  useEffect(() => {
    localStorage.setItem('saas-notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Add notification
  const addNotification = (title, desc) => {
    const newNotif = {
      id: 'n_' + Date.now(),
      title,
      desc,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Add Dynamic Category
  const addCategory = (category) => {
    if (categories.some(c => c.id === category.id || c.name.toLowerCase() === category.name.toLowerCase())) {
      toast.error('Category with this identifier or name already exists!');
      return false;
    }

    const fields = category.fields || [
      { name: 'name', label: 'Listing Title', type: 'text', required: true, section: 'Basic Information', placeholder: 'Enter name/title' },
      { name: 'description', label: 'Description', type: 'textarea', required: false, section: 'Basic Information', placeholder: 'Detail view information' },
      { name: 'price', label: 'Pricing Amount (₹)', type: 'number', required: true, section: 'Pricing & Inventory', placeholder: '1500' },
      { name: 'image', label: 'Main Image URL', type: 'url', required: false, section: 'Basic Information', placeholder: 'https://images.unsplash.com/...' },
    ];

    const newCategory = {
      id: category.id,
      name: category.name,
      icon: category.icon || '📦',
      description: category.description || 'Generic dynamic category',
      fieldCount: fields.length
    };

    setCategories(prev => [...prev, newCategory]);
    setCategoryFields(prev => ({
      ...prev,
      [category.id]: fields
    }));

    addNotification('New Category Added', `Admin added the category "${category.name}" to the platform.`);
    toast.success(`Category "${category.name}" added successfully!`);
    return true;
  };

  // Save Listing (Supports real API & fallbacks)
  const saveListing = async (categoryId, data, listingId = null) => {
    const isEdit = !!listingId;
    
    // Check if category is standard
    if (categoryId === 'hotel') {
      const payload = {
        name: data.name,
        city: data.city,
        location: data.location || '',
        description: data.description || '',
        pricePerNight: Number(data.pricePerNight || data.price),
        price: Number(data.price),
        rooms: Number(data.rooms || 20),
        rating: Number(data.rating || 4.5),
        checkin: data.checkin || '14:00',
        checkout: data.checkout || '11:00',
        image: data.image || '',
        amenities: data.amenities || []
      };

      if (isEdit) {
        await vendorHotelsService.update(listingId, payload);
        toast.success('Hotel updated successfully');
      } else {
        await vendorHotelsService.create(payload);
        toast.success('Hotel created successfully!');
        addNotification('New Hotel Listing Submitted', `${data.name} is waiting for admin approval.`);
      }
      return true;
    }

    if (categoryId === 'flight') {
      const payload = {
        flightNumber: data.flightNumber,
        airline: data.airline,
        from: data.from,
        to: data.to,
        departureTime: data.departureTime,
        arrivalTime: data.arrivalTime,
        price: Number(data.price),
        seatsAvailable: Number(data.seatsAvailable || 100),
      };

      if (isEdit) {
        await vendorFlightsService.update(listingId, payload);
        toast.success('Flight updated successfully');
      } else {
        await vendorFlightsService.create(payload);
        toast.success('Flight created successfully!');
        addNotification('New Flight Listing Submitted', `Flight ${data.flightNumber} by ${data.airline} submitted.`);
      }
      return true;
    }

    if (categoryId === 'bus') {
      const payload = {
        name: data.name,
        busNumber: data.busNumber,
        from: data.from,
        to: data.to,
        departureTime: data.departureTime || '20:00',
        arrivalTime: data.arrivalTime || '08:00',
        busType: data.busType || 'AC Sleeper',
        price: Number(data.price),
        seats: Number(data.seats || 36),
      };

      if (isEdit) {
        await vendorBusesService.update(listingId, payload);
        toast.success('Bus updated successfully');
      } else {
        await vendorBusesService.create(payload);
        toast.success('Bus created successfully!');
        addNotification('New Bus Listing Submitted', `${data.name} route ${data.from} to ${data.to} submitted.`);
      }
      return true;
    }

    // Dynamic category listings fallback (simulated database with localStorage)
    const newListing = {
      id: listingId || 'lst_' + Date.now(),
      categoryId,
      ...data,
      price: Number(data.price),
      listingStatus: data.listingStatus || 'PENDING_APPROVAL',
      submittedAt: new Date().toISOString(),
      vendor: {
        name: 'SaaS Multi-Vendor Partner',
        email: 'partner@platform.com'
      }
    };

    if (isEdit) {
      setCustomListings(prev => prev.map(item => item.id === listingId ? newListing : item));
      toast.success('Listing updated successfully!');
    } else {
      setCustomListings(prev => [newListing, ...prev]);
      toast.success('Listing submitted successfully!');
      addNotification('Generic Submission Awaiting Review', `Listing under category "${categories.find(c => c.id === categoryId)?.name}" submitted.`);
    }
    return true;
  };

  // Submit Listing for approval
  const submitListingForApproval = async (categoryId, id) => {
    try {
      if (categoryId === 'hotel') {
        await vendorHotelsService.submit(id);
      } else if (categoryId === 'flight') {
        await vendorFlightsService.submit(id);
      } else if (categoryId === 'bus') {
        await vendorBusesService.submit(id);
      } else {
        setCustomListings(prev => prev.map(item => item.id === id ? { ...item, listingStatus: 'PENDING_APPROVAL' } : item));
      }
      toast.success('Listing submitted for Admin approval!');
      addNotification('Listing Status Updated', `A listing has been submitted for approval.`);
      return true;
    } catch {
      toast.error('Failed to submit listing');
      return false;
    }
  };

  // Admin approval workflow
  const updateListingStatusByAdmin = async (categoryId, id, status, reason = '') => {
    try {
      if (categoryId === 'hotel') {
        if (status === 'APPROVED') {
          await adminService.approveHotel(id);
        } else {
          await adminService.rejectHotel(id, { reason });
        }
      } else if (categoryId === 'flight') {
        if (status === 'APPROVED') {
          await adminService.approveFlight(id);
        } else {
          await adminService.rejectFlight(id, { reason });
        }
      } else {
        // dynamic category fallback
        setCustomListings(prev => prev.map(item => item.id === id ? {
          ...item,
          listingStatus: status,
          rejectionReason: status === 'REJECTED' ? reason : undefined
        } : item));
      }
      addNotification('Listing Review Completed', `Listing status updated to ${status}.`);
      toast.success(`Listing successfully ${status.toLowerCase()}!`);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update approval status');
      return false;
    }
  };

  // Delete listing
  const deleteListing = async (categoryId, id) => {
    try {
      if (categoryId === 'hotel') {
        await vendorHotelsService.delete(id);
      } else if (categoryId === 'flight') {
        await vendorFlightsService.delete(id);
      } else if (categoryId === 'bus') {
        await vendorBusesService.delete(id);
      } else {
        setCustomListings(prev => prev.filter(item => item.id !== id));
      }
      toast.success('Listing deleted');
      return true;
    } catch {
      toast.error('Failed to delete listing');
      return false;
    }
  };

  return (
    <SaaSContext.Provider value={{
      categories,
      categoryFields,
      customListings,
      notifications,
      addCategory,
      saveListing,
      submitListingForApproval,
      updateListingStatusByAdmin,
      deleteListing,
      addNotification,
      markAllNotificationsRead
    }}>
      {children}
    </SaaSContext.Provider>
  );
};

export const useSaaS = () => {
  const context = useContext(SaaSContext);
  if (!context) {
    throw new Error('useSaaS must be used within a SaaSProvider');
  }
  return context;
};
