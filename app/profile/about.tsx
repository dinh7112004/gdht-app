import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "../../src/context/LanguageContext";

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('about_app')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Image
              source={require("../../assets/icon1.png")}
              style={styles.logo}
            />
          </View>
          <Text style={styles.appName}>Heritage Math</Text>
          <Text style={styles.version}>{t('version_stable')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('our_mission')}</Text>
          <Text style={styles.cardText}>
            {t('mission_text')}
          </Text>
        </View>

        <View style={styles.menuCard}>
          <AboutLink icon="globe-outline" label={t('website')} onPress={() => Linking.openURL("https://heritagemath.edu.vn")} />
          <AboutLink icon="shield-outline" label={t('privacy_policy')} onPress={() => { }} />
          <AboutLink icon="document-text-outline" label={t('terms_of_service')} onPress={() => { }} />
          <AboutLink icon="logo-facebook" label={t('official_fanpage')} onPress={() => Linking.openURL("https://facebook.com/heritagemath")} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2024 Heritage Math Group</Text>
          <Text style={styles.subFooter}>{t('leading_heritage_math')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutLink({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.linkItem} onPress={onPress}>
      <View style={styles.linkIconBox}><Ionicons name={icon} size={20} color="#64748B" /></View>
      <Text style={styles.linkLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  content: { padding: 24 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 100, height: 100, borderRadius: 28, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, elevation: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logo: { width: 70, height: 70, borderRadius: 16 },
  appName: { fontSize: 28, fontWeight: '900', color: '#1E293B' },
  version: { fontSize: 14, color: '#94A3B8', fontWeight: '700', marginTop: 4 },
  card: { backgroundColor: '#FFFBEB', borderRadius: 32, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: '#FEF9C3' },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 12 },
  cardText: { fontSize: 14, color: '#64748B', lineHeight: 22, fontWeight: '500' },
  menuCard: { backgroundColor: '#FFFBEB', borderRadius: 24, borderWidth: 1, borderColor: '#FEF9C3', overflow: 'hidden' },
  linkItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  linkIconBox: { marginRight: 16 },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: '#334155' },
  footer: { marginTop: 40, alignItems: 'center', paddingBottom: 20 },
  copyright: { fontSize: 13, color: '#94A3B8', fontWeight: '800' },
  subFooter: { fontSize: 11, color: '#CBD5E1', fontWeight: '700', marginTop: 4 }
});
