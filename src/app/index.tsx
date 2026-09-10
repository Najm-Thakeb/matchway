import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSearchStore } from "../store/searchStore";

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
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export default function HomeScreen() {
  const {
    fromLabel,
    fromPlaceId,
    toLabel,
    toPlaceId,
    departureDate,
    returnDate,
    passengers,
    clearReturnDate,
  } = useSearchStore();

  const departureText = formatDate(departureDate);

  const returnText = returnDate ? formatDate(returnDate) : "Add return";

  const passengerText =
    passengers === 1 ? "1 passenger" : `${passengers} passengers`;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>MatchWay</Text>

      <View style={styles.searchBox}>
        {/* FROM */}
        <TouchableOpacity
          style={styles.locationItem}
          onPress={() =>
            router.push({
              pathname: "/location",
              params: {
                mode: "from",

                fromLabel,
                fromPlaceId,
                toLabel,
                toPlaceId,

                departureDate,
                returnDate,
                passengers: String(passengers),
              },
            })
          }
        >
          <Text style={styles.label}>From</Text>

          <Text style={fromLabel ? styles.value : styles.locationValue}>
            {fromLabel || "City, station or place"}
          </Text>
        </TouchableOpacity>

        {/* TO */}
        <TouchableOpacity
          style={styles.locationItem}
          onPress={() =>
            router.push({
              pathname: "/location",
              params: {
                mode: "to",

                fromLabel,
                fromPlaceId,
                toLabel,
                toPlaceId,

                departureDate,
                returnDate,
                passengers: String(passengers),
              },
            })
          }
        >
          <Text style={styles.label}>To</Text>

          <Text style={toLabel ? styles.value : styles.locationValue}>
            {toLabel || "City, station or place"}
          </Text>
        </TouchableOpacity>

        {/* DEPARTURE + RETURN */}
        <View style={styles.dateRow}>
          {/* DEPARTURE */}
          <TouchableOpacity
            style={styles.dateItem}
            onPress={() =>
              router.push({
                pathname: "/date",
                params: {
                  mode: "departure",

                  fromLabel,
                  fromPlaceId,
                  toLabel,
                  toPlaceId,

                  departureDate,
                  returnDate,
                  passengers: String(passengers),
                },
              })
            }
          >
            <Text style={styles.label}>Departure</Text>
            <Text style={styles.value}>{departureText}</Text>
          </TouchableOpacity>

          {/* RETURN */}
          <View style={[styles.dateItem, styles.returnItem]}>
            <TouchableOpacity
              style={styles.returnContent}
              onPress={() =>
                router.push({
                  pathname: "/date",
                  params: {
                    mode: "return",

                    fromLabel,
                    fromPlaceId,
                    toLabel,
                    toPlaceId,

                    departureDate,
                    returnDate,
                    passengers: String(passengers),
                  },
                })
              }
            >
              <Text style={styles.label}>Return</Text>
              <Text style={styles.value}>{returnText}</Text>
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
          style={styles.passengerItem}
          onPress={() =>
            router.push({
              pathname: "/passengers",
              params: {
                fromLabel,
                fromPlaceId,
                toLabel,
                toPlaceId,

                departureDate,
                returnDate,
                passengers: String(passengers),
              },
            })
          }
        >
          <Text style={styles.label}>Passengers</Text>

          <Text style={styles.value}>{passengerText}</Text>
        </TouchableOpacity>

        {/* SEARCH */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (!fromLabel || !toLabel) {
              Alert.alert("Missing location", "Please select From and To.");
              return;
            }

            router.push("/results");
          }}
        >
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },

  logo: {
    fontSize: 33,
    fontWeight: "bold",
    marginBottom: 40,
  },

  searchBox: {
    gap: 20,
  },

  locationItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
  },

  locationValue: {
    fontSize: 18,
    color: "#888888",
  },

  dateRow: {
    flexDirection: "row",
    gap: 20,
  },

  dateItem: {
    flex: 1,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
  },

  passengerItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
  },

  label: {
    fontSize: 14,
    color: "#777777",
    marginBottom: 6,
  },

  value: {
    fontSize: 18,
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#E63946",
    padding: 18,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },

  returnItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  returnContent: {
    flex: 1,
  },

  clearReturnButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  clearReturnText: {
    fontSize: 30,
    color: "#667085",
  },
});
