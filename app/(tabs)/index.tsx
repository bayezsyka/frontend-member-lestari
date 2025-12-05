// app/(tabs)/index.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { apiGet, apiPost } from "../../src/api";
import { useFocusEffect } from "expo-router";

type Member = {
  id: string;
  name: string;
  whatsapp: string;
  membershipEndAt: string | null;
  isActive: boolean;
};

type MemberDetail = {
  id: string;
  name: string;
  whatsapp: string;
  membershipEndAt: string | null;
  isActive: boolean;
  usableCashback?: number; // bisa undefined -> kita default ke 0
  pendingCashback?: number; // bisa undefined -> kita default ke 0
};

type PaymentType = "cash" | "cashback";

const BG = "#F2D593";
const ACCENT = "#283845";

export default function PaymentScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [refreshingMembers, setRefreshingMembers] = useState(false);
  const [membersError, setMembersError] = useState("");

  const [search, setSearch] = useState("");

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedMemberDetail, setSelectedMemberDetail] =
    useState<MemberDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  // state form transaksi
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [cashbackToUse, setCashbackToUse] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");
  const [txInfo, setTxInfo] = useState("");

  // ---- Load members ----
  const loadMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      setMembersError("");
      const data = await apiGet<Member[]>("/members");
      setMembers(data);
    } catch (err: any) {
      console.error(err);
      setMembersError(err.message ?? "Gagal memuat data member");
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const refreshMembers = useCallback(async () => {
    try {
      setRefreshingMembers(true);
      setMembersError("");
      const data = await apiGet<Member[]>("/members");
      setMembers(data);
    } catch (err: any) {
      console.error(err);
      setMembersError(err.message ?? "Gagal memuat data member");
    } finally {
      setRefreshingMembers(false);
    }
  }, []);

  // Auto refresh saat tab ini jadi fokus
  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers])
  );

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Filter member berdasarkan search
  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;

    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const name = m.name.toLowerCase();
      const wa = m.whatsapp.toLowerCase();
      return name.includes(q) || wa.includes(q);
    });
  }, [members, search]);

  // ---- Detail member untuk modal pembayaran ----
  const loadMemberDetail = useCallback(async (id: string) => {
    try {
      setLoadingDetail(true);
      setDetailError("");
      const data = await apiGet<MemberDetail>(`/members/${id}/detail`);
      setSelectedMemberDetail(data);
    } catch (err: any) {
      console.error(err);
      setDetailError(err.message ?? "Gagal memuat detail member");
      setSelectedMemberDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const openPaymentModalForMember = (member: Member) => {
    setTxError("");
    setTxInfo("");
    setTotalAmount("");
    setCashbackToUse("");
    setPaymentType("cash");
    setPaymentModalVisible(true);
    loadMemberDetail(member.id);
  };

  const closePaymentModal = () => {
    setPaymentModalVisible(false);
    setSelectedMemberDetail(null);
    setDetailError("");
    setTxError("");
    setTxInfo("");
    setTotalAmount("");
    setCashbackToUse("");
    setPaymentType("cash");
  };

  const renderMemberItem = ({ item }: { item: Member }) => {
    return (
      <TouchableOpacity
        style={styles.memberItem}
        onPress={() => openPaymentModalForMember(item)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberWhatsapp}>{item.whatsapp}</Text>
        </View>
        <View
          style={[
            styles.memberStatusBadge,
            { backgroundColor: item.isActive ? "#16a34a" : "#f97316" },
          ]}
        >
          <Text style={styles.memberStatusText}>
            {item.isActive ? "Aktif" : "Tidak aktif"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ---- Submit transaksi ----
  const handleSubmitTransaction = async () => {
    if (!selectedMemberDetail) {
      Alert.alert("Peringatan", "Data member belum siap.");
      return;
    }

    setTxError("");
    setTxInfo("");

    const total = parseInt(totalAmount.replace(/\D/g, ""), 10);
    if (!total || total <= 0) {
      setTxError("Total belanja harus diisi dan lebih besar dari 0.");
      return;
    }

    let cashbackUse = 0;

    if (paymentType === "cashback") {
      const cb = parseInt(cashbackToUse.replace(/\D/g, ""), 10);

      if (!cb || cb <= 0) {
        setTxError("Jumlah cashback yang dipakai harus lebih dari 0.");
        return;
      }

      if (cb > total) {
        setTxError("Cashback yang dipakai tidak boleh melebihi total belanja.");
        return;
      }

      const usableBalance = selectedMemberDetail.usableCashback ?? 0;
      if (cb > usableBalance) {
        setTxError(
          "Cashback yang dipakai melebihi saldo cashback yang bisa digunakan."
        );
        return;
      }

      cashbackUse = cb;
    }

    const body = {
      memberId: selectedMemberDetail.id,
      totalAmount: total,
      paymentType,
      cashbackToUse: cashbackUse,
    };

    try {
      setTxLoading(true);
      const result = await apiPost<{
        cashbackEarned: number;
        cashbackSpent: number;
        membershipActive: boolean;
      }>("/transactions", body);

      // refresh detail member (saldo cashback & status)
      await loadMemberDetail(selectedMemberDetail.id);

      // reset form tapi tetap buka modal
      setTotalAmount("");
      setCashbackToUse("");
      setPaymentType("cash");

      const infoMsg = `Transaksi tersimpan.\nCashback didapat: Rp ${result.cashbackEarned.toLocaleString(
        "id-ID"
      )}\nCashback dipakai: Rp ${result.cashbackSpent.toLocaleString("id-ID")}`;
      setTxInfo(infoMsg);
      Alert.alert("Berhasil", infoMsg);
    } catch (err: any) {
      console.error(err);
      setTxError(err.message ?? "Gagal menyimpan transaksi.");
    } finally {
      setTxLoading(false);
    }
  };

  // ---- isi modal pembayaran ----
  const renderPaymentModalContent = () => {
    if (loadingDetail && !selectedMemberDetail && !detailError) {
      return (
        <View style={styles.modalCard}>
          <ActivityIndicator color={ACCENT} />
          <Text style={styles.loadingText}>Memuat data member...</Text>
        </View>
      );
    }

    if (detailError) {
      return (
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pembayaran</Text>
            <TouchableOpacity onPress={closePaymentModal}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.errorText}>{detailError}</Text>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => {
              if (selectedMemberDetail?.id) {
                loadMemberDetail(selectedMemberDetail.id);
              }
            }}
          >
            <Text style={styles.smallButtonText}>Coba lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!selectedMemberDetail) {
      return (
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pembayaran</Text>
            <TouchableOpacity onPress={closePaymentModal}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.errorText}>Data member tidak ditemukan.</Text>
        </View>
      );
    }

    const { name, whatsapp, isActive, membershipEndAt } = selectedMemberDetail;

    // DEFAULT aman: kalau undefined → 0
    const usableCashback = selectedMemberDetail.usableCashback ?? 0;
    const pendingCashback = selectedMemberDetail.pendingCashback ?? 0;

    const statusColor = isActive ? "#16a34a" : "#f97316";
    const statusText = isActive ? "Aktif" : "Tidak aktif";

    let membershipInfo = "Belum pernah aktif";
    if (membershipEndAt) {
      membershipInfo = isActive
        ? `Aktif sampai ${membershipEndAt}`
        : `Kadaluarsa: ${membershipEndAt}`;
    }

    const disableCashback =
      !isActive || usableCashback <= 0 || paymentType === "cash";

    return (
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Pembayaran</Text>
          <TouchableOpacity onPress={closePaymentModal}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* info member */}
        <Text style={styles.label}>Nama</Text>
        <Text style={styles.value}>{name}</Text>

        <Text style={[styles.label, { marginTop: 6 }]}>WhatsApp</Text>
        <Text style={styles.value}>{whatsapp}</Text>

        <View style={styles.selectedStatusRow}>
          <View>
            <Text style={[styles.label, { marginBottom: 2 }]}>Status</Text>
            <View
              style={[
                styles.memberStatusBadge,
                { backgroundColor: statusColor },
              ]}
            >
              <Text style={styles.memberStatusText}>{statusText}</Text>
            </View>
          </View>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.label}>Masa aktif</Text>
            <Text style={styles.value}>{membershipInfo}</Text>
          </View>
        </View>

        {/* INFO CASHBACK: SELALU 2 BARIS, AMAN MESKI BACKEND BELUM KIRIM */}
        <Text style={[styles.label, { marginTop: 10 }]}>
          Saldo cashback bisa dipakai bulan ini
        </Text>
        <Text style={styles.cashbackValue}>
          Rp {usableCashback.toLocaleString("id-ID")}
        </Text>
        <Text style={styles.pendingCashbackText}>
          Saldo cashback bulan depan: Rp{" "}
          {pendingCashback.toLocaleString("id-ID")}
        </Text>

        {/* form transaksi */}
        <View style={styles.formBox}>
          <Text style={styles.formTitle}>Transaksi</Text>

          <Text style={styles.label}>Total belanja (Rp)</Text>
          <TextInput
            value={totalAmount}
            onChangeText={setTotalAmount}
            keyboardType="number-pad"
            placeholder="contoh: 30000"
            placeholderTextColor="#8b6b2c"
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 10 }]}>
            Metode pembayaran
          </Text>
          <View style={styles.paymentTypeRow}>
            <TouchableOpacity
              style={[
                styles.paymentTypeButton,
                paymentType === "cash" && styles.paymentTypeButtonActive,
              ]}
              onPress={() => setPaymentType("cash")}
            >
              <Text
                style={[
                  styles.paymentTypeText,
                  paymentType === "cash" && styles.paymentTypeTextActive,
                ]}
              >
                Bayar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentTypeButton,
                paymentType === "cashback" && styles.paymentTypeButtonActive,
                (!isActive || usableCashback <= 0) &&
                  styles.paymentTypeButtonDisabled,
              ]}
              onPress={() => {
                if (!isActive) {
                  Alert.alert(
                    "Tidak bisa",
                    "Member harus aktif untuk memakai cashback."
                  );
                  return;
                }
                if (usableCashback <= 0) {
                  Alert.alert(
                    "Tidak bisa",
                    "Saldo cashback yang bisa dipakai masih 0."
                  );
                  return;
                }
                setPaymentType("cashback");
              }}
            >
              <Text
                style={[
                  styles.paymentTypeText,
                  paymentType === "cashback" && styles.paymentTypeTextActive,
                ]}
              >
                Cashback
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.paymentHint}>
            • Bayar: seluruh total dihitung sebagai pembayaran normal dan bisa
            menghasilkan cashback baru.
          </Text>
          <Text style={styles.paymentHint}>
            • Cashback: hanya bagian yang dibayar uang biasa yang bisa
            menghasilkan cashback baru.
          </Text>

          {paymentType === "cashback" && (
            <>
              <Text style={[styles.label, { marginTop: 10 }]}>
                Pakai cashback (Rp)
              </Text>
              <TextInput
                value={cashbackToUse}
                onChangeText={setCashbackToUse}
                keyboardType="number-pad"
                placeholder="contoh: 5000"
                placeholderTextColor="#8b6b2c"
                style={[
                  styles.input,
                  (!isActive || usableCashback <= 0) && { opacity: 0.5 },
                ]}
                editable={!disableCashback}
              />
              <Text style={styles.helperText}>
                Maksimal: Rp {usableCashback.toLocaleString("id-ID")} dan tidak
                boleh melebihi total belanja.
              </Text>
            </>
          )}

          {txError ? <Text style={styles.txErrorText}>{txError}</Text> : null}
          {txInfo ? <Text style={styles.txInfoText}>{txInfo}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, txLoading && styles.buttonDisabled]}
            onPress={handleSubmitTransaction}
            disabled={txLoading}
          >
            <Text style={styles.submitButtonText}>
              {txLoading ? "Menyimpan..." : "Simpan Transaksi"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header + tombol reload */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Pembayaran</Text>
          <Text style={styles.subtitle}>
            Cari member, lalu buka popup untuk input transaksi.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.reloadButton}
          onPress={loadMembers}
          disabled={loadingMembers}
        >
          <Text style={styles.reloadButtonText}>
            {loadingMembers ? "..." : "↻"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Cari nama / nomor WA / 4 digit terakhir..."
          placeholderTextColor="#8b6b2c"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* List member + pull to refresh */}
      <View style={styles.memberListContainer}>
        {membersError ? (
          <Text style={styles.errorText}>{membersError}</Text>
        ) : null}
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          renderItem={renderMemberItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshingMembers}
              onRefresh={refreshMembers}
              tintColor={ACCENT}
            />
          }
          ListEmptyComponent={
            !loadingMembers ? (
              <Text style={styles.placeholderText}>
                Tidak ada member yang cocok dengan pencarian.
              </Text>
            ) : (
              <View style={styles.centerArea}>
                <ActivityIndicator color={ACCENT} />
                <Text style={styles.loadingText}>Memuat data member...</Text>
              </View>
            )
          }
        />
      </View>

      {/* Modal pembayaran (keyboard-aware) */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePaymentModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {renderPaymentModalContent()}
        </KeyboardAvoidingView>
      </Modal>
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
  header: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
    maxWidth: "85%",
  },
  reloadButton: {
    backgroundColor: ACCENT,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  reloadButtonText: {
    color: BG,
    fontSize: 18,
    fontWeight: "700",
  },
  searchBox: {
    marginTop: 12,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: "#FAEBC0",
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: ACCENT,
    fontSize: 14,
  },
  memberListContainer: {
    flex: 1,
    marginTop: 8,
    marginBottom: 8,
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
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    marginBottom: 6,
  },
  placeholderText: {
    color: ACCENT,
    opacity: 0.7,
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAEBC0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: ACCENT,
  },
  memberWhatsapp: {
    fontSize: 12,
    color: ACCENT,
    opacity: 0.8,
  },
  memberStatusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  memberStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#f9fafb",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    maxHeight: "90%",
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
    opacity: 0.85,
  },
  value: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: "600",
  },
  selectedStatusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
  },
  cashbackValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: ACCENT,
  },
  pendingCashbackText: {
    marginTop: 2,
    fontSize: 11,
    color: ACCENT,
    opacity: 0.9,
  },
  formBox: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: ACCENT,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: ACCENT,
    marginBottom: 8,
  },
  input: {
    marginTop: 4,
    backgroundColor: "#FAEBC0",
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: ACCENT,
    fontSize: 14,
  },
  paymentTypeRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  paymentTypeButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT,
    paddingVertical: 6,
    alignItems: "center",
    marginRight: 6,
    backgroundColor: "#FAEBC0",
  },
  paymentTypeButtonActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  paymentTypeButtonDisabled: {
    opacity: 0.5,
  },
  paymentTypeText: {
    fontSize: 13,
    color: ACCENT,
  },
  paymentTypeTextActive: {
    fontWeight: "700",
    color: "#F2D593",
  },
  paymentHint: {
    marginTop: 4,
    color: ACCENT,
    opacity: 0.8,
    fontSize: 11,
  },
  helperText: {
    marginTop: 2,
    color: ACCENT,
    opacity: 0.8,
    fontSize: 11,
  },
  txErrorText: {
    marginTop: 8,
    color: "#b91c1c",
    fontSize: 12,
  },
  txInfoText: {
    marginTop: 8,
    color: "#15803d",
    fontSize: 12,
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: ACCENT,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  submitButtonText: {
    color: BG,
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  smallButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: ACCENT,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallButtonText: {
    color: BG,
    fontSize: 12,
    fontWeight: "600",
  },
});
