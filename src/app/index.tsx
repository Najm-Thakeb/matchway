import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

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
  const params = useLocalSearchParams<{
    departureDate?: string;
    returnDate?: string;
    passengers?: string;
  }>();

  const departureText = formatDate(params.departureDate);

  const returnText = params.returnDate
    ? formatDate(params.returnDate)
    : "Add return";

  const passengerCount = Number(params.passengers ?? "1");

  const passengerText =
    passengerCount === 1 ? "1 passenger" : `${passengerCount} passengers`;

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
              },
            })
          }
        >
          <Text style={styles.label}>From</Text>
          <Text style={styles.locationValue}>City, station or place</Text>
        </TouchableOpacity>

        {/* TO */}
        <TouchableOpacity
          style={styles.locationItem}
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
          <Text style={styles.locationValue}>City, station or place</Text>
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
                  departureDate: params.departureDate ?? "",
                  returnDate: params.returnDate ?? "",
                  passengers: params.passengers ?? "1",
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
                    departureDate: params.departureDate ?? "",
                    returnDate: params.returnDate ?? "",
                    passengers: params.passengers ?? "1",
                  },
                })
              }
            >
              <Text style={styles.label}>Return</Text>
              <Text style={styles.value}>{returnText}</Text>
            </TouchableOpacity>

            {params.returnDate ? (
              <TouchableOpacity
                style={styles.clearReturnButton}
                onPress={() =>
                  router.setParams({
                    returnDate: "",
                  })
                }
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
                departureDate: params.departureDate ?? "",
                returnDate: params.returnDate ?? "",
                passengers: params.passengers ?? "1",
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
          onPress={() =>
            Alert.alert(
              "Search",
              "Here we will later search for matching rides.",
            )
          }
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
