-- ==============================================================================
-- Meeting Room Booking System - PostgreSQL Schema & Concurrency Lock
-- ==============================================================================

-- 1. Enable btree_gist extension for range exclusion constraint
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'INACTIVE');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'REMINDER_15MIN', 'ROOM_MAINTENANCE', 'SYSTEM');

-- 3. Users Table
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "department" VARCHAR(100),
    "phoneNumber" VARCHAR(50),
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Rooms Table
CREATE TABLE "rooms" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "roomCode" VARCHAR(50) UNIQUE NOT NULL,
    "capacity" INTEGER NOT NULL,
    "floor" VARCHAR(50),
    "location" VARCHAR(255),
    "description" TEXT,
    "imageUrl" TEXT,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Amenities Table
CREATE TABLE "amenities" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "icon" VARCHAR(100),
    "description" TEXT
);

-- 6. Room Amenities Join Table
CREATE TABLE "room_amenities" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "roomId" UUID NOT NULL REFERENCES "rooms"("id") ON DELETE CASCADE,
    "amenityId" UUID NOT NULL REFERENCES "amenities"("id") ON DELETE CASCADE,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "unique_room_amenity" UNIQUE ("roomId", "amenityId")
);

-- 7. Bookings Table (with Double-Booking Hardware/DB level prevention)
CREATE TABLE "bookings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "bookingCode" VARCHAR(50) UNIQUE NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "roomId" UUID NOT NULL REFERENCES "rooms"("id") ON DELETE RESTRICT,
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "attendeeCount" INTEGER NOT NULL DEFAULT 1,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "check_valid_time_range" CHECK ("startTime" < "endTime")
);

-- CRITICAL: Prevent overlapping bookings for the same room (Zero Double-Booking Guarantee)
ALTER TABLE "bookings"
ADD CONSTRAINT "prevent_overlapping_room_bookings"
EXCLUDE USING gist (
    "roomId" WITH =,
    tsrange("startTime", "endTime") WITH &&
)
WHERE ("status" IN ('CONFIRMED', 'PENDING'));

-- 8. Booking Attendees Table
CREATE TABLE "booking_attendees" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "userId" UUID
);

-- 9. Notifications Table
CREATE TABLE "notifications" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "bookingId" UUID REFERENCES "bookings"("id") ON DELETE SET NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. Audit Logs Table
CREATE TABLE "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" VARCHAR(100) NOT NULL,
    "details" JSONB,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Performance Indexes
CREATE INDEX "idx_bookings_room_time" ON "bookings" ("roomId", "startTime", "endTime");
CREATE INDEX "idx_bookings_user_time" ON "bookings" ("userId", "startTime");
CREATE INDEX "idx_notifications_user_unread" ON "notifications" ("userId") WHERE "isRead" = false;
