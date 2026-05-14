import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert, Linking, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "../../src/context/LanguageContext";
import { useSound } from "../../src/context/SoundContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { soundEnabled, setSoundEnabled, playSound } = useSound();
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('logout_confirm_title'),
      t('logout_confirm_msg'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('logout'), 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("userToken");
              await AsyncStorage.removeItem("userData");
              router.replace("/(auth)/login");
            } catch (e) {
              console.error("Logout failed", e);
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('account_section')}</Text>
        <SettingItem icon="person" label={t('account_info')} onPress={() => router.push("/profile/account-info")} />
        <SettingItem icon="shield-checkmark" label={t('security')} onPress={() => router.push("/profile/security")} />
        
        <Text style={styles.sectionTitle}>{t('app_section')}</Text>
        <SettingItem icon="language" label={t('language')} value={language === 'vi' ? 'Tiếng Việt' : 'English'} onPress={() => router.push("/profile/language")} />
        
        <View style={styles.item}>
          <View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}>
            <Ionicons name="volume-high" size={20} color="#10B981" />
          </View>
          <Text style={styles.label}>{t('sound')}</Text>
          <Switch 
            value={soundEnabled} 
            onValueChange={setSoundEnabled}
            trackColor={{ false: "#cbd5e1", true: "#10B981" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text style={styles.sectionTitle}>{t('support_section')}</Text>
        <SettingItem icon="help-circle" label={t('help_center')} onPress={() => setShowHelpModal(true)} />
        <SettingItem icon="information-circle" label={t('about_app')} onPress={() => router.push("/profile/about")} />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>{t('version')} 1.0.5 (Build 20240513)</Text>
      </ScrollView>

      {/* Custom Help Modal */}
      <Modal visible={showHelpModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
              <View style={styles.helpModalContent}>
                  <Text style={styles.modalTitle}>{t('help_center')}</Text>
                  <Text style={styles.modalSubTitle}>{t('help_info')}</Text>
                  
                  <TouchableOpacity 
                    style={styles.modalActionBtn}
                    onPress={() => {
                        Linking.openURL("mailto:support@heritagemath.edu.vn");
                        setShowHelpModal(false);
                    }}
                  >
                      <Ionicons name="mail-outline" size={20} color="#334155" style={{ marginRight: 12 }} />
                      <Text style={styles.modalActionText}>{t('email_support')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalActionBtn}
                    onPress={() => {
                        // Link Zalo or specific chat URL
                        Linking.openURL("https://zalo.me/your_number");
                        setShowHelpModal(false);
                    }}
                  >
                      <Ionicons name="chatbubble-ellipses-outline" size={20} color="#334155" style={{ marginRight: 12 }} />
                      <Text style={styles.modalActionText}>{t('zalo_support')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowHelpModal(false)}>
                      <Text style={styles.modalCancelText}>{t('cancel')}</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingItem({ icon, label, value, onPress }: any) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.iconBox}><Ionicons name={icon} size={20} color="#64748b" /></View>
      <Text style={styles.label}>{label}</Text>
      {value && <Text style={styles.valueText}>{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  list: { padding: 20, paddingBottom: 60 },
  sectionTitle: { fontSize: 12, fontWeight: "900", color: "#94A3B8", marginTop: 24, marginBottom: 8, letterSpacing: 1 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#FEF9C3" },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFBEB", justifyContent: "center", alignItems: "center", marginRight: 16 },
  label: { flex: 1, fontSize: 16, fontWeight: "700", color: "#334155" },
  valueText: { fontSize: 14, fontWeight: "600", color: "#94a3b8", marginRight: 8 },
  logoutBtn: { flexDirection: 'row', backgroundColor: "#FEF2F2", height: 56, borderRadius: 18, justifyContent: "center", alignItems: "center", marginTop: 40 },
  logoutText: { color: "#EF4444", fontSize: 16, fontWeight: "900" },
  versionText: { textAlign: 'center', color: '#CBD5E1', fontSize: 12, marginTop: 20, fontWeight: '600' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  helpModalContent: { backgroundColor: '#FFFDF0', borderRadius: 32, padding: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#FEF9C3' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 12 },
  modalSubTitle: { fontSize: 14, fontWeight: '600', color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', width: '100%', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#FEF9C3' },
  modalActionText: { fontSize: 16, fontWeight: '700', color: '#334155' },
  modalCancelBtn: { width: '100%', padding: 18, alignItems: 'center', marginTop: 8 },
  modalCancelText: { fontSize: 16, fontWeight: '800', color: '#94A3B8' }
});
