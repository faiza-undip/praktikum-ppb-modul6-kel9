import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Api } from "../services/api.js";
import { DataTable } from "../components/DataTable.js";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext.js";

const PAGE_SIZE = 5;

function Paginator({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const window = 5;
  const half = Math.floor(window / 2);
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

export function ControlScreen({ navigation }) {
  const { isAuthenticated } = useAuth();
  const [thresholdValue, setThresholdValue] = useState(30);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPage = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await Api.getThresholds({ page: p, pageSize: PAGE_SIZE });
      setHistory(res.items ?? []);
      setPage(res.page ?? p);
      setTotalPages(res.totalPages ?? 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setError("Please login to access this page");
        return;
      }
      loadPage(1);
    }, [loadPage, isAuthenticated])
  );

  const latestThreshold = useMemo(() => history?.[0]?.value ?? null, [history]);

  const handleSubmit = useCallback(async () => {
    if (!isAuthenticated) {
      setError("Please login to configure threshold");
      return;
    }

    const valueNumber = Number(thresholdValue);
    if (Number.isNaN(valueNumber)) {
      setError("Please enter a numeric threshold.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await Api.createThreshold({ value: valueNumber, note });
      setNote("");
      await loadPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [thresholdValue, note, loadPage, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        style={styles.restrictedContainer}
        edges={["top", "bottom"]}
      >
        <View style={styles.restrictedContent}>
          <Ionicons name="lock-closed-outline" size={80} color="#9ca3af" />
          <Text style={styles.restrictedTitle}>Access Restricted</Text>
          <Text style={styles.restrictedText}>
            Please sign in to access the control panel and configure thresholds.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Configure Threshold</Text>
            {latestThreshold !== null && (
              <Text style={styles.metaText}>
                Current threshold: {Number(latestThreshold).toFixed(2)}°C
              </Text>
            )}
            <Text style={styles.label}>Threshold (°C)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(thresholdValue)}
              onChangeText={setThresholdValue}
            />
            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              placeholder="Describe why you are changing the threshold"
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save Threshold</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Threshold History</Text>
            {loading && <ActivityIndicator />}
          </View>

          <DataTable
            columns={[
              {
                key: "created_at",
                title: "Saved At",
                render: (v) => (v ? new Date(v).toLocaleString() : "--"),
              },
              {
                key: "value",
                title: "Threshold (°C)",
                render: (v) =>
                  typeof v === "number" ? `${Number(v).toFixed(2)}` : "--",
              },
              { key: "note", title: "Note", render: (v) => v || "-" },
            ]}
            data={history}
            keyExtractor={(item) => item.id}
          />

          <Paginator
            page={page}
            totalPages={totalPages}
            onChange={(p) => loadPage(p)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f8f9fb" },
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
  label: { marginTop: 16, fontWeight: "600", color: "#444" },
  input: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  button: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  metaText: { color: "#666" },
  errorText: { marginTop: 12, color: "#c82333" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600" },

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

  restrictedContainer: { flex: 1, backgroundColor: "#f8f9fb" },
  restrictedContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  restrictedTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  restrictedText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
