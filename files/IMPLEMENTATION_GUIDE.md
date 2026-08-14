# Hotel & Flight Booking System - Implementation Guide for TripOra

## Overview
This guide maps the comprehensive system architecture to your existing TripOra backend and frontend structure.

---

## Part 1: Backend Migration Steps

### Step 1: Update Database Models (Sequelize/Prisma)

#### 1.1 Install Required Packages
```bash
cd makemytrip-backend

npm install pg sequelize@6.35.2 bcryptjs jsonwebtoken nodemailer bull redis aws-sdk joi dotenv-expand uuid

npm install --save-dev sequelize-cli
```

#### 1.2 Initialize Sequelize
```bash
npx sequelize-cli init
```

This creates:
```
makemytrip-backend/
├── config/          # Database config
├── models/          # Model definitions
├── migrations/      # Database migrations
├── seeders/         # Seed data
└── .sequelizerc     # Sequelize CLI config
```

#### 1.3 Create User Model
**File:** `src/models/User.js`
```javascript
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: { isEmail: true }
    },
    phone: DataTypes.STRING(20),
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    firstName: DataTypes.STRING(100),
    lastName: DataTypes.STRING(100),
    role: {
      type: DataTypes.ENUM('USER', 'ADMIN', 'HOTEL_VENDOR', 'FLIGHT_VENDOR'),
      defaultValue: 'USER'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verificationToken: DataTypes.STRING(255),
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
      defaultValue: 'ACTIVE'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    lastLogin: DataTypes.DATE
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['status'] }
    ]
  });

  User.associate = (models) => {
    User.hasMany(models.Hotel, { foreignKey: 'vendorId', as: 'hotels' });
    User.hasMany(models.HotelBooking, { foreignKey: 'userId' });
    User.hasMany(models.FlightBooking, { foreignKey: 'userId' });
    User.hasMany(models.Airline, { foreignKey: 'vendorId' });
    User.hasMany(models.Payment, { foreignKey: 'userId' });
  };

  return User;
};
```

#### 1.4 Create Hotel Model
**File:** `src/models/Hotel.js`
```javascript
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Hotel = sequelize.define('Hotel', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    vendorId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: DataTypes.TEXT,
    address: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      index: true
    },
    state: DataTypes.STRING(100),
    country: DataTypes.STRING(100),
    latitude: DataTypes.DECIMAL(10, 8),
    longitude: DataTypes.DECIMAL(11, 8),
    starRating: {
      type: DataTypes.DECIMAL(3, 1),
      defaultValue: 0
    },
    amenities: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    checkInTime: {
      type: DataTypes.TIME,
      defaultValue: '14:00:00'
    },
    checkOutTime: {
      type: DataTypes.TIME,
      defaultValue: '11:00:00'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'hotels',
    timestamps: true
  });

  Hotel.associate = (models) => {
    Hotel.belongsTo(models.User, { foreignKey: 'vendorId', as: 'vendor' });
    Hotel.hasMany(models.HotelImage, { foreignKey: 'hotelId', as: 'images' });
    Hotel.hasMany(models.Room, { foreignKey: 'hotelId', as: 'rooms' });
    Hotel.hasMany(models.HotelBooking, { foreignKey: 'hotelId' });
  };

  return Hotel;
};
```

#### 1.5 Create Room Model
**File:** `src/models/Room.js`
```javascript
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Room = sequelize.define('Room', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    hotelId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'hotels', key: 'id' }
    },
    categoryName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: DataTypes.TEXT,
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    totalRooms: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    availableRooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        isLessThanOrEqualToTotal(value) {
          if (value > this.totalRooms) {
            throw new Error('Available rooms cannot exceed total rooms');
          }
        }
      }
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    amenities: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'rooms',
    timestamps: true
  });

  Room.associate = (models) => {
    Room.belongsTo(models.Hotel, { foreignKey: 'hotelId', as: 'hotel' });
    Room.hasMany(models.HotelBooking, { foreignKey: 'roomId' });
  };

  return Room;
};
```

