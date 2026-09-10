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

export default function ResultsScreen() {
  const { fromLabel, toLabel, departureDate, passengers } = useSearchStore();

  const passengerText =
    passengers === 1 ? "1 passenger" : `${passengers} passengers`;

  return (
    <SafeAreaView style={styles.container}>
      {/* SEARCH SUMMARY */}
      <View style={styles.topArea}>
        <View style={styles.searchHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.searchSummary}
            onPress={() => router.push("/edit-search")}
          >
            <Text style={styles.routeText} numberOfLines={1}>
              {fromLabel} → {toLabel}
            </Text>

            <Text style={styles.searchInfo}>
              {formatDate(departureDate)}, {passengerText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={styles.tabs}>
          <View style={styles.activeTab}>
            <Text style={styles.activeTabText}>All</Text>
          </View>

          <View style={styles.tab}>
            <Text style={styles.tabText}>Rides</Text>
          </View>
        </View>
      </View>

      {/* RESULTS */}
      <View style={styles.results}>
        <Text style={styles.dateTitle}>{formatDate(departureDate)}</Text>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No rides found yet</Text>

          <Text style={styles.emptyText}>
            Available rides will appear here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5F8",
  },

  topArea: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  backButton: {
    width: 40,
    height: 48,
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 38,
    color: "#667085",
    lineHeight: 40,
  },

  searchSummary: {
    flex: 1,
    paddingHorizontal: 4,
  },

  routeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },

  searchInfo: {
    marginTop: 3,
    fontSize: 15,
    color: "#667085",
  },

  filterButton: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },

  filterText: {
    fontSize: 17,
    fontWeight: "700",
    color: MATCHWAY_RED,
  },

  tabs: {
    flexDirection: "row",
    marginTop: 22,
  },

  activeTab: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 3,
    borderBottomColor: MATCHWAY_RED,
  },

  tab: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 14,
  },

  activeTabText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  tabText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#667085",
  },

  results: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 26,
  },

  dateTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 22,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 15,
    color: "#667085",
  },
});
