import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

function formatDepartureDate(dateString?: string) {
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
    date?: string;
    returnDate?: string;
    passengers?: string;
  }>();

  const departureText = formatDepartureDate(params.date);
  const passengerCount = Number(params.passengers ?? "1");

  const passengerText =
    passengerCount === 1 ? "1 passenger" : `${passengerCount} passengers`;
  const returnText = params.returnDate
    ? formatDepartureDate(params.returnDate)
    : "Add return";

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>MatchWay</Text>

      <View style={styles.searchBox}>
        <TextInput style={styles.item} placeholder="From" />

        <TextInput style={styles.item} placeholder="To" />

        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateItem}
            onPress={() => router.push("/date")}
          >
            <Text style={styles.label}>Departure</Text>
            <Text style={styles.value}>{departureText}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateItem}
            onPress={() =>
              router.push({
                pathname: "/date",
                params: {
                  mode: "return",
                  departureDate: params.date ?? "",
                },
              })
            }
          >
            <Text style={styles.label}>Return</Text>
            <Text style={styles.value}>{returnText}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.passengerItem}
          onPress={() =>
            router.push({
              pathname: "/passengers",
              params: {
                date: params.date ?? "",
                returnDate: params.returnDate ?? "",
                passengers: params.passengers ?? "1",
              },
            })
          }
        >
          <Text style={styles.label}>Passengers</Text>
          <Text style={styles.value}>{passengerText}</Text>
        </TouchableOpacity>

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
    backgroundColor: "#ffffff",
  },

  logo: {
    fontSize: 33,
    fontWeight: "bold",
    marginBottom: 40,
  },

  searchBox: {
    gap: 20,
  },

  item: {
    fontSize: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
  },

  dateRow: {
    flexDirection: "row",
    gap: 20,
  },

  dateItem: {
    flex: 1,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
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
    backgroundColor: "#333333",
    padding: 18,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
  passengerItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#dddddd",
  },
});
