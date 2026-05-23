import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "../../src/context/LanguageContext";

const LANGUAGES = [
  { id: 'vi', label: 'Tiếng Việt', subLabel: 'Vietnamese', flag: 'https://cdn-icons-png.flaticon.com/512/323/323319.png' },
  { id: 'en', label: 'English', subLabel: 'Tiếng Anh', flag: 'https://cdn-icons-png.flaticon.com/512/323/323329.png' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(language);

  useEffect(() => {
    setSelectedLang(language);
  }, [language]);

  const handleSelect = async (id: string) => {
    setSelectedLang(id);
    try {
      await setLanguage(id);
      setTimeout(() => router.back(), 300);
    } catch (e) {
      console.error("Failed to save language", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('language')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('choose_language')}</Text>
        <FlatList 
          data={LANGUAGES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.langItem, selectedLang === item.id && styles.activeItem]} 
              onPress={() => handleSelect(item.id)}
            >
              <Image source={{ uri: item.flag }} style={styles.flag} />
              <View style={styles.labelContainer}>
                 <Text style={styles.langLabel}>{item.label}</Text>
                 <Text style={styles.langSubLabel}>{item.subLabel}</Text>
              </View>
              {selectedLang === item.id && (
                <View style={styles.checkCircle}>
                   <Ionicons name="checkmark" size={16} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
        
        <View style={styles.infoCard}>
           <Ionicons name="information-circle" size={24} color="#3B82F6" />
           <Text style={styles.infoText}>{t('lang_info')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  content: { flex: 1, padding: 24 },
  sectionTitle: { fontSize: 12, fontWeight: "900", color: "#94A3B8", marginBottom: 20, letterSpacing: 1 },
  langItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, backgroundColor: '#FFFBEB', marginBottom: 16, borderWidth: 2, borderColor: 'transparent' },
  activeItem: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  flag: { width: 40, height: 40, borderRadius: 20, marginRight: 16 },
  labelContainer: { flex: 1 },
  langLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  langSubLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 20, borderRadius: 24, marginTop: 'auto', marginBottom: 20, borderWidth: 1, borderColor: '#FEF9C3' },
  infoText: { flex: 1, marginLeft: 16, color: '#1E40AF', fontSize: 13, fontWeight: '600', lineHeight: 20 }
});
