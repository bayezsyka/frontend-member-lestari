// app/(tabs)/history.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiGet } from "../../src/api";

const BG = "#F2D593";
const ACCENT = "#283845";

type Transaction = {
  id: string;
  memberId: string;
  memberName: string | null;
  memberWhatsapp: string | null;
  transactedAt: string;
  totalAmount: number;
  cashbackEarned: number;
  cashbackSpent: number;
};

type HistorySortMode = "time" | "amount";

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const [sortMode, setSortMode] = useState<HistorySortMode>("time");

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiGet<Transaction[]>("/transactions");
      setTransactions(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Gagal memuat riwayat transaksi.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTransactions = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");
      const data = await apiGet<Transaction[]>("/transactions");
      setTransactions(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Gagal memuat riwayat transaksi.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const sortedTransactions = useMemo(() => {
    const list = [...transactions];

    if (sortMode === "time") {
      return list.sort(
        (a, b) =>
          new Date(b.transactedAt).getTime() -
          new Date(a.transactedAt).getTime()
      );
    }

    return list.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
  }, [transactions, sortMode]);

  const openDetail = (tx: Transaction) => {
    setSelectedTx(tx);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setSelectedTx(null);
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const memberName = item.memberName || "Tanpa nama";
    const date = new Date(item.transactedAt);
    const dateStr = date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const hasCashback =
      (item.cashbackEarned ?? 0) > 0 || (item.cashbackSpent ?? 0) > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => openDetail(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.memberName}>{memberName}</Text>
          <Text style={styles.amountText}>
            Rp {item.totalAmount.toLocaleString("id-ID")}
          </Text>
        </View>
        <Text style={styles.dateText}>{dateStr}</Text>
        {hasCashback && (
          <Text style={styles.cashbackInfo}>
            Cashback dapat: Rp{" "}
            {(item.cashbackEarned ?? 0).toLocaleString("id-ID")} | dipakai: Rp{" "}
            {(item.cashbackSpent ?? 0).toLocaleString("id-ID")}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    if (!detailVisible || !selectedTx) return null;

    const date = new Date(selectedTx.transactedAt);
    const dateStr = date.toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });

    return (
      <Modal
        visible={detailVisible}
        transparent
        animationType="slide"
        onRequestClose={closeDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Transaksi</Text>
              <TouchableOpacity onPress={closeDetail}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nama Member</Text>
            <Text style={styles.value}>
              {selectedTx.memberName || "Tanpa nama"}
            </Text>

            <Text style={[styles.label, { marginTop: 6 }]}>WhatsApp</Text>
            <Text style={styles.value}>{selectedTx.memberWhatsapp || "-"}</Text>

            <Text style={[styles.label, { marginTop: 10 }]}>Waktu</Text>
            <Text style={styles.value}>{dateStr}</Text>

            <Text style={[styles.label, { marginTop: 10 }]}>Total Belanja</Text>
            <Text style={styles.value}>
              Rp {selectedTx.totalAmount.toLocaleString("id-ID")}
            </Text>

            <Text style={[styles.label, { marginTop: 10 }]}>
              Cashback Didapat
            </Text>
            <Text style={styles.value}>
              Rp {(selectedTx.cashbackEarned ?? 0).toLocaleString("id-ID")}
            </Text>

            <Text style={[styles.label, { marginTop: 10 }]}>
              Cashback Dipakai
            </Text>
            <Text style={styles.value}>
              Rp {(selectedTx.cashbackSpent ?? 0).toLocaleString("id-ID")}
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Riwayat Transaksi</Text>
      <Text style={styles.subtitle}>
        Daftar transaksi terbaru. Tap salah satu item untuk melihat detail.
        Tarik ke bawah untuk refresh.
      </Text>

      <View style={styles.filterRow}>
        <View style={styles.chipGroup}>
          <Text style={styles.filterLabel}>Urutkan:</Text>
          <TouchableOpacity
            style={[styles.chip, sortMode === "time" && styles.chipActive]}
            onPress={() => setSortMode("time")}
          >
            <Text
              style={[
                styles.chipText,
                sortMode === "time" && styles.chipTextActive,
              ]}
            >
              Waktu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, sortMode === "amount" && styles.chipActive]}
            onPress={() => setSortMode("amount")}
          >
            <Text
              style={[
                styles.chipText,
                sortMode === "amount" && styles.chipTextActive,
              ]}
            >
              Nominal
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={sortedTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          sortedTransactions.length === 0
            ? styles.emptyContainer
            : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshTransactions}
            tintColor={ACCENT}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>Belum ada transaksi.</Text>
          ) : (
            <View style={styles.centerArea}>
              <ActivityIndicator color={ACCENT} />
              <Text style={styles.loadingText}>Memuat riwayat...</Text>
            </View>
          )
        }
      />

      {renderDetailModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: ACCENT,
  },
  subtitle: {
    marginTop: 4,
    color: ACCENT,
    opacity: 0.8,
    fontSize: 13,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 8,
  },
  chipGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterLabel: {
    fontSize: 11,
    color: ACCENT,
    opacity: 0.9,
    marginRight: 4,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FAEBC0",
  },
  chipActive: {
    backgroundColor: ACCENT,
  },
  chipText: {
    fontSize: 11,
    color: ACCENT,
  },
  chipTextActive: {
    color: "#F2D593",
    fontWeight: "700",
  },

  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    marginBottom: 6,
  },
  centerArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: ACCENT,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: ACCENT,
    opacity: 0.7,
    fontSize: 14,
  },
  card: {
    backgroundColor: "#FAEBC0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: ACCENT,
  },
  amountText: {
    fontSize: 14,
    fontWeight: "700",
    color: ACCENT,
  },
  dateText: {
    marginTop: 4,
    fontSize: 12,
    color: ACCENT,
    opacity: 0.9,
  },
  cashbackInfo: {
    marginTop: 4,
    fontSize: 11,
    color: ACCENT,
    opacity: 0.9,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#FAEBC0",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: ACCENT,
  },
  closeBtn: {
    fontSize: 20,
    color: ACCENT,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 11,
    color: ACCENT,
    opacity: 0.9,
  },
  value: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: "600",
  },
});
