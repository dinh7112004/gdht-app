import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import client, { resolveImageUrl } from "../../src/api/client";
import { useTranslation } from "../../src/context/LanguageContext";

export default function AccountInfoScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [phone, setPhone] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Rename modal
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await client.get("/auth/profile");
      setUserData(res.data);
      setPhone(res.data.phone || "");
      setEditName(res.data.fullName || "");
    } catch (e) {
      console.error("Failed to fetch profile", e);
    } finally {
      setLoading(false);
    }
  };

  const isTeacher = userData?.role === 'TEACHER' || userData?.role === 'teacher';
  const renameCount = userData?.renameCount || 0;
  const requiredCards = renameCount + 1;
  const totalCards = (userData?.inventory || []).reduce((sum: number, inv: any) => {
    const isCard = inv.itemId && (
      inv.itemId.code === 'RENAME_CARD' ||
      inv.itemId.category === 'RENAME_CARD' ||
      inv.itemId.name === 'Thẻ đổi tên'
    );
    return isCard ? sum + (inv.quantity || 1) : sum;
  }, 0);
  // Teachers can rename freely, students need rename cards
  const hasEnoughCards = isTeacher || totalCards >= requiredCards;

  const handleRename = async () => {
    if (!editName.trim()) {
      Alert.alert(t('error'), t('error_name_empty'));
      return;
    }
    if (!hasEnoughCards) {
      Alert.alert(t('error'), `${t('not_enough_cards')}. ${t('rename_cost')}: ${requiredCards} ${t('cards')}.`);
      return;
    }
    try {
      setSaving(true);
      let res;
      if (isTeacher) {
        res = await client.put(`/users/${userData._id}`, { fullName: editName.trim() });
      } else {
        res = await client.post("/users/rename", { newName: editName.trim() });
      }
      setUserData(res.data);
      setShowRenameModal(false);
      Alert.alert(t('success'), t('rename_success'));
    } catch (e: any) {
      Alert.alert(t('error'), e.response?.data?.message || t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePhone = async () => {
    setSaving(true);
    try {
      await client.patch("/users/profile", { phone: phone.trim() });
      setUserData((prev: any) => ({ ...prev, phone: phone.trim() }));
      setEditingPhone(false);
      Alert.alert(t('success'), "Đã cập nhật số điện thoại");
    } catch (e: any) {
      Alert.alert(t('error'), e.response?.data?.message || "Không thể cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Cần quyền truy cập", "Vui lòng cho phép truy cập thư viện ảnh");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploadingAvatar(true);
    try {
      // Step 1: upload image to Google Drive via /upload/image
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        name: "avatar.jpg",
        type: "image/jpeg",
      } as any);
      const uploadRes = await client.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const avatarUrl = uploadRes.data.url;

      // Step 2: save URL to profile
      const profileRes = await client.patch("/users/profile", { avatar: avatarUrl });
      setUserData((prev: any) => ({ ...prev, avatar: profileRes.data.avatar || avatarUrl }));
      Alert.alert(t('success'), "Đã cập nhật ảnh đại diện");
    } catch (e: any) {
      Alert.alert(t('error'), e.response?.data?.message || "Không thể cập nhật ảnh");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading && !userData) {
    return <View style={styles.loading}><ActivityIndicator color="#10B981" size="large" /></View>;
  }

  const avatarUrl = resolveImageUrl(userData?.equippedItems?.avatarId?.imageUrl || userData?.avatar);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('account_info')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar} style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
          <Text style={styles.fullName}>{userData?.fullName}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{userData?.role === 'STUDENT' ? t('student') : t('teacher')}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <InfoRow label={t('email_address')} value={userData?.email} icon="mail-outline" />

          {/* Display name - editable with rename card */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="person-outline" size={20} color="#64748B" />
            </View>
            <View style={styles.infoTextColumn}>
              <Text style={styles.infoLabel}>{t('edit_name')}</Text>
              <Text style={styles.infoValue}>{userData?.fullName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditName(userData?.fullName || "");
                setShowRenameModal(true);
              }}
              style={styles.editIconBtn}
            >
              <Ionicons name="pencil-outline" size={18} color="#10B981" />
            </TouchableOpacity>
          </View>

          {/* Phone - editable */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="call-outline" size={20} color="#64748B" />
            </View>
            <View style={styles.infoTextColumn}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              {editingPhone ? (
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="Nhập số điện thoại"
                  autoFocus
                />
              ) : (
                <Text style={styles.infoValue}>{userData?.phone || "Chưa cập nhật"}</Text>
              )}
            </View>
            {editingPhone ? (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => { setEditingPhone(false); setPhone(userData?.phone || ""); }} style={styles.cancelBtn}>
                  <Ionicons name="close" size={18} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSavePhone} disabled={saving} style={styles.saveBtn}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={18} color="#fff" />}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingPhone(true)} style={styles.editIconBtn}>
                <Ionicons name="pencil-outline" size={18} color="#10B981" />
              </TouchableOpacity>
            )}
          </View>

          <InfoRow label={t('current_level')} value={`${t('level_name')} ${userData?.level || 1}`} icon="ribbon-outline" />
          <InfoRow label={t('experience_points')} value={`${userData?.xp || 0} XP`} icon="star-outline" />
          <InfoRow label={t('accumulated_gems')} value={`${userData?.gems || 0} Gems`} icon="diamond-outline" />
          <InfoRow
            label={t('join_date')}
            value={userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : ''}
            icon="calendar-outline"
          />
        </View>
      </ScrollView>

      {/* Rename Modal */}
      <Modal visible={showRenameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('edit_name')}</Text>
            {!isTeacher && (
              <Text style={styles.modalSub}>
                {t('rename_cost')}: {requiredCards} {t('cards')} · {t('you_have')}: {totalCards}
              </Text>
            )}
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('enter_name_placeholder')}
              maxLength={30}
              autoFocus
            />
            {!hasEnoughCards && (
              <View style={styles.noCardWarning}>
                <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                <Text style={styles.noCardText}>
                  {t('not_enough_cards')} ({totalCards}/{requiredCards})
                </Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, !hasEnoughCards && styles.modalSaveBtnDisabled]}
                onPress={handleRename}
                disabled={saving || !hasEnoughCards}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.modalSaveText}>{t('save')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}><Ionicons name={icon} size={20} color="#64748B" /></View>
      <View style={styles.infoTextColumn}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  content: { padding: 24, paddingBottom: 48 },
  profileSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#10B981' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10B981', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFDF0' },
  fullName: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
  roleTag: { backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
  roleText: { color: '#10B981', fontSize: 12, fontWeight: '800' },
  infoCard: { backgroundColor: '#FFFBEB', borderRadius: 24, padding: 8, borderWidth: 1, borderColor: '#FEF9C3' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFDF0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  infoTextColumn: { flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  infoValue: { fontSize: 16, fontWeight: '800', color: '#334155', marginTop: 2 },
  phoneInput: { fontSize: 16, fontWeight: '800', color: '#334155', marginTop: 2, borderBottomWidth: 1.5, borderBottomColor: '#10B981', paddingBottom: 2 },
  editIconBtn: { padding: 8 },
  editActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  saveBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 28, padding: 28, width: '100%', gap: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', textAlign: 'center' },
  modalSub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', fontWeight: '600' },
  modalInput: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '700', color: '#1e293b', backgroundColor: '#F8FAFC' },
  noCardWarning: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FEF3C7' },
  noCardText: { fontSize: 13, color: '#92400E', fontWeight: '600', flex: 1 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, backgroundColor: '#F1F5F9', borderRadius: 16, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  modalSaveBtn: { flex: 1, paddingVertical: 14, backgroundColor: '#10B981', borderRadius: 16, alignItems: 'center' },
  modalSaveBtnDisabled: { backgroundColor: '#CBD5E1' },
  modalSaveText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
