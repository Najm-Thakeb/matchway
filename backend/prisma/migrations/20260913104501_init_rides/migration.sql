-- CreateTable
CREATE TABLE "Ride" (
    "id" TEXT NOT NULL,
    "fromPlaceId" TEXT NOT NULL,
    "fromLabel" TEXT NOT NULL,
    "toPlaceId" TEXT NOT NULL,
    "toLabel" TEXT NOT NULL,
    "departureAt" TIMESTAMPTZ(3) NOT NULL,
    "arrivalAt" TIMESTAMPTZ(3) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "driverName" TEXT NOT NULL,
    "rating" DECIMAL(2,1),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);
