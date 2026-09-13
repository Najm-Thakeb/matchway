import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import BottomNav from "../components/BottomNav";
import { useSearchStore } from "../store/searchStore";

const MATCHWAY_RED = "#E63946";

function formatDate(dateString?: string) {
  if (!dateString) {
    return "Today";
  }

  const selectedDate = new Date(dateString);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  selectedDate.setHours(0, 0, 0, 0);

  if (selectedDate.getTime() === today.getTime()) {
    return "Today";
  }

  if (selectedDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  return selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function HomeScreen() {
  const {
    fromLabel,
    toLabel,
    departureDate,
    returnDate,
    passengers,
    clearReturnDate,
    swapLocations,
  } = useSearchStore();

  const departureText = formatDate(departureDate);

  const returnText = returnDate ? formatDate(returnDate) : "Add return";

  const passengerText =
    passengers === 1 ? "1 Passenger" : `${passengers} Passengers`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>MatchWay</Text>

        <View style={styles.form}>
          {/* FROM + TO */}
          <View style={styles.locationsBox}>
            <TouchableOpacity
              style={styles.locationRow}
              onPress={() =>
                router.push({
                  pathname: "/location",
                  params: {
                    mode: "from",
                  },
                })
              }
            >
              <Text style={styles.label}>From</Text>

              <Text
                style={fromLabel ? styles.value : styles.placeholder}
                numberOfLines={1}
              >
                {fromLabel || "City, station or place"}
              </Text>
            </TouchableOpacity>

            <View style={styles.locationDivider} />

            <TouchableOpacity
              style={styles.locationRow}
              onPress={() =>
                router.push({
                  pathname: "/location",
                  params: {
                    mode: "to",
                  },
                })
              }
            >
              <Text style={styles.label}>To</Text>

              <Text
                style={toLabel ? styles.value : styles.placeholder}
                numberOfLines={1}
              >
                {toLabel || "City, station or place"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.swapButton}
              onPress={swapLocations}
              activeOpacity={0.8}
            >
              <View style={styles.swapArrows}>
                <Text style={styles.swapArrow}>↑</Text>

                <Text style={styles.swapArrow}>↓</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* DATES */}
          <View style={styles.dateBox}>
            <TouchableOpacity
              style={styles.dateItem}
              onPress={() =>
                router.push({
                  pathname: "/date",
                  params: {
                    mode: "departure",
                  },
                })
              }
            >
              <Text style={styles.label}>Departure</Text>

              <Text style={styles.value}>{departureText}</Text>
            </TouchableOpacity>

            <View style={styles.verticalDivider} />

            <View style={styles.returnItem}>
              <TouchableOpacity
                style={styles.returnContent}
                onPress={() =>
                  router.push({
                    pathname: "/date",
                    params: {
                      mode: "return",
                    },
                  })
                }
              >
                <Text style={styles.label}>Return</Text>

                <Text
                  style={returnDate ? styles.value : styles.placeholder}
                  numberOfLines={1}
                >
                  {returnText}
                </Text>
              </TouchableOpacity>

              {returnDate ? (
                <TouchableOpacity
                  style={styles.clearReturnButton}
                  onPress={clearReturnDate}
                >
                  <Text style={styles.clearReturnText}>×</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* PASSENGERS */}
          <TouchableOpacity
            style={styles.passengerBox}
            onPress={() => router.push("/passengers")}
          >
            <Text style={styles.label}>Passengers</Text>

            <Text style={styles.value}>{passengerText}</Text>
          </TouchableOpacity>

          {/* SEARCH */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              if (!fromLabel || !toLabel) {
                Alert.alert("Missing location", "Please select From and To.");

                return;
              }

              router.push("/results");
            }}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      <BottomNav activeTab="search" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    flex: 1,

    paddingHorizontal: 18,
    paddingBottom: 105,
  },

  logo: {
    fontSize: 31,
    fontWeight: "700",

    marginTop: 10,
    marginBottom: 24,

    color: "#111827",
  },

  form: {
    gap: 12,
  },

  locationsBox: {
    position: "relative",

    borderWidth: 1.5,
    borderColor: MATCHWAY_RED,

    borderRadius: 18,

    backgroundColor: "#FFFFFF",
  },

  locationRow: {
    height: 68,

    justifyContent: "center",

    paddingLeft: 18,
    paddingRight: 72,
  },

  locationDivider: {
    height: 1,

    backgroundColor: "#E5E7EB",

    marginLeft: 18,
    marginRight: 18,
  },

  swapButton: {
    position: "absolute",

    right: 14,
    top: 43,

    width: 50,
    height: 50,

    borderRadius: 25,

    backgroundColor: "#FFFFFF",

    borderWidth: 1.5,
    borderColor: "#D1D5DB",

    alignItems: "center",
    justifyContent: "center",
  },

  swapArrows: {
    flexDirection: "row",
    alignItems: "center",
  },

  swapArrow: {
    fontSize: 22,
    color: MATCHWAY_RED,
    fontWeight: "500",
  },

  dateBox: {
    flexDirection: "row",

    minHeight: 68,

    borderWidth: 1,
    borderColor: "#D1D5DB",

    borderRadius: 16,

    backgroundColor: "#FFFFFF",
  },

  dateItem: {
    flex: 1,

    justifyContent: "center",

    paddingHorizontal: 16,
  },

  verticalDivider: {
    width: 1,

    backgroundColor: "#E5E7EB",

    marginVertical: 12,
  },

  returnItem: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",

    paddingLeft: 16,
  },

  returnContent: {
    flex: 1,

    justifyContent: "center",

    minHeight: 68,
  },

  clearReturnButton: {
    width: 34,
    height: 44,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 5,
  },

  clearReturnText: {
    fontSize: 26,
    color: "#667085",
  },

  passengerBox: {
    height: 68,

    justifyContent: "center",

    paddingHorizontal: 16,

    borderWidth: 1,
    borderColor: "#D1D5DB",

    borderRadius: 16,

    backgroundColor: "#FFFFFF",
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#667085",

    marginBottom: 3,
  },

  value: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },

  placeholder: {
    fontSize: 17,
    color: "#8A9099",
  },

  searchButton: {
    height: 58,

    backgroundColor: MATCHWAY_RED,

    borderRadius: 18,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 2,
  },

  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
