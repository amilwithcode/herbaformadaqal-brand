import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { useI18n } from "../contexts/I18nContext";
import { COLORS, SPACING } from "../constants/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { API_BASE_URL } from "../constants/config";

type Route = RouteProp<RootStackParamList, "ProductDetail">;

type ProductDetail = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  image_url?: string;
};

export default function ProductDetailScreen() {
  const { t } = useI18n();
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { productId } = route.params;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        if (!cancelled) setProduct(data.product ?? data);
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProduct();
    return () => { cancelled = true; };
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t("common.error")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>?</Text>
        </View>
      )}
      <Text style={styles.name}>{product.name}</Text>
      {product.price != null && (
        <Text style={styles.price}>{product.price} ₼</Text>
      )}
      {product.description ? (
        <Text style={styles.description}>{product.description}</Text>
      ) : null}
      <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
        <Text style={styles.addButtonText}>Səbətə əlavə et</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xl },
  image: { width: "100%", height: 280, backgroundColor: COLORS.backgroundSecondary, borderRadius: 12 },
  imagePlaceholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 48, color: COLORS.textSecondary },
  name: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginTop: SPACING.md },
  price: { fontSize: 18, color: COLORS.primary, marginTop: SPACING.xs },
  description: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.md },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.lg,
  },
  addButtonText: { fontSize: 16, fontWeight: "600", color: COLORS.white },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.lg },
  loadingText: { marginTop: SPACING.sm, color: COLORS.textSecondary },
  errorText: { color: COLORS.error },
});
