-- CreateEnum
CREATE TYPE "BookingPreference" AS ENUM ('INSTANT', 'REVIEW');

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "bookingPreference" "BookingPreference",
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'JOD',
ADD COLUMN     "dropoffLabel" TEXT,
ADD COLUMN     "dropoffPlaceId" TEXT,
ADD COLUMN     "pickupLabel" TEXT,
ADD COLUMN     "pickupPlaceId" TEXT,
ADD COLUMN     "routeDistanceMeters" INTEGER,
ADD COLUMN     "routeDurationSeconds" INTEGER;

-- CreateTable
CREATE TABLE "RideStop" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "RideStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RideStop_rideId_idx" ON "RideStop"("rideId");

-- CreateIndex
CREATE UNIQUE INDEX "RideStop_rideId_position_key" ON "RideStop"("rideId", "position");

-- AddForeignKey
ALTER TABLE "RideStop" ADD CONSTRAINT "RideStop_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;
