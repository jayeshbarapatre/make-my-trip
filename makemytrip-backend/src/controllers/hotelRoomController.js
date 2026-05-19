import prisma from '../config/prismaClient.js';

export const getRooms = async (req, res) => {
  try {
    const { id } = req.params;

    const rooms = await prisma.roomCategory.findMany({
      where: { hotelId: id },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, description, capacity, totalRooms, basePrice, amenities, images } = req.body;

    // Validation
    if (!categoryName || !totalRooms || !basePrice) {
      return res.status(400).json({ error: 'categoryName, totalRooms, and basePrice are required' });
    }

    if (totalRooms < 1 || basePrice < 0) {
      return res.status(400).json({ error: 'Invalid totalRooms or basePrice' });
    }

    const room = await prisma.roomCategory.create({
      data: {
        hotelId: id,
        categoryName,
        description: description || null,
        capacity: capacity || 2,
        totalRooms: parseInt(totalRooms),
        availableRooms: parseInt(totalRooms),
        basePrice: parseFloat(basePrice),
        amenities: amenities || [],
        images: images || [],
        isActive: true
      }
    });

    res.status(201).json({ success: true, data: { room } });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { hotelId, id } = req.params;
    const { categoryName, description, capacity, totalRooms, availableRooms, basePrice, amenities, images } = req.body;

    const room = await prisma.roomCategory.update({
      where: { id },
      data: {
        ...(categoryName && { categoryName }),
        ...(description !== undefined && { description: description || null }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(totalRooms && { totalRooms: parseInt(totalRooms) }),
        ...(availableRooms !== undefined && { availableRooms: parseInt(availableRooms) }),
        ...(basePrice && { basePrice: parseFloat(basePrice) }),
        ...(amenities && { amenities }),
        ...(images && { images })
      }
    });

    res.json({ success: true, data: { room } });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { hotelId, id } = req.params;

    await prisma.roomCategory.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: error.message });
  }
};

export const toggleRoomStatus = async (req, res) => {
  try {
    const { hotelId, id } = req.params;

    const room = await prisma.roomCategory.findUnique({
      where: { id }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const updatedRoom = await prisma.roomCategory.update({
      where: { id },
      data: { isActive: !room.isActive }
    });

    res.json({ success: true, data: { room: updatedRoom } });
  } catch (error) {
    console.error('Error toggling room status:', error);
    res.status(500).json({ error: error.message });
  }
};
