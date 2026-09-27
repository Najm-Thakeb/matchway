# MatchWay – Technical & Product Decisions

Last updated: 2026-09-27

## D001 – Mobile-first
Build with React Native + Expo, not a PWA.

## D002 – Exact pickup/drop-off required
A ride stores city plus exact pickup/drop-off Place IDs and labels.

## D003 – Route before stops
Final flow starts with route selection before stop selection because stop suggestions depend on the chosen road.

## D004 – Automatic stop suggestions + manual Add City
MatchWay suggests route cities automatically, but the driver may add another city manually.

## D005 – Prefer meaningful cities
Use `all-the-cities` population data plus actual route distance so small villages do not dominate suggestions.

## D006 – Suggestion count depends on route length
Short routes show only a few useful stops; long routes may show more and prefer larger cities.

## D007 – Google decides final multi-stop order
Use Google Routes `optimizeWaypointOrder` for multiple stops instead of relying only on geometric estimates.

## D008 – Smart meeting point is automatic but editable
MatchWay recommends a meeting point, but the driver can change it.

## D009 – Meeting-point edit UI stays simple
Map + full route + all stop markers + search field + Save.

## D010 – Persist meeting points per RideStop
Persist:
- `meetingPointPlaceId`
- `meetingPointLabel`
- `meetingPointAddress`
- `position`

Fields are nullable to keep old test rides valid.

## D011 – Persist route geometry next
Current route coordinates exist only in frontend state.
Next MVP step: save them as JSON in PostgreSQL.

## D012 – PostGIS deferred
Not needed yet. Consider later for high-volume geospatial queries.

## D013 – Route matching goes beyond explicit stops
Future search must support explicit stops, route-corridor matches, correct origin-before-destination ordering and transparent nearby alternatives.

## D014 – Google API key stays backend-only
Never expose or commit it.

## D015 – Temporary MVP limitations
- max 5 optimized stops
- Jordan `+03:00` timezone
- temporary `Test Driver`
- caching/cost optimization later
