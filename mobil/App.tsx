import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nProvider } from "./src/contexts/I18nContext";
import RootNavigator from "./src/navigation/RootNavigator";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    ...(Platform.OS === "web" ? { minHeight: "100vh" } : {}),
  } as any,
});

const navTheme = {
  dark: false,
  colors: {
    primary: "#84BD00",
    background: "#FFFFFF",
    card: "#FFFFFF",
    text: "#1A1A1A",
    border: "#E0E0E0",
    notification: "#84BD00",
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <I18nProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </I18nProvider>
      </View>
    </SafeAreaProvider>
  );
}
