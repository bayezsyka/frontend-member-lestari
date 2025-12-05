// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BG = "#F2D593";
const ACCENT = "#283845";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: BG,
          borderTopColor: ACCENT,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = "ellipse-outline";

          if (route.name === "index") {
            // Pembayaran
            iconName = "cash-outline";
          } else if (route.name === "explore") {
            // Member list
            iconName = "people-outline";
          } else if (route.name === "history") {
            // Riwayat transaksi
            iconName = "time-outline";
          } else if (route.name === "create-member") {
            // Buat member baru
            iconName = "person-add-outline";
          } else if (route.name === "profile") {
            // Profil/About
            iconName = "information-circle-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Pembayaran",
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Member",
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "Riwayat",
        }}
      />

      <Tabs.Screen
        name="create-member"
        options={{
          title: "Buat Member",
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
        }}
      />
    </Tabs>
  );
}
