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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useI18n } from "../contexts/I18nContext";
import { COLORS, SPACING } from "../constants/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { API_BASE_URL } from "../constants/config";

type Product = {
  id: string;
  name: string;
  slug?: string;
  price?: number;
  image_url?: string;
};

type Nav = NativeStackNavigationProp<RootStackParamList, "MainTabs">;

export default function ProductsScreen() {
  const { t } = useI18n();
  const navigation = useNavigation<Nav>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/products?limit=20`);
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        if (!cancelled && Array.isArray(data.products)) setProducts(data.products);
        else if (!cancelled) setProducts([]);
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  const openProduct = (id: string) => {
    (navigation.getParent() as any)?.navigate?.("ProductDetail", { productId: id });
  };

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
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => openProduct(item.id)}
          activeOpacity={0.8}
        >
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>?</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          {item.price != null && (
            <Text style={styles.price}>{item.price} ₼</Text>
          )}
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t("products.title")} – boş siyahı</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: SPACING.sm, paddingBottom: SPACING.xl },
  row: { justifyContent: "space-between", marginBottom: SPACING.sm },
  card: {
    width: "48%",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: "hidden",
    paddingBottom: SPACING.sm,
  },
  image: { width: "100%", height: 120, backgroundColor: COLORS.border },
  imagePlaceholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 24, color: COLORS.textSecondary },
  name: { fontSize: 14, fontWeight: "600", color: COLORS.text, padding: SPACING.xs, marginTop: SPACING.xs },
  price: { fontSize: 14, color: COLORS.primary, paddingHorizontal: SPACING.xs },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.lg },
  loadingText: { marginTop: SPACING.sm, color: COLORS.textSecondary },
  errorText: { color: COLORS.error, textAlign: "center" },
  emptyText: { color: COLORS.textSecondary },
});
