import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import client from "../../src/api/client";

const { width } = Dimensions.get("window");

export default function InventoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await client.get("/auth/profile");
      setUserData(res.data);
    } catch (e) {
      console.error("Failed to fetch inventory", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (inventoryItem: any) => {
    const item = inventoryItem.itemId;
    if (!item) return;

    const isRenameCard = item.code === 'RENAME_CARD' || item.category === 'RENAME_CARD' || item.name === 'Thẻ đổi tên';

    if (isRenameCard) {
        // Nếu là thẻ đổi tên, chuyển hướng về trang cá nhân và mở modal sửa tên
        router.push({
            pathname: "/(student)/profile",
            params: { triggerRename: "true" }
        });
        return;
    }

    const isEquipable = item.category === 'AVATAR' || item.category === 'DECORATION';

    if (isEquipable) {
        try {
            const res = await client.post(`/items/use/${item._id}`);
            setUserData(res.data.user);
        } catch (e: any) {
            Alert.alert("Lỗi", e.response?.data?.message || "Không thể trang bị vật phẩm");
        }
    } else {
        Alert.alert(
            "Sử dụng vật phẩm",
            `Bạn có muốn sử dụng ${item.name} ngay bây giờ? Vật phẩm sẽ biến mất sau khi dùng.`,
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Sử dụng", 
                    onPress: async () => {
                        try {
                            const res = await client.post(`/items/use/${item._id}`);
                            setUserData(res.data.user);
                            Alert.alert("Thành công", res.data.message);
                        } catch (e: any) {
                            Alert.alert("Lỗi", e.response?.data?.message || "Không thể sử dụng vật phẩm");
                        }
                    }
                }
            ]
        );
    }
  };

  // SỬA LỖI TẠI ĐÂY: So sánh ID thay vì so sánh cả Object
  const isEquipped = (itemId: string, category: string) => {
      if (!userData?.equippedItems) return false;
      
      if (category === 'AVATAR') {
          const equippedId = typeof userData.equippedItems.avatarId === 'object' 
            ? userData.equippedItems.avatarId?._id 
            : userData.equippedItems.avatarId;
          return equippedId === itemId;
      }
      
      if (category === 'DECORATION') {
          const equippedId = typeof userData.equippedItems.frameId === 'object' 
            ? userData.equippedItems.frameId?._id 
            : userData.equippedItems.frameId;
          return equippedId === itemId;
      }
      
      return false;
  };

  const getFilteredInventory = () => {
    const inventory = (userData?.inventory || []).filter((item: any) => !!item.itemId);

    if (activeTab === "Tất cả") return inventory;
    
    const categoryMap: any = {
      'Avatar': 'AVATAR',
      'Thẻ đổi tên': 'RENAME_CARD',
    };
    
    return inventory.filter((item: any) => 
      item.itemId?.category === categoryMap[activeTab]
    );
  };

  const inventory = getFilteredInventory();

  if (loading && !userData) {
    return <View style={styles.loading}><ActivityIndicator color="#2E7D32" size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
             <Ionicons name="star" size={16} color="#F59E0B" />
             <Text style={styles.statText}>{userData?.xp || 0}</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: '#F5F3FF' }]}>
             <Ionicons name="diamond" size={16} color="#8B5CF6" />
             <Text style={[styles.statText, { color: '#7C3AED' }]}>{userData?.gems || 0}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.screenTitle}>Kho vật phẩm</Text>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {["Tất cả", "Avatar", "Thẻ đổi tên"].map(tab => (
            <TouchableOpacity 
               key={tab} 
               onPress={() => setActiveTab(tab)} 
               style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {inventory.length > 0 ? inventory.map((item: any, idx: number) => {
          const equipped = isEquipped(item.itemId?._id, item.itemId?.category);
          return (
            <TouchableOpacity 
              key={idx} 
              style={[styles.itemCard, equipped && styles.equippedCard]}
              onPress={() => handleAction(item)}
            >
              <View style={[styles.imgBox, { backgroundColor: (item.itemId?.color || '#F1F5F9') + '15' }]}>
                {item.itemId?.imageUrl ? (
                  <Image source={{ uri: item.itemId.imageUrl }} style={styles.itemImg} />
                ) : (
                  <Ionicons name="cube" size={40} color={item.itemId?.color || '#CBD5E1'} />
                )}
                {equipped ? (
                    <View style={styles.equippedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                        <Text style={styles.equippedText}>Đang dùng</Text>
                    </View>
                ) : (
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>Còn {item.quantity}</Text>
                    </View>
                )}
              </View>
              <Text style={[styles.itemName, equipped && { color: '#10B981' }]} numberOfLines={1}>{item.itemId?.name}</Text>
            </TouchableOpacity>
          );
        }) : (
          <View style={styles.emptyBox}>
             <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
             <Text style={styles.emptyText}>Bạn chưa có vật phẩm nào trong mục này.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  backBtn: { padding: 4 },
  statsRow: { flexDirection: "row", gap: 10 },
  stat: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#FEF3C7' },
  statText: { fontSize: 14, fontWeight: "900", marginLeft: 6, color: '#92400E' },
  screenTitle: { fontSize: 28, fontWeight: "900", color: '#1E293B', paddingHorizontal: 24, marginBottom: 20 },
  tabContainer: { height: 50, marginBottom: 24 },
  tabScroll: { paddingHorizontal: 20, gap: 10, alignItems: 'center' },
  tab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: '#FEF9C3' },
  activeTab: { backgroundColor: "#10B981", borderColor: '#10B981' },
  tabText: { fontSize: 14, fontWeight: "800", color: "#64748B" },
  activeTabText: { color: "#FFF" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, paddingBottom: 100 },
  itemCard: { width: (width - 48) / 3, alignItems: "center", marginBottom: 24 },
  equippedCard: { transform: [{ scale: 1.05 }] },
  imgBox: { width: 95, height: 95, borderRadius: 28, justifyContent: "center", alignItems: "center", position: "relative" },
  itemImg: { width: 55, height: 55, objectFit: 'contain' },
  countBadge: { position: "absolute", bottom: -5, backgroundColor: "#FFFBEB", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: "#FEF9C3" },
  countText: { color: "#64748B", fontSize: 10, fontWeight: "900" },
  equippedBadge: { position: "absolute", bottom: -5, backgroundColor: "#10B981", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 5 },
  equippedText: { color: "#FFF", fontSize: 9, fontWeight: "900", textTransform: 'uppercase' },
  itemName: { fontSize: 13, fontWeight: "800", color: "#334155", marginTop: 15, textAlign: 'center' },
  emptyBox: { width: width - 48, paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 14, fontWeight: '700', marginTop: 16, textAlign: 'center' },
});
