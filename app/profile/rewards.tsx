import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client, { resolveImageUrl } from "../../src/api/client";

export default function RewardsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWithCache = async () => {
      try {
        const cached = await AsyncStorage.getItem("profile_rewards_cache");
        if (cached) {
          const data = JSON.parse(cached);
          setItems(data.items || []);
          setUserData(data.userData);
          setLoading(false);
        }
      } catch (_) {}
      fetchData();
    };
    void loadWithCache();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, profileRes] = await Promise.all([
        client.get("/items"),
        client.get("/auth/profile")
      ]);
      setItems(itemsRes.data);
      setUserData(profileRes.data);
      await AsyncStorage.setItem("profile_rewards_cache", JSON.stringify({
        items: itemsRes.data,
        userData: profileRes.data,
      }));
    } catch (e) {
      console.error("Failed to fetch shop data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (item: any) => {
    const currencyLabel = item.currency === 'GEMS' ? 'Gems' : 'XP';
    Alert.alert(
      "Xác nhận mua",
      `Bạn có muốn dùng ${item.price} ${currencyLabel} để mua ${item.name}?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Mua ngay", 
          onPress: async () => {
            try {
              const res = await client.post(`/items/buy/${item._id}`);
              setUserData(res.data);
              Alert.alert("Thành công", `Bạn đã sở hữu ${item.name}! Hãy kiểm tra trong Kho vật phẩm.`);
            } catch (e: any) {
              Alert.alert("Lỗi", e.response?.data?.message || "Không thể thực hiện giao dịch");
            }
          }
        }
      ]
    );
  };

  if (loading && !userData) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#8B5CF6" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi thưởng</Text>
        <View style={styles.gemBadge}>
           <Ionicons name="diamond" size={16} color="#8B5CF6" />
           <Text style={styles.gemText}>{userData?.gems || 0}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.xpBox}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.xpText}>Bạn đang có: <Text style={{ fontWeight: '900' }}>{userData?.xp || 0} XP</Text></Text>
        </View>

        <Text style={styles.sectionTitle}>Vật phẩm có sẵn</Text>
        {items.length > 0 ? items.map(item => (
          <View key={item._id} style={styles.rewardCard}>
            <View style={[styles.rewardIconBox, { backgroundColor: (item.color || '#F1F5F9') + '15' }]}>
              {item.imageUrl ? (
                <Image source={{ uri: resolveImageUrl(item.imageUrl) }} style={styles.rewardImg} />
              ) : (
                <Ionicons name="cube" size={40} color={item.color || '#CBD5E1'} />
              )}
            </View>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>{item.name}</Text>
              <Text style={styles.rewardType}>{item.category === 'BOOST' ? 'Vật phẩm bổ trợ' : 'Trang trí'}</Text>
              <TouchableOpacity 
                style={[styles.buyBtn, { backgroundColor: item.currency === 'GEMS' ? '#8B5CF6' : '#F59E0B' }]}
                onPress={() => handleBuy(item)}
              >
                 <Ionicons name={item.currency === 'GEMS' ? "diamond" : "star"} size={14} color="#FFF" style={{ marginRight: 4 }} />
                 <Text style={styles.buyBtnText}>{item.price}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )) : (
            <View style={styles.emptyState}>
                <Ionicons name="basket-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>Hiện chưa có vật phẩm nào được bày bán.</Text>
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "#FFFDF0" },
  backBtn: { marginRight: 16 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  gemBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  gemText: { marginLeft: 6, fontWeight: 'bold', color: '#7C3AED' },
  scrollContent: { padding: 20 },
  xpBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 15, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderColor: '#FEF3C7' },
  xpText: { marginLeft: 10, color: '#92400E', fontSize: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b", marginBottom: 20 },
  rewardCard: { flexDirection: "row", backgroundColor: "#FFFBEB", borderRadius: 24, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: "#FEF9C3", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  rewardIconBox: { width: 85, height: 85, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 15 },
  rewardImg: { width: 60, height: 60 },
  rewardInfo: { flex: 1, justifyContent: "center" },
  rewardTitle: { fontSize: 17, fontWeight: "800", color: "#1e293b", marginBottom: 4 },
  rewardType: { fontSize: 13, color: "#94A3B8", marginBottom: 12, fontWeight: '600' },
  buyBtn: { alignSelf: "flex-start", flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12 },
  buyBtnText: { color: "#FFF", fontWeight: "900", fontSize: 15 },
  emptyState: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontWeight: 'bold', marginTop: 15 }
});
