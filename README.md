# MatchWay

MatchWay is a mobile intercity ride-sharing application that connects drivers and passengers and helps organize shared rides through intelligent route planning and flexible stop management.

The project is currently under active development.

## Features

### Ride Search
- Search for rides by origin, destination, date and number of passengers
- View search results
- Edit search criteria

### Offer a Ride
- Select origin city and exact pickup point
- Select destination city and exact drop-off point
- Choose between calculated route alternatives
- Add date and time
- Select available seats
- Set a price
- Choose booking preferences
- Review the complete ride before publishing
- Publish rides

### Smart Route & Stop Management
- Automatic city suggestions along the selected route
- Population-aware filtering to prefer relevant cities
- Route-length-based stop suggestions
- Manual stop-city selection
- Automatic optimization of multiple stop order using Google Routes
- Full route visualization on the map

### Smart Meeting Points
- Automatic meeting-point recommendations for stops
- Candidate search for locations such as parking areas, train stations and service locations
- Meeting points can be changed manually
- Address search directly on the map
- Route recalculation after changing a meeting point
- Full trip route and stop markers displayed on the map

### Data Persistence
- Published rides stored in PostgreSQL
- Ride stops stored with their final order
- Exact meeting-point information stored for every stop
- Prisma used for database access and migrations

## Tech Stack

### Frontend
- React Native
- Expo
- TypeScript
- Expo Router
- Zustand
- React Native Maps

### Backend
- Node.js
- NestJS
- TypeScript
- Prisma
- PostgreSQL

### APIs & Services
- Google Places API
- Google Geocoding API
- Google Routes API

## Architecture

MatchWay consists of a mobile React Native frontend and a NestJS backend.

The application handles route calculation, stop suggestions, waypoint optimization and meeting-point selection through backend services and external Google APIs.

Ride and stop data is persisted with Prisma and PostgreSQL.

## Current Development Status

The current ride-offer flow is:

`Pickup → Destination → Route → Stops → Meeting Points → Date/Time → Seats → Price → Booking Preference → Review → Publish`

## Planned Features

- Persistent storage of complete route geometry
- Intelligent route-based passenger matching
- Segment-based pricing
- Real booking and seat reservations
- Authentication and user accounts
- User profiles
- Vehicles
- Ratings
- Chat
- Improved API caching and cost optimization

## Project Status

MatchWay is an actively developed personal software project.