#### 1.6 Create HotelBooking Model
**File:** `src/models/HotelBooking.js`
```javascript
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const HotelBooking = sequelize.define('HotelBooking', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    bookingNumber: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    hotelId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'hotels', key: 'id' }
    },
    roomId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'rooms', key: 'id' }
    },
    checkInDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    checkOutDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isAfterCheckIn(value) {
          if (value <= this.checkInDate) {
            throw new Error('Check-out date must be after check-in date');
          }
        }
      }
    },
    numberOfRooms: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    numberOfGuests: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    taxesFees: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'),
      defaultValue: 'PENDING'
    },
    paymentStatus: {
      type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
      defaultValue: 'PENDING'
    },
    paymentId: DataTypes.STRING(255),
    guestName: DataTypes.STRING(255),
    guestEmail: DataTypes.STRING(255),
    guestPhone: DataTypes.STRING(20),
    specialRequests: DataTypes.TEXT,
    invoiceUrl: DataTypes.STRING(500),
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'hotel_bookings',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['checkInDate'] }
    ]
  });

  HotelBooking.associate = (models) => {
    HotelBooking.belongsTo(models.User, { foreignKey: 'userId' });
    HotelBooking.belongsTo(models.Hotel, { foreignKey: 'hotelId' });
    HotelBooking.belongsTo(models.Room, { foreignKey: 'roomId' });
  };

  return HotelBooking;
};
```

### Step 2: Create Core Services

#### 2.1 JWT Service
**File:** `src/services/auth/jwtService.js`
```javascript
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    ...(user.role === 'HOTEL_VENDOR' && { vendorId: user.id })
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
```

#### 2.2 Password Service
**File:** `src/services/auth/passwordService.js`
```javascript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePasswords = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const generateTemporaryPassword = () => {
  return Math.random().toString(36).slice(-12).toUpperCase();
};
```

#### 2.3 Email Service
**File:** `src/services/notification/emailService.js`
```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendCredentialsEmail = async (email, role, tempPassword) => {
  const loginUrl = role === 'HOTEL_VENDOR' 
    ? `${process.env.FRONTEND_URL}/vendor/login`
    : `${process.env.FRONTEND_URL}/vendor/airline/login`;

  const html = `
    <h1>Welcome to TripOra!</h1>
    <p>Your account has been created.</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Temporary Password:</strong> ${tempPassword}</p>
    <p><a href="${loginUrl}">Login to your dashboard</a></p>
    <p>Please change your password after first login.</p>
  `;

  return transporter.sendMail({
    to: email,
    subject: 'Your TripOra Vendor Account Credentials',
    html
  });
};

export const sendBookingConfirmation = async (email, bookingData) => {
  const html = `
    <h1>Booking Confirmed!</h1>
    <p>Your booking ${bookingData.bookingNumber} has been confirmed.</p>
    <p><strong>Hotel:</strong> ${bookingData.hotelName}</p>
    <p><strong>Check-in:</strong> ${bookingData.checkInDate}</p>
    <p><strong>Check-out:</strong> ${bookingData.checkOutDate}</p>
    <p><strong>Total Price:</strong> ${bookingData.totalPrice}</p>
  `;

  return transporter.sendMail({
    to: email,
    subject: `Booking Confirmation: ${bookingData.bookingNumber}`,
    html
  });
};
```

#### 2.4 Hotel Service
**File:** `src/services/hotel/hotelService.js`
```javascript
import { Hotel, Room, HotelBooking } from '../models/index.js';
import { Op } from 'sequelize';

export const searchHotels = async (filters) => {
  const { city, checkInDate, checkOutDate, guests, rooms, page = 1, limit = 20 } = filters;

  const where = {
    city: { [Op.iLike]: `%${city}%` },
    isActive: true,
    isVerified: true
  };

  const hotels = await Hotel.findAll({
    where,
    include: [{
      association: 'rooms',
      where: {
        availableRooms: { [Op.gt]: 0 },
        isActive: true
      },
      attributes: ['id', 'categoryName', 'basePrice', 'availableRooms']
    }],
    limit,
    offset: (page - 1) * limit
  });

  return hotels;
};

export const getHotelDetails = async (hotelId) => {
  return Hotel.findByPk(hotelId, {
    include: [
      { association: 'rooms', attributes: ['id', 'categoryName', 'capacity', 'basePrice'] },
      { association: 'images' }
    ]
  });
};

export const checkAvailability = async (roomId, checkInDate, checkOutDate) => {
  const conflictingBookings = await HotelBooking.findAll({
    where: {
      roomId,
      status: { [Op.in]: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      [Op.or]: [
        {
          checkInDate: { [Op.lte]: checkInDate },
          checkOutDate: { [Op.gt]: checkInDate }
        },
        {
          checkInDate: { [Op.lt]: checkOutDate },
          checkOutDate: { [Op.gte]: checkOutDate }
        }
      ]
    }
  });

  return conflictingBookings.length === 0;
};
```

