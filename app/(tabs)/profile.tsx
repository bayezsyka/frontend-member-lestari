// app/(tabs)/profile.tsx
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";

const BG = "#F2D593";
const ACCENT = "#283845";
const CARD_BG = "#FFF7E1";

export default function ProfileScreen() {
  const [showMembershipRules, setShowMembershipRules] = useState(true);
  const [showCashbackRules, setShowCashbackRules] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tentang Aplikasi</Text>
      <Text style={styles.subtitle}>Member Lestari - Burjo Lestari</Text>

      <View style={styles.authorChip}>
        <Text style={styles.authorText}>
          Dibuat oleh:{" "}
          <Text style={styles.authorBold}>
            A Faidhullah Farros Basykailakh (21120123140171)
          </Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Deskripsi Singkat */}
          <Text style={styles.sectionTitle}>Deskripsi Singkat</Text>
          <Text style={styles.paragraph}>
            Aplikasi ini digunakan untuk membantu Burjo Lestari mengelola{" "}
            <Text style={styles.bold}>data member</Text> dan{" "}
            <Text style={styles.bold}>saldo cashback</Text> secara praktis.
          </Text>
          <Text style={styles.paragraph}>Kasir bisa mencatat:</Text>
          <Text style={styles.listItem}>• Pembayaran membership.</Text>
          <Text style={styles.listItem}>• Transaksi harian pelanggan.</Text>
          <Text style={styles.listItem}>
            • Pemakaian saldo cashback sebagai potongan pembayaran.
          </Text>

          {/* Fitur Utama */}
          <Text style={styles.sectionTitle}>Fitur Utama</Text>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>CRUD Member</Text>
            <Text style={styles.tag}>Cashback</Text>
            <Text style={styles.tag}>Transaksi Harian</Text>
          </View>
          <Text style={styles.listItem}>
            • Manajemen data member (tambah, edit, hapus, lihat).
          </Text>
          <Text style={styles.listItem}>
            • Cek status membership (aktif / tidak aktif) dan masa berlaku.
          </Text>
          <Text style={styles.listItem}>
            • Hitung cashback otomatis dari total belanja harian.
          </Text>
          <Text style={styles.listItem}>
            • Gunakan cashback sebagai potongan saat pembayaran.
          </Text>
          <Text style={styles.listItem}>
            • Riwayat transaksi yang dapat dilihat kembali oleh kasir.
          </Text>

          {/* Alur Penggunaan */}
          <Text style={styles.sectionTitle}>Alur Penggunaan Kasir</Text>
          <Text style={styles.listItem}>
            1. Daftarkan pelanggan sebagai member dan catat pembayaran
            membership.
          </Text>
          <Text style={styles.listItem}>
            2. Saat pelanggan berbelanja, input transaksi di aplikasi.
          </Text>
          <Text style={styles.listItem}>
            3. Aplikasi akan menghitung cashback yang didapat (jika memenuhi
            syarat).
          </Text>
          <Text style={styles.listItem}>
            4. Di transaksi berikutnya, kasir bisa menggunakan saldo cashback
            sebagai potongan.
          </Text>

          {/* Aturan Membership (Collapsible) */}
          <TouchableOpacity
            style={styles.sectionHeaderRow}
            onPress={() => setShowMembershipRules((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Aturan Membership</Text>
            <Text style={styles.sectionToggleIcon}>
              {showMembershipRules ? "▼" : "▲"}
            </Text>
          </TouchableOpacity>

          {showMembershipRules && (
            <View style={styles.sectionBody}>
              <Text style={styles.paragraph}>
                • Biaya membership: <Text style={styles.bold}>Rp 35.000</Text>{" "}
                untuk aktif <Text style={styles.bold}>30 hari</Text>.
              </Text>
              <Text style={styles.paragraph}>
                • Status <Text style={styles.bold}>Aktif</Text>: jika masih
                dalam 30 hari dari tanggal pembayaran terakhir.
              </Text>
              <Text style={styles.paragraph}>
                • Status <Text style={styles.bold}>Tidak aktif</Text>: jika
                sudah lewat 30 hari.
              </Text>
              <Text style={styles.paragraph}>
                • Setiap pembayaran membership{" "}
                <Text style={styles.bold}>memperpanjang</Text> masa aktif 30
                hari dari tanggal pembayaran terakhir.
              </Text>

              <View style={styles.exampleBox}>
                <Text style={styles.exampleTitle}>Contoh Membership</Text>
                <Text style={styles.exampleText}>
                  • Bayar membership: 1 Februari 2025 → aktif sampai 3 Maret
                  2025 (30 hari).{"\n"}• Jika bayar lagi pada 20 Februari 2025 →
                  masa aktif dihitung 30 hari dari 20 Februari 2025.
                </Text>
              </View>
            </View>
          )}

          {/* Aturan Cashback (Collapsible) */}
          <TouchableOpacity
            style={styles.sectionHeaderRow}
            onPress={() => setShowCashbackRules((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Aturan Cashback</Text>
            <Text style={styles.sectionToggleIcon}>
              {showCashbackRules ? "▼" : "▲"}
            </Text>
          </TouchableOpacity>

          {showCashbackRules && (
            <View style={styles.sectionBody}>
              <Text style={styles.paragraph}>
                • Cashback hanya untuk member yang{" "}
                <Text style={styles.bold}>statusnya aktif</Text>.
              </Text>
              <Text style={styles.paragraph}>
                • Minimal total belanja per hari{" "}
                <Text style={styles.bold}>Rp 15.000</Text> untuk mendapatkan
                cashback.
              </Text>
              <Text style={styles.paragraph}>
                • Setiap kelipatan Rp 15.000 → cashback{" "}
                <Text style={styles.bold}>Rp 2.500</Text>.
              </Text>
              <Text style={styles.paragraph}>
                • Maksimal cashback per hari:{" "}
                <Text style={styles.bold}>Rp 5.000 per member</Text>.
              </Text>
              <Text style={styles.paragraph}>
                • Cashback tidak bisa diuangkan, hanya sebagai{" "}
                <Text style={styles.bold}>potongan transaksi</Text>.
              </Text>
              <Text style={styles.paragraph}>
                • Cashback yang didapat di bulan berjalan{" "}
                <Text style={styles.bold}>
                  hanya bisa dipakai di bulan berikutnya
                </Text>
                .
              </Text>
              <Text style={styles.paragraph}>
                • Jika sebagian transaksi dibayar dengan cashback,{" "}
                <Text style={styles.bold}>
                  bagian yang dibayar dengan cashback tidak dihitung ulang
                </Text>{" "}
                untuk cashback baru.
              </Text>

              <View style={styles.exampleBox}>
                <Text style={styles.exampleTitle}>
                  Contoh Perhitungan Cashback
                </Text>
                <Text style={styles.exampleText}>
                  • Total belanja hari ini: Rp 40.000{"\n"}→ Kelipatan Rp 15.000
                  = 2x (Rp 30.000){"\n"}→ Cashback: 2 × Rp 2.500 = Rp 5.000
                  (maksimal harian).{"\n\n"}• Bulan depan, cashback Rp 5.000 ini
                  bisa dipakai sebagai potongan di satu transaksi.
                </Text>
              </View>
            </View>
          )}

          {/* Teknologi */}
          <Text style={styles.sectionTitle}>Teknologi yang Digunakan</Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Frontend</Text>: React Native (Expo)
            dengan bottom tab navigation.{"\n"}•{" "}
            <Text style={styles.bold}>Backend</Text>: Node.js + Express +
            Supabase (PostgreSQL).{"\n"}• <Text style={styles.bold}>API</Text>:
            komunikasi data menggunakan REST API (web service) yang dibuat
            sendiri.
          </Text>

          {/* Tujuan & Konteks Praktikum */}
          <Text style={styles.sectionTitle}>Tujuan & Konteks Praktikum</Text>
          <Text style={styles.paragraph}>
            Aplikasi ini dibuat sebagai proyek praktikum untuk mensimulasikan
            sistem membership dan cashback di Burjo Lestari, sekaligus memenuhi
            ketentuan tugas, yaitu:
          </Text>
          <Text style={styles.listItem}>
            • Menggunakan API (REST API sendiri).
          </Text>
          <Text style={styles.listItem}>
            • Menggunakan bottom tab navigation.
          </Text>
          <Text style={styles.listItem}>
            • Memiliki beberapa halaman utama dengan list & detail.
          </Text>

          <View style={styles.footerNote}>
            <Text style={styles.footerText}>
              Halaman ini dirancang agar dosen dan penguji dapat memahami{" "}
              <Text style={styles.bold}>
                alur bisnis, aturan membership, dan logika cashback
              </Text>{" "}
              hanya dari penjelasan di sini.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    opacity: 0.85,
    fontSize: 14,
    marginBottom: 8,
  },
  authorChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(40, 56, 69, 0.1)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  authorText: {
    fontSize: 11,
    color: ACCENT,
  },
  authorBold: {
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: ACCENT,
  },
  paragraph: {
    marginTop: 4,
    fontSize: 13,
    color: ACCENT,
    lineHeight: 18,
  },
  listItem: {
    marginTop: 2,
    fontSize: 13,
    color: ACCENT,
    lineHeight: 18,
  },
  bold: {
    fontWeight: "700",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    marginBottom: 4,
    gap: 6,
  },
  tag: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(40, 56, 69, 0.08)",
    color: ACCENT,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    justifyContent: "space-between",
  },
  sectionToggleIcon: {
    fontSize: 16,
    color: ACCENT,
    marginLeft: 8,
  },
  sectionBody: {
    marginTop: 4,
  },
  exampleBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(40, 56, 69, 0.06)",
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: ACCENT,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 12,
    color: ACCENT,
    lineHeight: 17,
  },
  footerNote: {
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(40, 56, 69, 0.3)",
  },
  footerText: {
    fontSize: 12,
    color: ACCENT,
    lineHeight: 18,
  },
});
