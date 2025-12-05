// app/(tabs)/explore.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { apiGet, apiPost, apiPut, apiDelete } from "../../src/api";
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
  // bisa aja undefined kalau backend belum kirim, jadi nanti kita default ke 0
  usableCashback?: number;
  pendingCashback?: number;
  canUndoLastPayment: boolean;
};

const BG = "#F2D593";
const ACCENT = "#283845";

export default function MemberScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // detail modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMemberDetail, setSelectedMemberDetail] =
    useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // loading untuk aksi membership (konfirmasi & undo)
  const [actionLoading, setActionLoading] = useState(false);

  // state untuk edit data member
  const [editName, setEditName] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [savingMember, setSavingMember] = useState(false);
  const [deletingMember, setDeletingMember] = useState(false);

  // ---- Multi select mode ----
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const isSelected = (id: string) => selectedIds.includes(id);

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedIds([]);
    } else {
      setSelectionMode(true);
      setSelectedIds([]);
    }
  };

  const toggleSelectMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await apiGet<Member[]>("/members");
      setMembers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Gagal memuat data member");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMembers = useCallback(async () => {
    try {
      setRefreshing(true);
      setError("");
      const data = await apiGet<Member[]>("/members");
      setMembers(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Gagal memuat data member");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers])
  );

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const loadMemberDetail = useCallback(async (id: string) => {
    try {
      setDetailLoading(true);
      setDetailError("");
      const data = await apiGet<MemberDetail>(`/members/${id}/detail`);
      setSelectedMemberDetail(data);
      setEditName(data.name);
      setEditWhatsapp(data.whatsapp);
    } catch (err: any) {
      console.error(err);
      setDetailError(err.message ?? "Gagal memuat detail member");
      setSelectedMemberDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openDetailModal = (member: Member) => {
    if (selectionMode) {
      toggleSelectMember(member.id);
      return;
    }
    setSelectedMemberId(member.id);
    setDetailModalVisible(true);
    setDetailError("");
    loadMemberDetail(member.id);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedMemberId(null);
    setSelectedMemberDetail(null);
    setDetailError("");
    setActionLoading(false);
    setSavingMember(false);
    setDeletingMember(false);
    setEditName("");
    setEditWhatsapp("");
  };

  // --- Aksi: Konfirmasi Bayar Membership (single) ---
  const handlePayMembership = async () => {
    if (!selectedMemberId) return;

    try {
      setActionLoading(true);
      await apiPost(`/members/${selectedMemberId}/membership/pay`, {
        amount: 35000,
      });

      await loadMemberDetail(selectedMemberId);
      await refreshMembers();

      Alert.alert("Berhasil", "Membership berhasil diperpanjang 30 hari.");
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err.message ?? "Gagal mengkonfirmasi pembayaran membership."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // --- Aksi: Batalkan pembayaran membership terakhir (single) ---
  const handleUndoLastPayment = async () => {
    if (!selectedMemberId) return;

    try {
      setActionLoading(true);
      await apiPost(
        `/members/${selectedMemberId}/membership/undo-last-payment`,
        {}
      );

      await loadMemberDetail(selectedMemberId);
      await refreshMembers();

      Alert.alert("Berhasil", "Pembayaran membership terakhir dibatalkan.");
    } catch (err: any) {
      console.error(err);

      const msg = err?.message ?? "";
      if (msg.includes("Tidak ada pembayaran membership untuk dibatalkan")) {
        return;
      }

      Alert.alert("Error", msg || "Gagal membatalkan pembayaran membership.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- Aksi: Simpan perubahan data member (nama & WA) ---
  const handleSaveMember = async () => {
    if (!selectedMemberId) return;

    const name = editName.trim();
    const wa = editWhatsapp.trim();

    if (!name || !wa) {
      Alert.alert("Peringatan", "Nama dan nomor WhatsApp harus diisi.");
      return;
    }

    try {
      setSavingMember(true);
      await apiPut(`/members/${selectedMemberId}`, {
        name,
        whatsapp: wa,
      });

      await loadMemberDetail(selectedMemberId);
      await refreshMembers();

      Alert.alert("Berhasil", "Data member berhasil diperbarui.");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message ?? "Gagal menyimpan data member.");
    } finally {
      setSavingMember(false);
    }
  };

  // --- Aksi: Hapus (arsip) member single ---
  const handleDeleteMember = () => {
    if (!selectedMemberId || !selectedMemberDetail) return;

    Alert.alert(
      "Hapus Member",
      `Yakin ingin menghapus member "${selectedMemberDetail.name}"? Data transaksi tetap ada, tapi member tidak muncul di daftar.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingMember(true);
              await apiDelete(`/members/${selectedMemberId}`);
              closeDetailModal();
              await refreshMembers();
              Alert.alert("Berhasil", "Member sudah dihapus (diarsipkan).");
            } catch (err: any) {
              console.error(err);
              Alert.alert("Error", err.message ?? "Gagal menghapus member.");
            } finally {
              setDeletingMember(false);
            }
          },
        },
      ]
    );
  };

  // --- Bulk actions (multi select) ---
  const ensureHasSelection = (): boolean => {
    if (selectedIds.length === 0) {
      Alert.alert("Peringatan", "Belum ada member yang dipilih.");
      return false;
    }
    return true;
  };

  const handleBulkActivate = async () => {
    if (!ensureHasSelection()) return;

    try {
      setBulkLoading(true);
      for (const id of selectedIds) {
        try {
          await apiPost(`/members/${id}/membership/pay`, { amount: 35000 });
        } catch (err: any) {
          console.error("Bulk pay error for member", id, err);
        }
      }
      await refreshMembers();
      Alert.alert(
        "Berhasil",
        `Membership ${selectedIds.length} member diperpanjang 30 hari.`
      );
      clearSelection();
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err.message ?? "Gagal memproses bulk aktifkan membership."
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (!ensureHasSelection()) return;

    try {
      setBulkLoading(true);
      for (const id of selectedIds) {
        try {
          await apiPost(`/members/${id}/membership/undo-last-payment`, {});
        } catch (err: any) {
          const msg = err?.message ?? "";
          if (
            msg.includes("Tidak ada pembayaran membership untuk dibatalkan")
          ) {
            // kasus wajar -> diam aja, jangan spam log/error
            continue;
          }
          console.error("Bulk undo error for member", id, err);
        }
      }
      await refreshMembers();
      Alert.alert(
        "Berhasil",
        `Membership terakhir untuk member terpilih sudah dicoba dinonaktifkan (undo).`
      );
      clearSelection();
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err.message ?? "Gagal memproses bulk nonaktifkan membership."
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = () => {
    if (!ensureHasSelection()) return;

    Alert.alert(
      "Hapus Member",
      `Yakin ingin menghapus ${selectedIds.length} member? Data transaksi tetap ada, tapi member tidak muncul di daftar.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              setBulkLoading(true);
              for (const id of selectedIds) {
                try {
                  await apiDelete(`/members/${id}`);
                } catch (err: any) {
                  console.error("Bulk delete error for member", id, err);
                }
              }
              await refreshMembers();
              Alert.alert(
                "Berhasil",
                `${selectedIds.length} member sudah dihapus (diarsipkan).`
              );
              clearSelection();
            } catch (err: any) {
              console.error(err);
              Alert.alert(
                "Error",
                err.message ?? "Gagal memproses bulk hapus member."
              );
            } finally {
              setBulkLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = ({ item }: { item: Member }) => {
    const statusText = item.isActive ? "Aktif" : "Tidak aktif";
    const statusColor = item.isActive ? "#16a34a" : "#f97316";
    const selected = selectionMode && isSelected(item.id);

    let dateText = "Belum aktif";
    if (item.membershipEndAt) {
      dateText = `Aktif sampai ${item.membershipEndAt}`;
      if (!item.isActive) {
        dateText = `Kadaluarsa: ${item.membershipEndAt}`;
      }
    }

    return (
      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        activeOpacity={0.8}
        onPress={() => {
          if (selectionMode) {
            toggleSelectMember(item.id);
          } else {
            openDetailModal(item);
          }
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.memberName}>{item.name}</Text>
          <View style={styles.cardHeaderRight}>
            {selectionMode && (
              <View
                style={[styles.checkbox, selected && styles.checkboxSelected]}
              >
                {selected && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
            )}
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusBadgeText}>{statusText}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.memberWhatsapp}>{item.whatsapp}</Text>
        <Text style={styles.membershipInfo}>{dateText}</Text>
      </TouchableOpacity>
    );
  };

  const renderDetailModalContent = () => {
    if (!detailModalVisible) return null;

    if (detailLoading && !selectedMemberDetail && !detailError) {
      return (
        <View style={styles.modalCard}>
          <ActivityIndicator color={ACCENT} />
          <Text style={styles.loadingText}>Memuat detail member...</Text>
        </View>
      );
    }

    if (detailError) {
      return (
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detail Member</Text>
            <TouchableOpacity onPress={closeDetailModal}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.errorText}>{detailError}</Text>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() => {
              if (selectedMemberId) loadMemberDetail(selectedMemberId);
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
            <Text style={styles.modalTitle}>Detail Member</Text>
            <TouchableOpacity onPress={closeDetailModal}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.errorText}>Data member tidak ditemukan.</Text>
        </View>
      );
    }

    const {
      name,
      whatsapp,
      isActive,
      membershipEndAt,
      usableCashback,
      pendingCashback,
      canUndoLastPayment,
    } = selectedMemberDetail;

    // default aman: kalau API nggak kirim, anggap 0
    const usableCb = usableCashback ?? 0;
    const pendingCb = pendingCashback ?? 0;

    const statusText = isActive ? "Aktif" : "Tidak aktif";
    const statusColor = isActive ? "#16a34a" : "#f97316";

    let membershipInfo = "Belum pernah aktif";
    if (membershipEndAt) {
      membershipInfo = isActive
        ? `Aktif sampai ${membershipEndAt}`
        : `Kadaluarsa: ${membershipEndAt}`;
    }

    const disableUndoButton = !canUndoLastPayment || actionLoading;

    const disableSaveButton = savingMember || deletingMember;
    const disableDeleteButton = deletingMember || savingMember;

    return (
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Detail Member</Text>
          <TouchableOpacity onPress={closeDetailModal}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Nama</Text>
        <Text style={styles.value}>{name}</Text>

        <Text style={[styles.label, { marginTop: 6 }]}>WhatsApp</Text>
        <Text style={styles.value}>{whatsapp}</Text>

        <View style={styles.detailStatusRow}>
          <View>
            <Text style={[styles.label, { marginBottom: 2 }]}>Status</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
            >
              <Text style={styles.statusBadgeText}>{statusText}</Text>
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.label}>Masa aktif</Text>
            <Text style={styles.value}>{membershipInfo}</Text>
          </View>
        </View>

        {/* Dua baris info saldo cashback: bulan ini & bulan depan */}
        <Text style={[styles.label, { marginTop: 10 }]}>
          Saldo cashback bisa dipakai bulan ini
        </Text>
        <Text style={styles.cashbackValue}>
          Rp {usableCb.toLocaleString("id-ID")}
        </Text>
        <Text style={styles.pendingCashbackText}>
          Saldo cashback bulan depan: Rp {pendingCb.toLocaleString("id-ID")}
        </Text>

        {/* tombol aksi membership */}
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

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              disableUndoButton && styles.buttonDisabled,
            ]}
            onPress={handleUndoLastPayment}
            disabled={disableUndoButton}
          >
            <Text style={styles.secondaryButtonText}>
              Batalkan Pembayaran Terakhir
            </Text>
          </TouchableOpacity>
        </View>

        {/* Box edit data member */}
        <View style={styles.editBox}>
          <Text style={styles.editTitle}>Ubah Data Member</Text>

          <Text style={styles.label}>Nama</Text>
          <TextInput
            value={editName}
            onChangeText={setEditName}
            style={styles.input}
            placeholder="Nama member"
            placeholderTextColor="#8b6b2c"
          />

          <Text style={[styles.label, { marginTop: 8 }]}>WhatsApp</Text>
          <TextInput
            value={editWhatsapp}
            onChangeText={setEditWhatsapp}
            style={styles.input}
            placeholder="cth: 0877xxxx atau 62877xxxx"
            placeholderTextColor="#8b6b2c"
            keyboardType="phone-pad"
          />

          <View style={styles.editActionsRow}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                disableSaveButton && styles.buttonDisabled,
              ]}
              onPress={handleSaveMember}
              disabled={disableSaveButton}
            >
              <Text style={styles.saveButtonText}>
                {savingMember ? "Menyimpan..." : "Simpan Perubahan"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                disableDeleteButton && styles.buttonDisabled,
              ]}
              onPress={handleDeleteMember}
              disabled={disableDeleteButton}
            >
              <Text style={styles.deleteButtonText}>
                {deletingMember ? "Menghapus..." : "Hapus Member"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Member</Text>
          <Text style={styles.subtitle}>
            Daftar member Burjo Lestari. Tap untuk lihat detail & kelola
            membership. Gunakan tombol &quot;Pilih&quot; untuk aksi banyak
            sekaligus.
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.selectButton,
            selectionMode && styles.selectButtonActive,
          ]}
          onPress={toggleSelectionMode}
        >
          <Text
            style={[
              styles.selectButtonText,
              selectionMode && styles.selectButtonTextActive,
            ]}
          >
            {selectionMode ? "Batal" : "Pilih"}
          </Text>
        </TouchableOpacity>
      </View>

      {selectionMode && (
        <Text style={styles.selectionInfo}>
          Dipilih: {selectedIds.length} member
        </Text>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderMemberItem}
        contentContainerStyle={
          members.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshMembers}
            tintColor={ACCENT}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>Belum ada member.</Text>
          ) : (
            <View style={styles.centerArea}>
              <ActivityIndicator color={ACCENT} />
              <Text style={styles.loadingText}>Memuat data member...</Text>
            </View>
          )
        }
      />

      {selectionMode && (
        <View style={styles.bulkBar}>
          <TouchableOpacity
            style={[
              styles.bulkButton,
              styles.bulkButtonPrimary,
              bulkLoading && styles.buttonDisabled,
            ]}
            onPress={handleBulkActivate}
            disabled={bulkLoading}
          >
            <Text style={styles.bulkButtonPrimaryText}>
              {bulkLoading ? "Memproses..." : "Aktifkan"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bulkButton,
              styles.bulkButtonSecondary,
              bulkLoading && styles.buttonDisabled,
            ]}
            onPress={handleBulkDeactivate}
            disabled={bulkLoading}
          >
            <Text style={styles.bulkButtonSecondaryText}>Nonaktifkan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bulkButton,
              styles.bulkButtonDanger,
              bulkLoading && styles.buttonDisabled,
            ]}
            onPress={handleBulkDelete}
            disabled={bulkLoading}
          >
            <Text style={styles.bulkButtonDangerText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal detail member + CRUD, keyboard-aware */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeDetailModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.modalScrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {renderDetailModalContent()}
          </ScrollView>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
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
    marginBottom: 4,
    maxWidth: "85%",
  },
  selectButton: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
    marginLeft: 8,
    backgroundColor: "#FAEBC0",
  },
  selectButtonActive: {
    backgroundColor: ACCENT,
  },
  selectButtonText: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: "600",
  },
  selectButtonTextActive: {
    color: BG,
  },
  selectionInfo: {
    fontSize: 12,
    color: ACCENT,
    opacity: 0.9,
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
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    marginBottom: 6,
  },
  listContent: {
    paddingBottom: 120,
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
  cardSelected: {
    borderColor: "#1d4ed8",
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: ACCENT,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#f9fafb",
  },
  memberWhatsapp: {
    marginTop: 4,
    color: ACCENT,
    opacity: 0.85,
    fontSize: 13,
  },
  membershipInfo: {
    marginTop: 4,
    color: ACCENT,
    fontSize: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAEBC0",
  },
  checkboxSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  checkboxTick: {
    color: BG,
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    alignItems: "center",
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
  detailStatusRow: {
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
  actionsRow: {
    marginTop: 18,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: ACCENT,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonText: {
    color: BG,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ACCENT,
  },
  secondaryButtonText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  editBox: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: ACCENT,
    paddingTop: 12,
  },
  editTitle: {
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
  editActionsRow: {
    marginTop: 12,
    flexDirection: "column",
    gap: 8,
  },
  saveButton: {
    backgroundColor: ACCENT,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  saveButtonText: {
    color: BG,
    fontSize: 14,
    fontWeight: "700",
  },
  deleteButton: {
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#b91c1c",
  },
  deleteButtonText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
  },
  bulkBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    borderRadius: 16,
    backgroundColor: "#FAEBC0",
    borderWidth: 1,
    borderColor: ACCENT,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  bulkButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bulkButtonPrimary: {
    backgroundColor: ACCENT,
  },
  bulkButtonPrimaryText: {
    color: BG,
    fontSize: 13,
    fontWeight: "700",
  },
  bulkButtonSecondary: {
    borderWidth: 1,
    borderColor: ACCENT,
    backgroundColor: "#FAEBC0",
  },
  bulkButtonSecondaryText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "600",
  },
  bulkButtonDanger: {
    borderWidth: 1,
    borderColor: "#b91c1c",
    backgroundColor: "#FAEBC0",
  },
  bulkButtonDangerText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "600",
  },
});
