import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useI18n } from "../contexts/I18nContext";
import { COLORS, SPACING } from "../constants/theme";
import type { Locale } from "../constants/config";

export default function AccountScreen() {
  const { t, locale, setLocale } = useI18n();
  const locales: Locale[] = ["az", "en", "tr", "ru"];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t("account.title")}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dil / Language</Text>
        <View style={styles.localeRow}>
          {locales.map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[styles.localeBtn, locale === loc && styles.localeBtnActive]}
              onPress={() => setLocale(loc)}
            >
              <Text style={[styles.localeText, locale === loc && styles.localeTextActive]}>
                {loc.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.button} activeOpacity={0.8}>
        <Text style={styles.buttonText}>{t("account.login")}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.buttonSecondary]} activeOpacity={0.8}>
        <Text style={styles.buttonTextSecondary}>{t("account.register")}</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Herbalife Brand – Mobil tətbiq v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  localeRow: { flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" },
  localeBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundSecondary,
  },
  localeBtnActive: { backgroundColor: COLORS.primary },
  localeText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  localeTextActive: { color: COLORS.white },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  buttonSecondary: { backgroundColor: "transparent", borderWidth: 2, borderColor: COLORS.primary },
  buttonText: { fontSize: 16, fontWeight: "600", color: COLORS.white },
  buttonTextSecondary: { fontSize: 16, fontWeight: "600", color: COLORS.primary },
  footer: { marginTop: SPACING.xl, fontSize: 12, color: COLORS.textSecondary, textAlign: "center" },
});
