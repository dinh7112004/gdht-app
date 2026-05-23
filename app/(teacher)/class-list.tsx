import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, useWindowDimensions, Dimensions, ActivityIndicator, Modal, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "../../src/api/client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ClassListScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const loadWithCache = async () => {
      try {
        const cached = await AsyncStorage.getItem("teacher_class_list_cache");
        if (cached) {
          const data = JSON.parse(cached);
          setClasses(data.classes || []);
          setLoading(false);
        }
      } catch (_) {}
      fetchClasses();
    };
    void loadWithCache();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await client.get("/classes/my-classes");
      setClasses(res.data);
      await AsyncStorage.setItem("teacher_class_list_cache", JSON.stringify({ classes: res.data }));
    } catch (error) {
      console.error("Failed to fetch classes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên lớp học");
      return;
    }

    setCreateLoading(true);
    try {
      await client.post("/classes", { name: newClassName });
      setModalVisible(false);
      setNewClassName("");
      Alert.alert("Thành công", "Lớp học mới đã được tạo!");
      fetchClasses();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo lớp học lúc này");
    } finally {
      setCreateLoading(false);
    }
  };

  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinClassCode, setJoinClassCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const handleJoinClass = async () => {
    if (!joinClassCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã lớp");
      return;
    }

    setJoinLoading(true);
    try {
      await client.post("/classes/join", { code: joinClassCode.toUpperCase() });
      setJoinModalVisible(false);
      setJoinClassCode("");
      Alert.alert("Thành công", "Bạn đã tham gia lớp học thành công!");
      fetchClasses();
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể tham gia lớp học lúc này");
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lớp học của tôi</Text>
        <TouchableOpacity onPress={fetchClasses}>
          <Ionicons name="refresh" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {classes.map((item) => (
            <TouchableOpacity 
              key={item._id} 
              style={styles.classCard}
              onPress={() => router.push({ pathname: "/(teacher)/class-detail/[id]", params: { id: item._id } })}
            >
              <View style={styles.classIconBox}>
                <Ionicons name="school" size={40} color="#2E7D32" />
              </View>
              <View style={styles.classInfo}>
                <View style={styles.infoTop}>
                  <Text style={styles.className}>{item.name}</Text>
                  <Text style={styles.classCodeText}>Mã: {item.code}</Text>
                </View>
                <Text style={styles.classSub}>{item.studentIds?.length || 0} học sinh</Text>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${item.progress || 0}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{item.progress || 0}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {classes.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={80} color="#cbd5e1" />
              <Text style={styles.emptyText}>Bạn chưa tạo hoặc tham gia lớp học nào.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, { flex: 1, marginRight: 8, backgroundColor: '#fff', borderWidth: 2, borderColor: '#2E7D32' }]}
          onPress={() => setJoinModalVisible(true)}
        >
          <Ionicons name="enter-outline" size={24} color="#2E7D32" />
          <Text style={[styles.fabText, { color: '#2E7D32' }]}>Tham gia lớp</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.fab, { flex: 1, marginLeft: 8 }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.fabText}>Tạo lớp mới</Text>
        </TouchableOpacity>
      </View>

      {/* Create Class Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo lớp học mới</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Tên lớp học</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Lớp 5A - Toán học"
                value={newClassName}
                onChangeText={setNewClassName}
                autoFocus
              />
              <Text style={styles.inputHint}>Học sinh sẽ dùng mã lớp để tham gia vào lớp học này.</Text>
            </View>

            <TouchableOpacity 
              style={[styles.createBtn, createLoading && { opacity: 0.7 }]}
              onPress={handleCreateClass}
              disabled={createLoading}
            >
              {createLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createBtnText}>Tạo lớp học</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join Class Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={joinModalVisible}
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tham gia lớp học</Text>
              <TouchableOpacity onPress={() => setJoinModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Mã lớp</Text>
              <TextInput
                style={[styles.input, { textTransform: 'uppercase' }]}
                placeholder="Nhập mã lớp..."
                value={joinClassCode}
                onChangeText={setJoinClassCode}
                autoCapitalize="characters"
                autoFocus
              />
              <Text style={styles.inputHint}>Hỏi giáo viên chủ nhiệm để lấy mã lớp.</Text>
            </View>

            <TouchableOpacity 
              style={[styles.createBtn, joinLoading && { opacity: 0.7 }]}
              onPress={handleJoinClass}
              disabled={joinLoading}
            >
              {joinLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createBtnText}>Tham gia</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, backgroundColor: "#FFFDF0" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#1e293b" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFDF0" },
  list: { padding: 20, paddingBottom: 100 },
  classCard: { flexDirection: "row", backgroundColor: "#FFFBEB", borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#FEF9C3", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  classIconBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center" },
  classInfo: { flex: 1, marginLeft: 16 },
  infoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  className: { fontSize: 18, fontWeight: "bold", color: "#1e293b", flex: 1 },
  classCodeText: { fontSize: 11, fontWeight: "900", color: "#2E7D32", backgroundColor: "#E8F5E9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: "hidden" },
  classSub: { fontSize: 14, color: "#64748b", marginTop: 4 },
  progressContainer: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 10 },
  progressTrack: { flex: 1, height: 6, backgroundColor: "#FFFDF0", borderRadius: 3 },
  progressFill: { height: "100%", backgroundColor: "#4CAF50", borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: "bold", color: "#2E7D32" },
  fabContainer: { position: "absolute", bottom: 20, left: 20, right: 20, flexDirection: "row", justifyContent: "space-between" },
  fab: { height: 60, backgroundColor: "#2E7D32", borderRadius: 30, flexDirection: "row", justifyContent: "center", alignItems: "center", shadowColor: "#2E7D32", shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  fabText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 15, color: "#94a3b8", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFDF0", borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: "#FEF9C3" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  modalBody: { marginBottom: 32 },
  inputLabel: { fontSize: 14, fontWeight: "bold", color: "#64748b", marginBottom: 8 },
  input: { backgroundColor: "#FFFBEB", borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#FEF9C3", color: "#1e293b" },
  inputHint: { fontSize: 12, color: "#94a3b8", marginTop: 12, lineHeight: 18 },
  createBtn: { backgroundColor: "#2E7D32", height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center" },
  createBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" }
});
