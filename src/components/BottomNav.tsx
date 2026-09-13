import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

const MATCHWAY_RED = "#E63946";

type TabName = "search" | "offer" | "trips" | "inbox" | "profile";

type Props = {
  activeTab: TabName;
};

export default function BottomNav({ activeTab }: Props) {
  const insets = useSafeAreaInsets();

  function comingSoon(title: string) {
    Alert.alert(title, "We will build this section soon.");
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.bar}>
        <TabButton
          label="Search"
          icon="search-outline"
          active={activeTab === "search"}
          onPress={() => router.replace("/")}
        />

        <TabButton
          label="Offer"
          icon="add-circle-outline"
          active={activeTab === "offer"}
          onPress={() => router.replace("/offer")}
        />

        <TabButton
          label="Trips"
          icon="car-outline"
          active={activeTab === "trips"}
          onPress={() => comingSoon("Trips")}
        />

        <TabButton
          label="Inbox"
          icon="chatbubble-outline"
          active={activeTab === "inbox"}
          onPress={() => comingSoon("Inbox")}
        />

        <TabButton
          label="Profile"
          icon="person-outline"
          active={activeTab === "profile"}
          onPress={() => comingSoon("Profile")}
        />
      </View>
    </View>
  );
}

type TabButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
};

function TabButton({ label, icon, active, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.activeTab]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons
        name={icon}
        size={23}
        color={active ? MATCHWAY_RED : "#667085"}
      />

      <Text style={[styles.tabText, active && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 100,
  },

  bar: {
    height: 68,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 7,

    backgroundColor: "#FFFFFF",

    borderRadius: 24,

    borderWidth: 1,
    borderColor: "#E7E9ED",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,

    elevation: 8,
  },

  tab: {
    flex: 1,
    height: 54,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 18,
  },

  activeTab: {
    backgroundColor: "#FFF1F2",
  },

  tabText: {
    marginTop: 2,

    fontSize: 11,
    fontWeight: "600",

    color: "#667085",
  },

  activeTabText: {
    color: MATCHWAY_RED,
  },
});
