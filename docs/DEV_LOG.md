# MatchWay – Development Log

## 2026-09-27

### Offer flow
Finalized:
`From/Pickup → Destination/Drop-off → Choose Route → Stops → Meeting Points → Date/Time → Seats → Price → Booking → Review → Publish`

### Route-city suggestions
Initial reverse-geocoding approach produced too many small places.

Improved by:
- enabling Google Geocoding API
- installing `all-the-cities`
- using population-aware filtering
- measuring distance to the selected route
- limiting suggestions by route length

Long route issue:
`PayloadTooLargeError: request entity too large`

Fix:
- frontend simplifies route coordinates to roughly max 150 representative points before requesting city suggestions

### Stop ordering
Geometric ordering was not reliable for manual detours.

Implemented Google Routes `optimizeWaypointOrder`.

Verified multi-stop order with difficult route examples.

### Smart meeting points
Implemented candidate search and optimization.

Candidate types include:
- park and ride
- rest stop
- truck stop
- gas station
- train station
- parking

Driver can override the recommended meeting point.

### Meeting-point map
Implemented:
- search field
- suggestions below input
- full trip route line
- all stop markers
- selected meeting point marker
- route recalculation when another address is selected
- Save and return

### Database persistence
Added nullable `RideStop` fields:
- `meetingPointPlaceId`
- `meetingPointLabel`
- `meetingPointAddress`

Updated Prisma schema, migration, generated client, DTO, ride service and review/publish payload.

Review page now displays exact meeting-point information.

### Debugging
Publish initially failed because:
1. an old backend process still occupied port 3000
2. Prisma client was outdated
3. Prisma schema relation formatting temporarily caused validation failure

Resolved by:
- stopping old backend process
- validating schema
- running migration
- regenerating Prisma client
- restarting one backend instance

Ride publishing then worked.

### Prisma Studio
Verified new stop data including:
- stop city
- meeting-point name
- meeting-point address
- Place IDs
- final position

### Developer workflow
Use:
- one terminal for backend `npm run start:dev`
- one terminal for Expo
- one normal terminal for Prisma/Git commands

### Next
1. persist route geometry
2. intelligent route-based passenger search
3. segment pricing
4. booking
