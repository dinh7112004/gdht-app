import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Image, useWindowDimensions, Dimensions, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import client from "../../src/api/client";
import { useTranslation } from "../../src/context/LanguageContext";
import { ActivityIndicator } from "react-native";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ExploreScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchData(activeFilter, searchQuery);
    }, [activeFilter])
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData(activeFilter, searchQuery);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchData = async (categoryFilter?: string, search?: string) => {
    try {
      let url = "/categories/for-student?";
      if (categoryFilter && categoryFilter !== "Tất cả") url += `search=${categoryFilter}&`;
      if (search) url += `search=${search}`;

      const [profileRes, catRes] = await Promise.all([
        client.get("/auth/profile"),
        client.get(url)
      ]);
      
      setUserData(profileRes.data);
      setCategories(catRes.data);
    } catch (e) {
      console.error("Failed to fetch explore data", e);
    } finally {
      setLoading(false);
    }
  };

  const filters = ["Tất cả", ...new Set(categories.map(c => c.subject).filter(s => !!s))];

  // Group categories by Subject
  const groupedCategories = categories.reduce((acc: any, cat: any) => {
    const subject = cat.subject || "Chương trình chung";
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(cat);
    return acc;
  }, {});

  const subjectOrder = Object.keys(groupedCategories);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.statValue}>{userData?.xp || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="diamond" size={20} color="#A855F7" />
            <Text style={styles.statValue}>{userData?.gems || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={20} color="#F97316" />
            <Text style={styles.statValue}>{userData?.streak || 0}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94a3b8" />
            <TextInput 
              placeholder="Tìm kiếm chủ đề học tập..." 
              style={styles.searchInput}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filters (Subjects) */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
            {filters.map((filter) => (
              <TouchableOpacity 
                key={filter} 
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
              >
                <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content Grid */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="book-outline" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>Chưa có chủ đề nào phù hợp</Text>
          </View>
        ) : (
          <View style={styles.contentBody}>
            {subjectOrder.map((subject) => {
              // Nếu đang lọc theo môn học, chỉ hiện môn đó
              if (activeFilter !== "Tất cả" && activeFilter !== subject) return null;
              
              const cats = groupedCategories[subject];
              if (!cats || cats.length === 0) return null;

              return (
                <View key={subject} style={styles.subjectSection}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <View style={[styles.dot, { backgroundColor: subject === 'Toán học' ? '#3B82F6' : '#2E7D32' }]} />
                      <Text style={styles.subjectTitle}>{subject}</Text>
                    </View>
                    <Text style={styles.sectionCount}>{cats.length} chủ đề</Text>
                  </View>
                  
                  <View style={styles.gridContainer}>
                    {cats.map((cat: any) => (
                      <TouchableOpacity 
                        key={cat._id}
                        style={styles.catCard} 
                        onPress={() => router.push({ pathname: "/category/[id]", params: { id: cat._id, name: cat.name } })}
                      >
                        <Image 
                          source={{ uri: cat.imageUrl || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400" }} 
                          style={styles.catImg} 
                        />
                        <View style={styles.catInfo}>
                          <Text style={styles.catTitle} numberOfLines={2}>{cat.name}</Text>
                          <View style={styles.catMeta}>
                            <Ionicons name="book-outline" size={14} color="#64748b" />
                            <Text style={styles.catCount}>{cat.lessonCount || 0} bài học</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    paddingVertical: 15 
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: "#FFFBEB", 
    justifyContent: "center", 
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  headerStats: { 
    flexDirection: "row", 
    backgroundColor: "#FFFBEB", 
    borderRadius: 25, 
    paddingHorizontal: 15, 
    paddingVertical: 8,
    gap: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statValue: { fontSize: 16, fontWeight: "800", color: "#1e293b" },

  searchContainer: { paddingHorizontal: 20, marginVertical: 10 },
  searchBar: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#FFFBEB", 
    paddingHorizontal: 15, 
    height: 54, 
    borderRadius: 27, 
    borderWidth: 1, 
    borderColor: "#FEF9C3" 
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: "500" },

  filterSection: { marginBottom: 20 },
  filterList: { paddingHorizontal: 20, gap: 10 },
  filterChip: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 25, 
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FEF9C3"
  },
  activeFilterChip: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  filterText: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  activeFilterText: { color: "#fff" },

  loadingBox: { padding: 50, alignItems: 'center' },
  emptyBox: { padding: 100, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#94a3b8', fontWeight: '600', marginTop: 15 },

  contentBody: { paddingBottom: 20 },
  subjectSection: { marginBottom: 25 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 15 
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  subjectTitle: { fontSize: 18, fontWeight: "900", color: "#1e293b" },
  sectionCount: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },

  gridContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    paddingHorizontal: 15, 
    justifyContent: "space-between" 
  },
  catCard: { 
    width: (SCREEN_WIDTH - 50) / (SCREEN_WIDTH > 600 ? 3 : 2), 
    backgroundColor: "#FFFBEB", 
    borderRadius: 24, 
    marginBottom: 20, 
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FEF9C3",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3
  },
  catImg: { width: "100%", height: 160, borderRadius: 20 },
  catInfo: { padding: 15 },
  catTitle: { fontSize: 15, fontWeight: "800", color: "#1e293b", marginBottom: 8, lineHeight: 20 },
  catMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  catCount: { fontSize: 12, color: "#64748b", fontWeight: "700" }
});
