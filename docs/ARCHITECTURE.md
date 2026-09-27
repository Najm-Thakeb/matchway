# MatchWay – Architecture

Last updated: 2026-09-27

## Stack
Frontend:
- React Native
- Expo SDK 57
- TypeScript
- expo-router
- Zustand
- react-native-maps

Backend:
- Node.js
- NestJS
- TypeScript
- Prisma
- PostgreSQL

External:
- Google Places API
- Google Geocoding API
- Google Routes API

Local backend dependency:
- `all-the-cities` for city coordinates/population used in route-city suggestions.

## Frontend state
`src/store/offerRideStore.ts` stores:
- start/destination cities and Place IDs
- exact pickup/drop-off
- selected route ID
- route distance/duration
- route coordinates
- ordered stops
- meeting-point data
- date/time, seats, price, currency, booking preference, comment

Each stop stores:
- `label`
- `placeId`
- `routePositionMeters`
- `meetingPointLabel`
- `meetingPointPlaceId`
- `meetingPointAddress`

Final multi-stop order is determined with Google Routes waypoint optimization.

## Offer flow
`From/Pickup → Destination/Drop-off → Route → Stops → Meeting Points → Date/Time → Seats → Price → Booking → Review → Publish`

Key screens:
- `offer.tsx`
- `offer-destination.tsx`
- `offer-route.tsx`
- `offer-stops.tsx`
- `offer-meeting-points.tsx`
- `offer-meeting-point-map.tsx`
- `offer-date-time.tsx`
- `offer-seats.tsx`
- `offer-price.tsx`
- `offer-review.tsx`

## Routing
`POST /routing`

Input:
- `originPlaceId`
- `destinationPlaceId`
- `intermediatePlaceIds`
- optional `optimizeWaypointOrder`

Behavior:
- no stops: alternatives allowed
- stops: one route
- multiple stops: Google can optimize waypoint order
- returns distance, duration, coordinates and optimized waypoint indexes

## Locations
`GET /locations/autocomplete`
Google Places autocomplete.

`GET /locations/place-details`
Returns Place ID, label, address, latitude, longitude.

`POST /locations/route-city-suggestions`
- receives simplified route coordinates
- uses `all-the-cities`
- filters by population and distance to actual route
- uses route-length-dependent thresholds
- limits number of suggestions
- resolves Google Place IDs

`POST /locations/meeting-point-candidates`
Finds candidates such as P+R, rest stops, truck stops, gas stations, train stations and parking.

`POST /locations/optimize-meeting-points`
- builds baseline route
- finds candidate meeting points
- measures route proximity
- calculates real route detours
- ranks candidates
- returns best meeting point and final route

## Database
`Ride` stores start/end, exact pickup/drop-off, date/time, route distance/duration, price, seats, booking preference, comment, temporary driver fields and timestamps.

`RideStop` stores:
- ride relation
- stop city Place ID/label
- exact meeting-point Place ID/label/address
- final stop position

## Missing architecture piece
Final route polyline is not persisted yet.

Planned MVP approach:
- store route coordinates as PostgreSQL JSON.

Possible later evolution:
- PostGIS for scalable geospatial queries.
