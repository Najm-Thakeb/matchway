import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();

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
      <View
        style={[
          styles.panel,
          {
            paddingTop: insets.top + 14,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.dismiss()}
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Edit your search</Text>

        <View style={styles.form}>
          {/* FROM / TO */}
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

              <Text style={styles.value} numberOfLines={1}>
                {fromLabel}
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

              <Text style={styles.value} numberOfLines={1}>
                {toLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.swapButton} onPress={swapLocations}>
              <View style={styles.swapArrows}>
                <Text style={styles.swapArrow}>↑</Text>

                <Text style={styles.swapArrow}>↓</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* DATE */}
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

              <Text style={styles.value}>{formatDate(departureDate)}</Text>
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

                <Text style={returnDate ? styles.value : styles.placeholder}>
                  {returnDate ? formatDate(returnDate) : "Add return"}
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

          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => router.dismiss()}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingHorizontal: 18,
    paddingBottom: 28,
  },

  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 22,

    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  closeText: {
    fontSize: 32,
    color: "#111827",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 18,
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

    marginHorizontal: 18,
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
  },

  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
