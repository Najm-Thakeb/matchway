# MatchWay – Roadmap

Last updated: 2026-09-27

## Completed
- React Native + Expo foundation
- NestJS backend
- PostgreSQL + Prisma
- Google Places autocomplete
- Google Routes integration
- ride create/search basics
- exact pickup/drop-off
- route selection before stops
- selected route stored in app state
- automatic route-city suggestions
- long-route payload simplification
- population-aware city filtering with `all-the-cities`
- route-length-based suggestion limits
- manual Add City
- Google optimized multi-stop order
- smart meeting-point recommendation
- meeting-point map with full trip line
- all stop markers on map
- manual meeting-point override
- final route recalculation after meeting-point change
- review page shows exact meeting points
- meeting-point persistence in PostgreSQL
- Prisma migration/client generation fixed and verified
- published ride tested successfully
- Prisma Studio data verification completed

## Next major step – Route geometry persistence
Store the final selected/optimized route coordinates with `Ride`.

MVP:
- PostgreSQL JSON field
- send `routeCoordinates` during publish
- persist through Prisma
- return when loading rides

## After that – Intelligent route-based search
Example:
- driver publishes Kiel → Hamburg
- passenger searches Neumünster → Hamburg
- MatchWay checks whether origin/destination lie on the saved route and in the correct order

## Later
- segment pricing
- booking / seat reservation
- authentication and profiles
- ratings and vehicles
- chat
- timezone by location
- API caching/rate limiting/cost monitoring
- PostGIS if scale requires it
