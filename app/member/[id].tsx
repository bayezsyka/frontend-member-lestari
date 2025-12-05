// app/member/[id].tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiGet, apiPost } from "../../src/api";

type MemberDetail = {
  id: string;
  name: string;
  whatsapp: string;
  membershipEndAt: string | null;
  isActive: boolean;
  usableCashback: number;
};

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const loadDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const data = await apiGet<MemberDetail>(`/members/${id}/detail`);
      setMember(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Gagal memuat detail member");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handlePayMembership = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      setError("");

      await apiPost(`/members/${id}/membership/pay`, {
        amount: 35000,
      });

      await loadDetail();
      Alert.alert("Berhasil", "Membership berhasil diperpanjang.");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message ?? "Gagal memperpanjang membership");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUndoLastPayment = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      setError("");

      await apiPost(`/members/${id}/membership/undo-last-payment`, {});

      await loadDetail();
      Alert.alert("Berhasil", "Pembayaran membership terakhir dibatalkan.");
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err.message ?? "Gagal membatalkan pembayaran membership"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerArea}>
          <ActivityIndicator color="#F2D593" />
          <Text style={styles.loadingText}>Memuat detail member...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerArea}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={loadDetail}>
            <Text style={styles.primaryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!member) {
      return (
        <View style={styles.centerArea}>
          <Text style={styles.errorText}>Data member tidak ditemukan.</Text>
        </View>
      );
    }

    const statusText = member.isActive ? "Aktif" : "Tidak aktif";
    const statusColor = member.isActive ? "#4ade80" : "#f97316";

    let membershipInfo = "Belum pernah aktif";
    if (member.membershipEndAt) {
      membershipInfo = member.isActive
        ? `Aktif sampai ${member.membershipEndAt}`
        : `Kadaluarsa: ${member.membershipEndAt}`;
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info dasar */}
        <View style={styles.card}>
          <Text style={styles.label}>Nama</Text>
          <Text style={styles.value}>{member.name}</Text>

          <Text style={[styles.label, { marginTop: 12 }]}>WhatsApp</Text>
          <Text style={styles.value}>{member.whatsapp}</Text>
        </View>

        {/* Status membership */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Membership</Text>

          <View style={styles.statusRow}>
            <Text style={styles.label}>Status</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusBadgeText}>{statusText}</Text>
            </View>
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>Masa aktif</Text>
          <Text style={styles.value}>{membershipInfo}</Text>
        </View>

        {/* Saldo cashback */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cashback</Text>
          <Text style={[styles.label, { marginTop: 8 }]}>
            Saldo cashback yang bisa dipakai sekarang
          </Text>
          <Text style={styles.cashbackValue}>
            Rp {member.usableCashback.toLocaleString("id-ID")}
          </Text>
        </View>

        {/* Tombol aksi */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              actionLoading && styles.buttonDisabled,
            ]}
            onPress={handlePayMembership}
            disabled={actionLoading}
          >
            <Text style={styles.primaryButtonText}>
              {actionLoading ? "Memproses..." : "Konfirmasi Bayar Membership"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            actionLoading && styles.buttonDisabled,
          ]}
          onPress={handleUndoLastPayment}
          disabled={actionLoading}
        >
          <Text style={styles.secondaryButtonText}>
            Batalkan Pembayaran Terakhir
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header dengan tombol back + close */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>{"< Kembali"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Detail Member</Text>
      </View>

      {renderContent()}
    </View>
  );
}

const BG = "#283845";
const ACCENT = "#F2D593";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    backgroundColor: BG,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    color: ACCENT,
    fontSize: 13,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: "700",
  },
  headerTitle: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "bold",
    color: "#F9FAFB",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    color: "#E5E7EB",
    fontSize: 14,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  card: {
    backgroundColor: BG,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  label: {
    fontSize: 12,
    color: "#cbd5f5",
  },
  value: {
    fontSize: 14,
    color: "#F9FAFB",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: ACCENT,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0B1120",
  },
  cashbackValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: ACCENT,
  },
  actionsRow: {
    marginTop: 16,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: ACCENT,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonText: {
    color: BG,
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ACCENT,
  },
  secondaryButtonText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
