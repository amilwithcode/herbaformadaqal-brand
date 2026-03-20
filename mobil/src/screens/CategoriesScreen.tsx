import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useI18n } from "../contexts/I18nContext";
import { COLORS, SPACING } from "../constants/theme";
import { API_BASE_URL } from "../constants/config";

type Category = {
  id: string;
  name: string;
  slug?: string;
  image_url?: string;
  product_count?: number;
};

export default function CategoriesScreen() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        if (!cancelled && Array.isArray(data.categories)) setCategories(data.categories);
        else if (!cancelled) setCategories([]);
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCategories();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t("common.error")}: {error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.cardBody}>
            <Text style={styles.name}>{item.name}</Text>
            {item.product_count != null && (
              <Text style={styles.count}>{item.product_count} məhsul</Text>
            )}
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t("categories.title")} – boş</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: SPACING.md, paddingBottom: SPACING.xl },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: SPACING.sm,
  },
  image: { width: 80, height: 80, backgroundColor: COLORS.border },
  imagePlaceholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 24, color: COLORS.textSecondary },
  cardBody: { flex: 1, justifyContent: "center", padding: SPACING.md },
  name: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  count: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.xs },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.lg },
  loadingText: { marginTop: SPACING.sm, color: COLORS.textSecondary },
  errorText: { color: COLORS.error, textAlign: "center" },
  emptyText: { color: COLORS.textSecondary },
});
