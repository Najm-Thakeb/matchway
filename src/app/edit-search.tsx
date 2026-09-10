import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
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

export default function EditSearchScreen() {
  const {
    fromLabel,
    toLabel,
    departureDate,
    returnDate,
    passengers,
    clearReturnDate,
    swapLocations,
  } = useSearchStore();

  const passengerText =
    passengers === 1 ? "1 passenger" : `${passengers} passengers`;

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.panel}>
        {/* CLOSE */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Edit your search</Text>

        <View style={styles.searchCard}>
          {/* FROM + SWAP */}
          <View style={styles.locationRow}>
            <TouchableOpacity
              style={styles.locationContent}
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
              <Text style={styles.value} numberOfLines={1}>
                {fromLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
              <View style={styles.swapIcon}>
                <Text style={styles.swapArrow}>↑</Text>
                <Text style={styles.swapArrow}>↓</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* TO */}
          <TouchableOpacity
            style={styles.normalRow}
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
            <Text style={styles.value} numberOfLines={1}>
              {toLabel}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* DEPARTURE + RETURN */}
          <View style={styles.dateRow}>
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

              <Text style={styles.value} numberOfLines={1}>
                {formatDate(departureDate)}
              </Text>
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

                <Text style={styles.value} numberOfLines={1}>
                  {returnDate ? formatDate(returnDate) : "Add return"}
                </Text>
              </TouchableOpacity>

              {returnDate ? (
                <TouchableOpacity
                  style={styles.clearReturn}
                  onPress={clearReturnDate}
                >
                  <Text style={styles.clearReturnText}>×</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          {/* PASSENGERS */}
          <TouchableOpacity
            style={styles.passengerRow}
            onPress={() => router.push("/passengers")}
          >
            <Text style={styles.label}>Passengers</Text>

            <Text style={styles.value}>{passengerText}</Text>
          </TouchableOpacity>

          {/* SEARCH */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.back()}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },

  panel: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },

  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  closeText: {
    fontSize: 32,
    color: "#111111",
    lineHeight: 34,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 18,
  },

  searchCard: {
    borderWidth: 2,
    borderColor: MATCHWAY_RED,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 72,
    paddingLeft: 18,
    paddingRight: 10,
  },

  locationContent: {
    flex: 1,
    justifyContent: "center",
    minHeight: 72,
  },

  normalRow: {
    minHeight: 72,
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  passengerRow: {
    minHeight: 72,
    justifyContent: "center",
    paddingHorizontal: 18,
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

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 18,
  },

  swapButton: {
    width: 46,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  swapIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },

  swapArrow: {
    fontSize: 22,
    color: MATCHWAY_RED,
    fontWeight: "500",
  },

  dateRow: {
    flexDirection: "row",
    minHeight: 76,
    paddingHorizontal: 18,
  },

  dateItem: {
    flex: 1,
    justifyContent: "center",
  },

  verticalDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 14,
    marginHorizontal: 14,
  },

  returnItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  returnContent: {
    flex: 1,
    justifyContent: "center",
    minHeight: 76,
  },

  clearReturn: {
    width: 28,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  clearReturnText: {
    fontSize: 25,
    color: "#667085",
  },

  searchButton: {
    backgroundColor: MATCHWAY_RED,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },

  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
