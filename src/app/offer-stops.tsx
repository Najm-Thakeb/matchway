import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";

import { useOfferRideStore } from "../store/offerRideStore";

const MATCHWAY_RED = "#E63946";

type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

type RouteCitySuggestion = {
  placeId: string;

  label: string;
  formattedAddress: string;

  latitude: number;
  longitude: number;

  distanceFromStartMeters: number;

  population?: number;
  distanceToRouteMeters?: number;
};

type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

type PlaceDetails = {
  placeId: string;

  label: string;
  address: string;

  latitude: number;
  longitude: number;
};

function simplifyRouteCoordinates(
  coordinates: RouteCoordinate[],
  maxPoints = 150,
) {
  if (coordinates.length <= maxPoints) {
    return coordinates;
  }

  const result: RouteCoordinate[] = [];

  const step = (coordinates.length - 1) / (maxPoints - 1);

  for (let index = 0; index < maxPoints; index += 1) {
    const coordinateIndex = Math.round(index * step);

    result.push(coordinates[coordinateIndex]);
  }

  return result;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const earthRadiusMeters = 6371000;

  const latitudeDelta = toRadians(lat2 - lat1);

  const longitudeDelta = toRadians(lon2 - lon1);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDelta / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

/*
 * Bestimmt, an welcher Stelle
 * einer Route eine beliebige Stadt
 * am sinnvollsten einsortiert wird.
 *
 * Damit funktionieren auch Städte,
 * die über "Add city" hinzugefügt wurden.
 */
function findRoutePositionMeters(
  latitude: number,
  longitude: number,
  coordinates: RouteCoordinate[],
) {
  if (coordinates.length < 2) {
    return null;
  }

  const metersPerLatitude = 111320;

  const metersPerLongitude = 111320 * Math.cos(toRadians(latitude));

  let totalBeforeSegment = 0;

  let bestDistance = Number.POSITIVE_INFINITY;

  let bestRoutePosition = 0;

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const start = coordinates[index];

    const end = coordinates[index + 1];

    const segmentDistance = haversineMeters(
      start.latitude,
      start.longitude,
      end.latitude,
      end.longitude,
    );

    const startX = (start.longitude - longitude) * metersPerLongitude;

    const startY = (start.latitude - latitude) * metersPerLatitude;

    const endX = (end.longitude - longitude) * metersPerLongitude;

    const endY = (end.latitude - latitude) * metersPerLatitude;

    const segmentX = endX - startX;

    const segmentY = endY - startY;

    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

    let projection = 0;

    if (segmentLengthSquared > 0) {
      projection =
        -(startX * segmentX + startY * segmentY) / segmentLengthSquared;

      projection = Math.max(0, Math.min(1, projection));
    }

    const closestX = startX + segmentX * projection;

    const closestY = startY + segmentY * projection;

    const distance = Math.sqrt(closestX * closestX + closestY * closestY);

    if (distance < bestDistance) {
      bestDistance = distance;

      bestRoutePosition = totalBeforeSegment + segmentDistance * projection;
    }

    totalBeforeSegment += segmentDistance;
  }

  return bestRoutePosition;
}