#### 2.5 Hotel Booking Service (Atomic Transaction)
**File:** `src/services/hotel/bookingService.js`
```javascript
import { sequelize, HotelBooking, Room } from '../models/index.js';
import { generateBookingNumber } from '../utils/helpers.js';

export const createHotelBooking = async (bookingData) => {
  return sequelize.transaction(async (transaction) => {
    // 1. Lock room row for update
    const room = await Room.findByPk(bookingData.roomId, {
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!room) {
      throw new Error('Room not found');
    }

    // 2. Check availability
    if (room.availableRooms < bookingData.numberOfRooms) {
      throw new Error('Insufficient rooms available');
    }

    // 3. Create booking
    const booking = await HotelBooking.create({
      ...bookingData,
      bookingNumber: generateBookingNumber('HB'),
      status: 'CONFIRMED'
    }, { transaction });

    // 4. Decrement available rooms (atomic)
    await room.decrement('availableRooms', {
      by: bookingData.numberOfRooms,
      transaction
    });

    return booking;
  });
};

export const checkInBooking = async (bookingId) => {
  const booking = await HotelBooking.findByPk(bookingId);
  
  if (booking.status !== 'CONFIRMED') {
    throw new Error('Only confirmed bookings can be checked in');
  }

  return booking.update({
    status: 'CHECKED_IN',
    checkedInAt: new Date()
  });
};

export const checkOutBooking = async (bookingId) => {
  const booking = await HotelBooking.findByPk(bookingId);

  if (booking.status !== 'CHECKED_IN') {
    throw new Error('Only checked-in bookings can be checked out');
  }

  return booking.update({
    status: 'CHECKED_OUT',
    checkedOutAt: new Date()
  });
};
```

### Step 3: Create Controllers

#### 3.1 Admin Vendor Registration Controller
**File:** `src/controllers/admin/vendorController.js`
```javascript
import { User } from '../../models/index.js';
import { sendCredentialsEmail } from '../../services/notification/emailService.js';
import { hashPassword, generateTemporaryPassword } from '../../services/auth/passwordService.js';

export const registerHotelVendor = async (req, res) => {
  try {
    const { hotelName, email } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);

    // Create vendor user
    const vendor = await User.create({
      email,
      passwordHash,
      role: 'HOTEL_VENDOR',
      firstName: hotelName,
      isVerified: false
    });

    // Send credentials email
    await sendCredentialsEmail(email, 'HOTEL_VENDOR', tempPassword);

    res.status(201).json({
      message: 'Hotel vendor registered successfully',
      vendor: {
        id: vendor.id,
        email: vendor.email,
        role: vendor.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const registerAirlineVendor = async (req, res) => {
  try {
    const { airlineName, email } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);

    const vendor = await User.create({
      email,
      passwordHash,
      role: 'FLIGHT_VENDOR',
      firstName: airlineName,
      isVerified: false
    });

    await sendCredentialsEmail(email, 'FLIGHT_VENDOR', tempPassword);

    res.status(201).json({
      message: 'Airline vendor registered successfully',
      vendor: {
        id: vendor.id,
        email: vendor.email,
        role: vendor.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

#### 3.2 Hotel Vendor Controller
**File:** `src/controllers/vendor/hotelController.js`
```javascript
import { Hotel, Room } from '../../models/index.js';

