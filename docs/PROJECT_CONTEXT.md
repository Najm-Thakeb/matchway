# MatchWay – Project Context

Last updated: 2026-09-27

## Product
MatchWay is a mobile intercity carpooling marketplace inspired by the core ride-sharing flow of BlaBlaCar, with its own design and product decisions.

Initial target market: Jordan / Arabic-speaking markets, later expansion to additional Arab countries.

Frontend language is currently English. Arabic + English are planned.

Brand color: `#E63946`.

## Current offer-a-ride flow
1. From city + exact pickup point
2. To city + exact drop-off point
3. Choose route
4. Choose suggested stops along the selected route, or add another city manually
5. Review automatically selected meeting points
6. Optionally change a meeting point on a map using address search
7. Date + time
8. Seats
9. Price
10. Booking preference
11. Review
12. Publish

## Current working functionality
- Google Places autocomplete for cities, pickup/drop-off points and meeting-point search.
- Google Routes route calculation and alternative route selection.
- Selected route stored in frontend state.
- Long route coordinates simplified before stop-suggestion requests to avoid oversized payloads.
- Automatic stop-city suggestions based on the selected route.
- `all-the-cities` used in the backend to prefer larger/relevant cities over small villages.
- Suggested stop count depends on route length.
- Manual city addition supported.
- Google Routes waypoint optimization determines final multi-stop order.
- Smart meeting-point recommendation.
- Driver can change a meeting point on a map via address search.
- Full trip line and all stop markers shown on meeting-point map.
- Review page shows stop cities and exact meeting-point addresses.
- Published rides persist stop order and meeting-point data in PostgreSQL.
- Prisma Studio used as a developer database inspection tool.

## Current database state
`RideStop` stores:
- `placeId`
- `label`
- `position`
- `meetingPointPlaceId`
- `meetingPointLabel`
- `meetingPointAddress`

Meeting-point fields are nullable so older test rides remain valid.

## Next major feature
Final route geometry (`routeCoordinates`) currently exists in frontend state but is not persisted with the ride in PostgreSQL.

Next:
1. Persist route geometry.
2. Build intelligent route-based passenger search.
3. Add segment pricing.
4. Build booking.

## Planned matching principles
- Explicit manual stops should match searches.
- A passenger can also match when origin/destination lie along the actual route even without explicit stops.
- Passenger origin must occur before destination along the driver's route.
- Nearby alternatives may be shown transparently; never pretend a ride starts somewhere it does not.
- Segment pricing will later depend on the travelled route segment.

## Known temporary limitations
- Maximum smart-stop optimization currently 5 stops.
- Jordan timezone `+03:00` is hard-coded for now.
- Temporary `Test Driver` because authentication is not implemented.
- Meeting-point optimization creates multiple Google API calls and will need caching/cost optimization before scale.
- Meeting-point quality/safety rules can be hardened later.