export default function OfferStopsScreen() {
  const {
    fromPlaceId,
    toPlaceId,

    routeCoordinates,

    stops,

    addStop,
    removeStop,
  } = useOfferRideStore();

  const [routeCities, setRouteCities] = useState<RouteCitySuggestion[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [manualMode, setManualMode] = useState(false);

  const [query, setQuery] = useState("");

  const [manualSuggestions, setManualSuggestions] = useState<PlaceSuggestion[]>(
    [],
  );

  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    if (routeCoordinates.length < 2) {
      setRouteCities([]);
      setLoading(false);

      setError("No selected route was found.");

      return;
    }

    loadRouteCities();
  }, [routeCoordinates, fromPlaceId, toPlaceId]);

  useEffect(() => {
    if (!manualMode) {
      return;
    }

    const searchText = query.trim();

    if (searchText.length < 2) {
      setManualSuggestions([]);
      setManualLoading(false);

      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setManualLoading(true);

        const response = await fetch(
          `http://localhost:3000/locations/autocomplete?q=${encodeURIComponent(
            searchText,
          )}`,
        );

        if (!response.ok) {
          throw new Error("City search failed");
        }

        const data: PlaceSuggestion[] = await response.json();

        const filtered = data.filter((place) => {
          if (place.placeId === fromPlaceId || place.placeId === toPlaceId) {
            return false;
          }

          return !stops.some((stop) => stop.placeId === place.placeId);
        });

        setManualSuggestions(filtered);
      } catch (error) {
        console.error("Manual city search error:", error);

        setManualSuggestions([]);
      } finally {
        setManualLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, manualMode, fromPlaceId, toPlaceId, stops]);

  async function loadRouteCities() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:3000/locations/route-city-suggestions",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            coordinates: simplifyRouteCoordinates(routeCoordinates),

            excludedPlaceIds: [fromPlaceId, toPlaceId].filter(Boolean),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Route city suggestions failed");
      }

      const data: RouteCitySuggestion[] = await response.json();

      setRouteCities(data);
    } catch (error) {
      console.error("Route city suggestions error:", error);

      setRouteCities([]);

      setError("We couldn't find stop suggestions along this route.");
    } finally {
      setLoading(false);
    }
  }

  function isSelected(placeId: string) {
    return stops.some((stop) => stop.placeId === placeId);
  }

  function toggleCity(city: RouteCitySuggestion) {
    if (isSelected(city.placeId)) {
      removeStop(city.placeId);

      return;
    }

    if (stops.length >= 5) {
      Alert.alert("Maximum stops", "You can add up to 5 stops.");

      return;
    }

    addStop(city.label, city.placeId, city.distanceFromStartMeters);
  }

  async function selectManualCity(place: PlaceSuggestion) {
    if (stops.length >= 5) {
      Alert.alert("Maximum stops", "You can add up to 5 stops.");

      return;
    }

    try {
      setManualLoading(true);

      /*
       * Koordinaten der manuell
       * ausgewählten Stadt holen.
       */
      const response = await fetch(
        `http://localhost:3000/locations/place-details?placeId=${encodeURIComponent(
          place.placeId,
        )}`,
      );

      if (!response.ok) {
        throw new Error("Place details failed");
      }

      const details: PlaceDetails = await response.json();

      /*
       * Position dieser Stadt auf der
       * ursprünglichen Fahrt bestimmen.
       */
      const routePositionMeters = findRoutePositionMeters(
        details.latitude,
        details.longitude,
        routeCoordinates,
      );

      const label = place.secondaryText
        ? `${place.mainText}, ${place.secondaryText}`
        : place.mainText;

      addStop(label, place.placeId, routePositionMeters);

      setQuery("");
      setManualSuggestions([]);

      Keyboard.dismiss();

      setManualMode(false);
    } catch (error) {
      console.error("Manual stop details error:", error);

      Alert.alert("City unavailable", "We couldn't add this city.");
    } finally {
      setManualLoading(false);
    }
  }

  function continueOffer() {
    if (stops.length === 0) {
      router.push("/offer-date-time");

      return;
    }

    router.push("/offer-meeting-points");
  }

  const automaticIds = new Set(routeCities.map((city) => city.placeId));

  const extraStops = stops.filter((stop) => !automaticIds.has(stop.placeId));

  if (manualMode) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setManualMode(false);

            setQuery("");
            setManualSuggestions([]);
          }}
        >
          <Ionicons name="arrow-back" size={25} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.title}>Add a city</Text>

        <Text style={styles.subtitle}>
          Search for another city you want to add to your route.
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={21} color="#667085" />

          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search city"
            placeholderTextColor="#98A2B3"
            autoCorrect={false}
            autoFocus
          />
        </View>

        {manualLoading ? (
          <ActivityIndicator style={styles.manualLoader} color={MATCHWAY_RED} />
        ) : null}

        <ScrollView
          style={styles.manualResults}
          keyboardShouldPersistTaps="handled"
        >
          {manualSuggestions.map((place) => (
            <TouchableOpacity
              key={place.placeId}
              style={styles.searchResult}
              onPress={() => selectManualCity(place)}
            >
              <Ionicons name="location-outline" size={20} color="#667085" />

              <View style={styles.searchResultText}>
                <Text style={styles.searchResultTitle}>{place.mainText}</Text>

                <Text style={styles.searchResultSubtitle}>
                  {place.secondaryText}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={25} color="#111827" />
      </TouchableOpacity>

      <Text style={styles.title}>Add stops for more passengers</Text>

      <Text style={styles.subtitle}>
        Choose cities along your route. Stops are optional.
      </Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={MATCHWAY_RED} />

          <Text style={styles.loadingText}>
            Finding cities along your route...
          </Text>
        </View>
      ) : null}

      {!loading ? (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {routeCities.map((city) => {
            const selected = isSelected(city.placeId);

            return (
              <TouchableOpacity
                key={city.placeId}
                style={styles.cityRow}
                onPress={() => toggleCity(city)}
              >
                <View style={styles.cityContent}>
                  <Text style={styles.cityName}>{city.label}</Text>
                </View>

                <View
                  style={[styles.checkbox, selected && styles.checkboxSelected]}
                >
                  {selected ? (
                    <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}

          {extraStops.map((stop) => (
            <TouchableOpacity
              key={stop.placeId}
              style={styles.cityRow}
              onPress={() => removeStop(stop.placeId)}
            >
              <View style={styles.cityContent}>
                <Text style={styles.cityName}>{stop.label.split(",")[0]}</Text>

                <Text style={styles.cityHint}>Added by you</Text>
              </View>

              <View style={[styles.checkbox, styles.checkboxSelected]}>
                <Ionicons name="checkmark" size={17} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addCityButton}
            onPress={() => setManualMode(true)}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={MATCHWAY_RED}
            />

            <Text style={styles.addCityText}>Add city</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}

      {!loading ? (
        <TouchableOpacity style={styles.continueButton} onPress={continueOffer}>
          <Text style={styles.continueText}>Continue</Text>

          <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    paddingHorizontal: 20,

    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 44,
    height: 44,

    marginTop: 6,

    borderRadius: 22,

    borderWidth: 1,
    borderColor: "#E5E7EB",

    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    marginTop: 24,

    fontSize: 29,
    lineHeight: 36,
    fontWeight: "700",

    color: "#111827",
  },

  subtitle: {
    marginTop: 7,
    marginBottom: 16,

    fontSize: 14,
    lineHeight: 20,

    color: "#667085",
  },

  list: {
    flex: 1,
  },

  cityRow: {
    minHeight: 72,

    flexDirection: "row",
    alignItems: "center",

    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
  },

  cityContent: {
    flex: 1,
  },

  cityName: {
    fontSize: 16,
    fontWeight: "700",

    color: "#111827",
  },

  cityHint: {
    marginTop: 3,

    fontSize: 12,

    color: "#667085",
  },

  checkbox: {
    width: 25,
    height: 25,

    borderRadius: 7,

    borderWidth: 2,
    borderColor: "#D0D5DD",

    alignItems: "center",
    justifyContent: "center",
  },

  checkboxSelected: {
    borderColor: MATCHWAY_RED,

    backgroundColor: MATCHWAY_RED,
  },

  addCityButton: {
    minHeight: 70,

    flexDirection: "row",
    alignItems: "center",

    gap: 10,
  },

  addCityText: {
    fontSize: 16,
    fontWeight: "700",

    color: MATCHWAY_RED,
  },

  continueButton: {
    height: 56,

    marginTop: 10,
    marginBottom: 10,

    borderRadius: 18,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    backgroundColor: MATCHWAY_RED,
  },

  continueText: {
    fontSize: 17,
    fontWeight: "700",

    color: "#FFFFFF",
  },

  loadingBox: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,

    fontSize: 14,

    color: "#667085",
  },

  searchBox: {
    height: 58,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 15,

    borderWidth: 1.5,
    borderColor: MATCHWAY_RED,

    borderRadius: 17,

    gap: 9,
  },

  input: {
    flex: 1,

    fontSize: 16,

    color: "#111827",
  },

  manualLoader: {
    marginTop: 18,
  },

  manualResults: {
    flex: 1,

    marginTop: 10,
  },

  searchResult: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    gap: 12,

    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
  },

  searchResultText: {
    flex: 1,
  },

  searchResultTitle: {
    fontSize: 16,
    fontWeight: "600",

    color: "#111827",
  },

  searchResultSubtitle: {
    marginTop: 2,

    fontSize: 13,

    color: "#667085",
  },
});
