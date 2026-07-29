import prisma from '../src/config/prismaClient.js';

/**
 * Clean up duplicate bookings for a specific user
 * Keeps the first booking, removes later duplicates
 *
 * Usage: node scripts/cleanupDuplicateBookings.js <userId>
 * Or: node scripts/cleanupDuplicateBookings.js --all
 */

async function cleanupDuplicateBookings(userId) {
  try {
    console.log('🔍 Starting duplicate booking cleanup...');

    if (userId === '--all') {
      console.log('📊 Finding all users with duplicate bookings...');

      // Get all users with their booking counts
      const bookingsGrouped = await prisma.booking.groupBy({
        by: ['userId'],
        _count: {
          id: true
        },
        having: {
          id: {
            _gt: 1
          }
        }
      });

      console.log(`Found ${bookingsGrouped.length} users with potential duplicates`);

      for (const group of bookingsGrouped) {
        await cleanupUserBookings(group.userId);
      }
    } else if (userId) {
      await cleanupUserBookings(userId);
    } else {
      console.log('Usage: node cleanupDuplicateBookings.js <userId>');
      console.log('   or: node cleanupDuplicateBookings.js --all');
      process.exit(1);
    }

    console.log('✅ Cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupUserBookings(userId) {
  try {
    console.log(`\n📋 Checking bookings for user: ${userId}`);

    const userBookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`  Found ${userBookings.length} total bookings`);

    // Group by type and check for duplicates
    const bookingsByType = {};
    for (const booking of userBookings) {
      if (!bookingsByType[booking.type]) {
        bookingsByType[booking.type] = [];
      }
      bookingsByType[booking.type].push(booking);
    }

    let totalRemoved = 0;

    for (const [type, bookings] of Object.entries(bookingsByType)) {
      // For each type, group by key fields to find duplicates
      const bookingGroups = {};

      for (const booking of bookings) {
        // Create a key from important fields to identify duplicates
        const key = `${booking.type}|${booking.checkIn || booking.departureDate}|${booking.checkOut || booking.returnDate}|${booking.totalAmount}`;

        if (!bookingGroups[key]) {
          bookingGroups[key] = [];
        }
        bookingGroups[key].push(booking);
      }

      // For each duplicate group, keep first and remove others
      for (const [key, duplicateBookings] of Object.entries(bookingGroups)) {
        if (duplicateBookings.length > 1) {
          console.log(`\n  ⚠️  Found ${duplicateBookings.length} duplicate ${type} bookings:`);
          console.log(`     Key: ${key}`);

          // Keep the first (oldest), mark others for deletion
          for (let i = 1; i < duplicateBookings.length; i++) {
            const dup = duplicateBookings[i];
            console.log(`     🗑️  Deleting: ${dup.bookingId} (${dup.id})`);

            await prisma.booking.delete({
              where: { id: dup.id }
            });
            totalRemoved++;
          }
        }
      }
    }

    if (totalRemoved > 0) {
      console.log(`\n  ✅ Removed ${totalRemoved} duplicate bookings for user ${userId}`);
    } else {
      console.log(`  ✓ No duplicates found for user ${userId}`);
    }
  } catch (err) {
    console.error(`  ❌ Error cleaning user ${userId}:`, err.message);
  }
}

// Get user ID from command line
const userIdArg = process.argv[2];
cleanupDuplicateBookings(userIdArg);
