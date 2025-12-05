// app/(tabs)/create-member.tsx
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiGet, apiPost } from "../../src/api";

const BG = "#F2D593";
const ACCENT = "#283845";

type MemberCreated = {
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
  usableCashback: number;
  pendingCashback: number;
  canUndoLastPayment: boolean;
};

export default function CreateMemberScreen() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [createdMember, setCreatedMember] = useState<MemberCreated | null>(
    null
  );
  const [memberDetail, setMemberDetail] = useState<MemberDetail | null>(null);

  const resetForm = () => {
    setName("");
    setWhatsapp("");
    setError("");
    setCreatedMember(null);
    setMemberDetail(null);
  };

  const handleCreateMember = async () => {
    const trimmedName = name.trim();
    const trimmedWa = whatsapp.trim();

    if (!trimmedName || !trimmedWa) {
      setError("Nama dan nomor WhatsApp wajib diisi.");
      return;
    }

    setError("");
    setCreating(true);

    try {
      const created = await apiPost<MemberCreated>("/members", {
        name: trimmedName,
        whatsapp: trimmedWa,
      });

      setCreatedMember(created);

      // Ambil detail (bisa cek status membership & cashback)
      const detail = await apiGet<MemberDetail>(
        `/members/${created.id}/detail`
      );
      setMemberDetail(detail);

      Alert.alert("Berhasil", "Member baru berhasil dibuat.");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Gagal membuat member.");
    } finally {
      setCreating(false);
    }
  };

  const handleActivateMembership = async () => {
    if (!memberDetail?.id) return;

    try {
      setActionLoading(true);
      await apiPost(`/members/${memberDetail.id}/membership/pay`, {
        amount: 35000,
      });

      const detail = await apiGet<MemberDetail>(
        `/members/${memberDetail.id}/detail`
      );
      setMemberDetail(detail);
      Alert.alert("Berhasil", "Membership berhasil diaktifkan 30 hari.");
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err.message ?? "Gagal mengaktifkan membership member."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!memberDetail) {
      Alert.alert("Info", "Data member belum tersedia.");
      return;
    }

    if (!memberDetail.isActive || !memberDetail.membershipEndAt) {
      Alert.alert(
        "Info",
        "Membership belum aktif. Aktifkan membership terlebih dahulu."
      );
      return;
    }

    const raw = memberDetail.whatsapp || "";
    let phone = raw.replace(/[^0-9]/g, "");

    if (phone.startsWith("0")) {
      phone = "62" + phone.slice(1);
    } else if (!phone.startsWith("62")) {
      phone = "62" + phone;
    }

    const endDate = new Date(
      memberDetail.membershipEndAt + "T00:00:00"
    ).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const text = `Halo ${memberDetail.name},

Membership Burjo Lestari kamu sudah aktif sampai ${endDate}.

Terima kasih 😊`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(
          "Error",
          "WhatsApp tidak tersedia di perangkat ini atau URL tidak bisa dibuka."
        );
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Gagal membuka WhatsApp.");
    }
  };

  const canSendWhatsApp =
    !!memberDetail && memberDetail.isActive && !!memberDetail.membershipEndAt;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Buat Member Baru</Text>
        <Text style={styles.subtitle}>
          Isi data member, simpan, lalu aktifkan membership dan kirim pesan
          WhatsApp konfirmasi.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Data Member</Text>

          <Text style={styles.label}>Nama</Text>
          <TextInput
            style={styles.input}
            placeholder="contoh: Budi Santoso"
            placeholderTextColor="#8b6b2c"
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { marginTop: 10 }]}>Nomor WhatsApp</Text>
          <TextInput
            style={styles.input}
            placeholder="contoh: 081234567890"
            placeholderTextColor="#8b6b2c"
            keyboardType="phone-pad"
            value={whatsapp}
            onChangeText={setWhatsapp}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.primaryButton, creating && styles.buttonDisabled]}
              onPress={handleCreateMember}
              disabled={creating}
            >
              <Text style={styles.primaryButtonText}>
                {creating ? "Menyimpan..." : "Simpan Member"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={resetForm}
            >
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {memberDetail && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ringkasan Member</Text>
            <Text style={styles.label}>Nama</Text>
            <Text style={styles.value}>{memberDetail.name}</Text>

            <Text style={[styles.label, { marginTop: 6 }]}>WhatsApp</Text>
            <Text style={styles.value}>{memberDetail.whatsapp}</Text>

            <Text style={[styles.label, { marginTop: 6 }]}>Status</Text>
            <Text style={styles.value}>
              {memberDetail.isActive ? "Aktif" : "Belum aktif"}
            </Text>

            <Text style={[styles.label, { marginTop: 6 }]}>Masa Aktif</Text>
            <Text style={styles.value}>
              {memberDetail.membershipEndAt
                ? `Sampai ${new Date(
                    memberDetail.membershipEndAt + "T00:00:00"
                  ).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}`
                : "Belum pernah diaktifkan"}
            </Text>

            <View style={styles.buttonColumn}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  actionLoading && styles.buttonDisabled,
                  memberDetail.isActive && styles.buttonOutlined,
                ]}
                onPress={handleActivateMembership}
                disabled={actionLoading}
              >
                <Text
                  style={
                    memberDetail.isActive
                      ? styles.primaryButtonTextOutlined
                      : styles.primaryButtonText
                  }
                >
                  {actionLoading
                    ? "Memproses..."
                    : memberDetail.isActive
                    ? "Perpanjang Membership 30 Hari"
                    : "Aktifkan Membership Rp 35.000"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.waButton,
                  !canSendWhatsApp && styles.buttonDisabled,
                ]}
                onPress={handleSendWhatsApp}
                disabled={!canSendWhatsApp}
              >
                <Text style={styles.waButtonText}>Kirim WhatsApp</Text>
              </TouchableOpacity>

              {!canSendWhatsApp && (
                <Text style={styles.helperText}>
                  Tombol WhatsApp aktif setelah membership aktif dan ada tanggal
                  masa berlaku.
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 40,
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FAEBC0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: ACCENT,
    marginBottom: 8,
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
  errorText: {
    marginTop: 8,
    color: "#b91c1c",
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  primaryButton: {
    flex: 1,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "600",
  },
  buttonColumn: {
    marginTop: 14,
    gap: 8,
  },
  buttonOutlined: {
    backgroundColor: "#FAEBC0",
    borderWidth: 1,
    borderColor: ACCENT,
  },
  primaryButtonTextOutlined: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: "700",
  },
  waButton: {
    backgroundColor: "#25D366",
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  waButtonText: {
    color: "#f9fafb",
    fontSize: 14,
    fontWeight: "700",
  },
  helperText: {
    fontSize: 11,
    color: ACCENT,
    opacity: 0.85,
  },
});
