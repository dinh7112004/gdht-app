import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, useWindowDimensions, TextInput, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import client from "../../src/api/client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function AllCategoriesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchCategories();
    }, [])
  );

  const fetchCategories = async () => {
    try {
      const res = await client.get("/categories/for-student");
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tất cả chủ đề của lớp</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput 
          placeholder="Tìm chủ đề học tập..." 
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))}
        numColumns={2}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push({ pathname: "/category/[id]", params: { id: item._id, name: item.name } })}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.img} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.sub}>Dành riêng cho lớp</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#FFFDF0" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#1e293b" },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFFBEB", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#FEF9C3" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", marginHorizontal: 20, marginBottom: 20, paddingHorizontal: 15, height: 54, borderRadius: 27, borderWidth: 1, borderColor: "#FEF9C3" },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#1e293b", fontWeight: "500" },
  list: { padding: 15 },
  row: { justifyContent: "space-between" },
  card: { width: (SCREEN_WIDTH - 45) / 2, backgroundColor: "#FFFBEB", borderRadius: 24, marginBottom: 15, overflow: "hidden", elevation: 2, borderWidth: 1, borderColor: '#FEF9C3' },
  img: { width: "100%", height: 110, borderRadius: 20 },
  info: { padding: 12 },
  name: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  sub: { fontSize: 12, color: "#94a3b8", marginTop: 4 }
});
