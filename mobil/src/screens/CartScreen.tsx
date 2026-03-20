import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useI18n } from "../contexts/I18nContext";
import { COLORS, SPACING } from "../constants/theme";

export default function CartScreen() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t("cart.title")}</Text>
        <Text style={styles.emptyText}>{t("cart.empty")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center" },
  empty: { alignItems: "center", padding: SPACING.lg },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: COLORS.text, marginBottom: SPACING.sm },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
});