export const createHotel = async (req, res) => {
  try {
    const { name, address, city, amenities } = req.body;
    const vendorId = req.user.id;

    const hotel = await Hotel.create({
      vendorId,
      name,
      address,
      city,
      amenities: amenities || [],
      isVerified: false // Requires admin verification
    });

    res.status(201).json({
      message: 'Hotel created successfully',
      hotel
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyHotels = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const hotels = await Hotel.findAll({
      where: { vendorId },
      include: [{ association: 'rooms' }]
    });

    res.json({ hotels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addRoom = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { categoryName, capacity, totalRooms, basePrice } = req.body;

    // Verify ownership
    const hotel = await Hotel.findByPk(hotelId);
    if (hotel.vendorId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const room = await Room.create({
      hotelId,
      categoryName,
      capacity,
      totalRooms,
      availableRooms: totalRooms,
      basePrice
    });

    res.status(201).json({
      message: 'Room added successfully',
      room
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Step 4: Create Middleware

#### 4.1 Authentication Middleware
**File:** `src/middleware/auth.js`
```javascript
import { verifyAccessToken } from '../services/auth/jwtService.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

#### 4.2 RBAC Middleware
**File:** `src/middleware/rbac.js`
```javascript
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};
```

### Step 5: Create Routes

#### 5.1 Admin Routes
**File:** `src/routes/admin/vendors.js`
```javascript
import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { registerHotelVendor, registerAirlineVendor } from '../../controllers/admin/vendorController.js';

const router = express.Router();

router.post(
  '/hotel',
  authenticate,
  authorize('ADMIN'),
  registerHotelVendor
);

router.post(
  '/airline',
  authenticate,
  authorize('ADMIN'),
  registerAirlineVendor
);

export default router;
```

#### 5.2 Vendor Routes
**File:** `src/routes/vendor/hotels.js`
```javascript
import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createHotel,
  getMyHotels,
  addRoom
} from '../../controllers/vendor/hotelController.js';

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('HOTEL_VENDOR'),
  createHotel
);

router.get(
  '/',
  authenticate,
  authorize('HOTEL_VENDOR'),
  getMyHotels
);

router.post(
  '/:hotelId/rooms',
  authenticate,
  authorize('HOTEL_VENDOR'),
  addRoom
);

export default router;
```

---

## Part 2: Frontend Implementation

### Step 1: Create Vendor Portal Structure

```
makemytrip-frontend/src/
├── pages/
│   ├── vendor/
│   │   ├── HotelVendorDashboard.jsx
│   │   ├── HotelVendorLogin.jsx
│   │   ├── HotelManagement.jsx
│   │   ├── RoomManagement.jsx
│   │   ├── BookingManagement.jsx
│   │   ├── AirlineVendorDashboard.jsx
│   │   ├── AirlineVendorLogin.jsx
│   │   └── RouteManagement.jsx
│   └── admin/
│       ├── AdminDashboard.jsx
│       ├── VendorManagement.jsx
│       ├── HotelApproval.jsx
│       └── BookingManagement.jsx
│
├── components/
│   ├── Vendor/
│   │   ├── HotelForm.jsx
│   │   ├── RoomForm.jsx
│   │   ├── BookingsList.jsx
│   │   ├── VendorHeader.jsx
│   │   └── VendorSidebar.jsx
│   ├── Admin/
│   │   ├── VendorRegistrationForm.jsx
│   │   ├── VendorsList.jsx
│   │   └── HotelApprovalList.jsx
│   └── Common/
│       └── VendorProtectedRoute.jsx
│
└── services/
    ├── vendorService.js
    ├── adminService.js
    └── hotelVendorService.js
```

### Step 2: Create Vendor Auth Context

**File:** `src/context/VendorContext.jsx`
```javascript
import { createContext, useState, useEffect } from 'react';

export const VendorContext = createContext();

export const VendorProvider = ({ children }) => {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vendorToken, setVendorToken] = useState(localStorage.getItem('vendorToken'));

  useEffect(() => {
    const restoreVendorSession = async () => {
      if (vendorToken) {
        try {
          const response = await fetch('http://localhost:5000/api/v1/vendor/profile', {
            headers: { Authorization: `Bearer ${vendorToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            setVendor(data.vendor);
          }
        } catch (error) {
          console.error('Failed to restore vendor session:', error);
          setVendorToken(null);
          localStorage.removeItem('vendorToken');
        }
      }
      setLoading(false);
    };

    restoreVendorSession();
  }, [vendorToken]);

  const vendorLogin = async (email, password) => {
    const response = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      setVendorToken(data.accessToken);
      setVendor(data.user);
      localStorage.setItem('vendorToken', data.accessToken);
      return true;
    }
    return false;
  };

  const vendorLogout = () => {
    setVendor(null);
    setVendorToken(null);
    localStorage.removeItem('vendorToken');
  };

  return (
    <VendorContext.Provider value={{ vendor, vendorToken, loading, vendorLogin, vendorLogout }}>
      {children}
    </VendorContext.Provider>
  );
};
```

### Step 3: Create Vendor Protected Route

**File:** `src/components/Common/VendorProtectedRoute.jsx`
```javascript
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { VendorContext } from '../../context/VendorContext';

export const VendorProtectedRoute = ({ children, requiredRole }) => {
  const { vendor, loading } = useContext(VendorContext);

  if (loading) return <div>Loading...</div>;

  if (!vendor) return <Navigate to="/vendor/login" />;

  if (requiredRole && vendor.role !== requiredRole) {
    return <Navigate to="/access-denied" />;
  }

  return children;
};
```

### Step 4: Hotel Vendor Dashboard

**File:** `src/pages/vendor/HotelVendorDashboard.jsx`
```javascript
import { useContext, useState, useEffect } from 'react';
import { VendorContext } from '../../context/VendorContext';
import { VendorHeader } from '../../components/Vendor/VendorHeader';
import { VendorSidebar } from '../../components/Vendor/VendorSidebar';
import './VendorDashboard.css';

export const HotelVendorDashboard = () => {
  const { vendor, vendorToken } = useContext(VendorContext);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/vendor/hotels', {
          headers: { Authorization: `Bearer ${vendorToken}` }
        });
        const data = await response.json();
        setHotels(data.hotels);
      } catch (error) {
        console.error('Failed to fetch hotels:', error);
      } finally {
        setLoading(false);
      }
    };

    if (vendorToken) {
      fetchHotels();
    }
  }, [vendorToken]);

  return (
    <div className="vendor-dashboard">
      <VendorHeader />
      <div className="vendor-body">
        <VendorSidebar />
        <main className="vendor-content">
          <h1>My Hotels</h1>
          {loading ? (
            <p>Loading...</p>
          ) : hotels.length > 0 ? (
            <div className="hotels-grid">
              {hotels.map(hotel => (
                <div key={hotel.id} className="hotel-card">
                  <h3>{hotel.name}</h3>
                  <p>{hotel.address}</p>
                  <p>Star Rating: {hotel.starRating}</p>
                  <button className="btn-edit">Edit</button>
                  <button className="btn-manage">Manage Rooms</button>
                </div>
              ))}
            </div>
          ) : (
            <p>No hotels found. Create one to get started!</p>
          )}
        </main>
      </div>
    </div>
  );
};
```

---

## Part 3: Integration with Existing TripOra

### Update App.jsx

**File:** `src/App.jsx`
```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VendorProvider } from './context/VendorContext';
import { AdminProvider } from './context/AdminContext';

// Pages
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import { HotelVendorDashboard } from './pages/vendor/HotelVendorDashboard';
import { HotelVendorLogin } from './pages/vendor/HotelVendorLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';

// Components
import Header from './components/Common/Header';
import Footer from './components/Common/Footer';
import { ProtectedRoute } from './components/Common/ProtectedRoute';
import { VendorProtectedRoute } from './components/Common/VendorProtectedRoute';
import { AdminProtectedRoute } from './components/Common/AdminProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <VendorProvider>
          <AdminProvider>
            <Header />
            <Routes>
              {/* User Portal */}
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchResultsPage />} />

              {/* Vendor Portal */}
              <Route path="/vendor/login" element={<HotelVendorLogin />} />
              <Route
                path="/vendor/dashboard"
                element={
                  <VendorProtectedRoute requiredRole="HOTEL_VENDOR">
                    <HotelVendorDashboard />
                  </VendorProtectedRoute>
                }
              />

              {/* Admin Portal */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                }
              />
            </Routes>
            <Footer />
          </AdminProvider>
        </VendorProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

---

## Part 4: Database Initialization

### Create Migration File

```bash
npx sequelize-cli migration:generate --name create-user-hotel-tables
```

**File:** `migrations/[timestamp]-create-user-hotel-tables.js`
```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false
      },
      passwordHash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('USER', 'ADMIN', 'HOTEL_VENDOR', 'FLIGHT_VENDOR'),
        defaultValue: 'USER'
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
        defaultValue: 'ACTIVE'
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create hotels table
    await queryInterface.createTable('hotels', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      vendorId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Similar for rooms, bookings, etc...
  },

  async down(queryInterface) {
    await queryInterface.dropTable('hotels');
    await queryInterface.dropTable('users');
  }
};
```

### Run Migrations

```bash
npx sequelize-cli db:migrate
```

---

## Summary & Implementation Checklist

### Backend
- [ ] Install dependencies (Sequelize, bcryptjs, jwt, etc.)
- [ ] Create database models (User, Hotel, Room, HotelBooking, etc.)
- [ ] Implement auth services (JWT, password hashing)
- [ ] Implement email service (SendGrid/Nodemailer)
- [ ] Create admin controllers for vendor registration
- [ ] Create vendor controllers for hotel management
- [ ] Create middleware (auth, RBAC)
- [ ] Create routes (admin, vendor, user)
- [ ] Set up database migrations
- [ ] Test all endpoints with Postman

### Frontend
- [ ] Create VendorContext for vendor authentication
- [ ] Create VendorProtectedRoute component
- [ ] Build vendor login page
- [ ] Build vendor dashboard
- [ ] Build hotel management pages
- [ ] Build room management pages
- [ ] Build booking management pages
- [ ] Test all vendor portal flows

### Deployment
- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Set up SendGrid account
- [ ] Configure Razorpay integration
- [ ] Set up AWS S3 (optional)
- [ ] Deploy backend to production
- [ ] Deploy frontend to production

---

This guide provides a complete roadmap for implementing the Hotel & Flight Booking System with your existing TripOra infrastructure.
