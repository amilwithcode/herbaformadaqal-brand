import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useI18n } from "../contexts/I18nContext";
import { COLORS, SPACING } from "../constants/theme";

export default function HomeScreen() {
  const { t } = useI18n();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t("home.welcome")}</Text>
        <Text style={styles.heroSubtitle}>Sağlamlıq və enerji üçün Herbalife məhsulları</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Məhsul kateqoriyaları</Text>
        <Text style={styles.cardText}>
          Arıqlama, çəki idarəetməsi, vitaminlər və əlavələr – hamısı bir tətbiqdə.
        </Text>
      </View>

      <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
        <Text style={styles.ctaText}>{t("home.cta")}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Herbalife Brand © 2025</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, padding: SPACING.md, paddingBottom: SPACING.xl },
  hero: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  heroSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)" },
  card: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: SPACING.xs },
  cardText: { fontSize: 14, color: COLORS.textSecondary },
  ctaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  ctaText: { fontSize: 16, fontWeight: "600", color: COLORS.white },
  footer: { alignItems: "center" },
  footerText: { fontSize: 12, color: COLORS.textSecondary },
});
