import { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useMqttSensor } from "../hooks/useMqttSensor.js";
import { SafeAreaView } from "react-native-safe-area-context";

import { Api } from "../services/api.js";
import { DataTable } from "../components/DataTable.js";

const PAGE_SIZE = 5;

function Paginator({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const window = 5,
    half = Math.floor(window / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(totalPages, start + window - 1);
  if (end - start + 1 < window) start = Math.max(1, end - window + 1);
  const nums = [];
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <View style={styles.paginationRow}>
      <TouchableOpacity
        style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
        onPress={() => onChange(1)}
        disabled={page === 1}
      >
        <Text style={styles.pageBtnText}>First</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
        onPress={() => onChange(page - 1)}
        disabled={page === 1}
      >
        <Text style={styles.pageBtnText}>Prev</Text>
      </TouchableOpacity>
      {nums.map((n) => (
        <TouchableOpacity
          key={n}
          style={[styles.pageNum, n === page && styles.pageNumActive]}
          onPress={() => onChange(n)}
        >
          <Text
            style={[styles.pageNumText, n === page && styles.pageNumTextActive]}
          >
            {n}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
        onPress={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        <Text style={styles.pageBtnText}>Next</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
        onPress={() => onChange(totalPages)}
        disabled={page === totalPages}
      >
        <Text style={styles.pageBtnText}>Last</Text>
      </TouchableOpacity>
    </View>
  );
}

export function MonitoringScreen({ navigation }) {
  const {
    temperature,
    timestamp,
    connectionState,
    error: mqttError,
  } = useMqttSensor();

  const [readings, setReadings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(null);

  const loadPage = useCallback(async (p = 1) => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await Api.getSensorReadings({ page: p, pageSize: PAGE_SIZE });
      setReadings(res.items ?? []);
      setPage(res.page ?? p);
      setTotalPages(res.totalPages ?? 1);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPage(1);
    }, [loadPage])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPage(page);
    } finally {
      setRefreshing(false);
    }
  }, [loadPage, page]);

  // Gesture handler untuk swipe kiri -> Control screen
  const swipeGesture = Gesture.Fling()
    .direction(2) // 2 = left
    .onEnd(() => {
      navigation.navigate("Control");
    });

  // Gesture handler untuk swipe kanan -> Profile screen
  const swipeRightGesture = Gesture.Fling()
    .direction(1) // 1 = right
    .onEnd(() => {
      navigation.navigate("Profile");
    });

  const combinedGesture = Gesture.Race(swipeGesture, swipeRightGesture);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <GestureDetector gesture={combinedGesture}>
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.card}>
            <Text style={styles.title}>Realtime Temperature</Text>
            <View style={styles.valueRow}>
              <Text style={styles.temperatureText}>
                {typeof temperature === "number"
                  ? `${temperature.toFixed(2)}°C`
                  : "--"}
              </Text>
            </View>
            <Text style={styles.metaText}>MQTT status: {connectionState}</Text>
            {timestamp && (
              <Text style={styles.metaText}>
                Last update: {new Date(timestamp).toLocaleString()}
              </Text>
            )}
            {mqttError && (
              <Text style={styles.errorText}>MQTT error: {mqttError}</Text>
            )}

            <View style={styles.gestureHint}>
              <Text style={styles.gestureHintText}>
                💡 Swipe left for Control, swipe right for Profile
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Triggered Readings History</Text>
            {loading && <ActivityIndicator />}
          </View>
          {apiError && (
            <Text style={styles.errorText}>
              Failed to load history: {apiError}
            </Text>
          )}

          <DataTable
            columns={[
              {
                key: "recorded_at",
                title: "Timestamp",
                render: (v) => (v ? new Date(v).toLocaleString() : "--"),
              },
              {
                key: "temperature",
                title: "Temperature (°C)",
                render: (v) =>
                  typeof v === "number" ? `${Number(v).toFixed(2)}` : "--",
              },
              {
                key: "threshold_value",
                title: "Threshold (°C)",
                render: (v) =>
                  typeof v === "number" ? `${Number(v).toFixed(2)}` : "--",
              },
            ]}
            data={readings}
            keyExtractor={(item) => item.id}
          />

          <Paginator
            page={page}
            totalPages={totalPages}
            onChange={(p) => loadPage(p)}
          />
        </ScrollView>
      </GestureDetector>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb", padding: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  valueRow: { flexDirection: "row", alignItems: "flex-end" },
  temperatureText: { fontSize: 48, fontWeight: "700", color: "#ff7a59" },
  metaText: { marginTop: 8, color: "#555" },
  errorText: { marginTop: 8, color: "#c82333" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "600" },

  gestureHint: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#e0e7ff",
    borderRadius: 8,
  },
  gestureHintText: {
    fontSize: 13,
    color: "#3730a3",
    textAlign: "center",
  },

  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 6,
  },
  pageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  pageBtnDisabled: { opacity: 0.5 },
  pageBtnText: { color: "#111827", fontWeight: "600" },
  pageNum: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginHorizontal: 2,
  },
  pageNumActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  pageNumText: { color: "#111827", fontWeight: "600" },
  pageNumTextActive: { color: "#fff" },
});
