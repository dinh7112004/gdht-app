import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, useWindowDimensions, Dimensions, TextInput, ActivityIndicator, Alert, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import client, { BASE_URL } from "../../src/api/client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LibraryScreen() {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState("Thư viện");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Custom Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "Thư viện" && styles.activeTab]} 
          onPress={() => setActiveTab("Thư viện")}
        >
          <Text style={[styles.tabText, activeTab === "Thư viện" && styles.activeTabText]}>Thư viện bài giảng</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "Giao bài" && styles.activeTab]} 
          onPress={() => setActiveTab("Giao bài")}
        >
          <Text style={[styles.tabText, activeTab === "Giao bài" && styles.activeTabText]}>Giao bài tập</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "Thư viện" ? <LibraryView /> : <AssignmentView />}

    </SafeAreaView>
  );
}

function LibraryView() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    subject: "Toán học",
    isPublic: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await client.get("/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setSubmitting(true);
    try {
      const formDataUpload = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      formDataUpload.append('file', { uri, name: filename, type } as any);

      const res = await client.post('/upload/image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData({ ...formData, imageUrl: BASE_URL + res.data.url });
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải ảnh lên máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tên và mô tả chủ đề");
      return;
    }

    if (!formData.imageUrl) {
      Alert.alert("Lỗi", "Vui lòng chọn hoặc tải lên ảnh bìa cho chủ đề");
      return;
    }

    setSubmitting(true);
    try {
      await client.post("/categories", formData);
      setModalVisible(false);
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
        subject: "Toán học",
        isPublic: true
      });
      fetchCategories();
      Alert.alert("Thành công", "Đã tạo chủ đề mới!");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo chủ đề lúc này.");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteCategory = async (id: string) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa chủ đề này? Tất cả bài học bên trong sẽ không hiển thị được nữa.",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive", 
          onPress: async () => {
            try {
              await client.delete(`/categories/${id}`);
              fetchCategories();
              Alert.alert("Thành công", "Đã xóa chủ đề!");
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa chủ đề này.");
            }
          }
        }
      ]
    );
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Chủ đề nổi bật</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={20} color="#2E7D32" />
          <Text style={styles.addBtnText}>Tạo chủ đề</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {categories.map((cat) => (
          <TouchableOpacity 
            key={cat._id} 
            style={styles.libraryCard}
            onPress={() => router.push({ pathname: "/category/[id]", params: { id: cat._id, name: cat.name } })}
          >
            <Image source={{ uri: cat.imageUrl || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400" }} style={styles.catImg} />
            <View style={styles.catInfo}>
              <Text style={styles.catTitle}>{cat.name}</Text>
              <Text style={styles.catSub} numberOfLines={2}>{cat.description}</Text>
              <View style={styles.catFooter}>
                <TouchableOpacity 
                  style={styles.previewBtn}
                  onPress={() => router.push({ pathname: "/category/[id]", params: { id: cat._id, name: cat.name } })}
                >
                  <Text style={styles.previewBtnText}>Xem bài giảng</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteActionBtn}
                  onPress={() => handleDeleteCategory(cat._id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Create Category Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo chủ đề mới</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Ảnh bìa chủ đề</Text>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                  {formData.imageUrl ? (
                    <Image source={{ uri: formData.imageUrl }} style={styles.pickedImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={40} color="#cbd5e1" />
                      <Text style={styles.imagePlaceholderText}>Chọn ảnh từ thư viện</Text>
                    </View>
                  )}
                  {submitting && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Tên chủ đề</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Ví dụ: Di sản văn hóa"
                  value={formData.name}
                  onChangeText={(val) => setFormData({...formData, name: val})}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Môn học</Text>
                <View style={styles.pickerContainer}>
                  {["Toán học", "Lịch sử", "Địa lý", "Văn hóa"].map((s) => (
                    <TouchableOpacity 
                      key={s} 
                      style={[styles.pickerItem, formData.subject === s && styles.pickerItemActive]}
                      onPress={() => setFormData({...formData, subject: s})}
                    >
                      <Text style={[styles.pickerItemText, formData.subject === s && styles.pickerItemTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Mô tả</Text>
                <TextInput 
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Mô tả ngắn về chủ đề này..."
                  multiline
                  value={formData.description}
                  onChangeText={(val) => setFormData({...formData, description: val})}
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                onPress={handleCreateCategory}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Lưu chủ đề</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AssignmentView() {
  const [classes, setClasses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([
    { questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }
  ]);
  const [xpReward, setXpReward] = useState("50");
  const [estimatedMinutes, setEstimatedMinutes] = useState("10");
  const [difficulty, setDifficulty] = useState("Trung bình");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, catsRes] = await Promise.all([
          client.get("/classes/my-classes"),
          client.get("/categories")
        ]);
        setClasses(classesRes.data);
        setCategories(catsRes.data);
      } catch (error) {
        console.error("Failed to fetch assignment data", error);
      }
    };
    fetchData();
  }, []);

  const handleAddQuestion = () => {
    setQuestions([...questions, { questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleAssign = async () => {
    if (!selectedClassId || !selectedCatId) {
      Alert.alert("Lỗi", "Vui lòng chọn lớp và chủ đề bài học");
      return;
    }

    if (questions.some(q => !q.questionText.trim())) {
      Alert.alert("Lỗi", "Vui lòng hoàn thiện nội dung câu hỏi");
      return;
    }

    setLoading(true);
    try {
      // 1. Lấy tên category để tạo tiêu đề bài học
      const cat = categories.find(c => c._id === selectedCatId);
      const catName = cat?.name || "Chủ đề";

      // 2. Tạo một bài học mới (Lesson) tự động trong category này
      const lessonRes = await client.post("/lessons", {
        title: `Bài tập: ${catName} (${new Date().toLocaleDateString('vi-VN')})`,
        description: notes || `Bài tập ôn tập được giao trực tiếp từ giáo viên.`,
        content: notes || `Chúc các em hoàn thành tốt bài tập này!`,
        category: catName,
        imageUrl: cat?.imageUrl || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400",
        xpReward: parseInt(xpReward) || 50,
        estimatedMinutes: parseInt(estimatedMinutes) || 10,
        difficulty: difficulty,
        subject: cat?.subject || "Toán học"
      });

      const lessonId = lessonRes.data._id;

      // 3. Tạo bộ câu hỏi (Quiz) cho bài học đó
      await client.post("/quizzes", {
        lessonId: lessonId,
        questions: questions,
        xpReward: parseInt(xpReward) || 50
      });

      // 4. Giao category này cho lớp (để đảm bảo lớp có quyền truy cập)
      await client.post(`/classes/${selectedClassId}/categories`, { 
        categoryIds: [selectedCatId] 
      });

      Alert.alert("Thành công", "Đã tạo bộ câu hỏi và giao bài tập thành công!");
      
      // Reset form
      setQuestions([{ questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }]);
      setNotes("");
    } catch (error) {
      console.error("Failed to assign quiz", error);
      Alert.alert("Lỗi", "Không thể giao bài tập lúc này.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Chọn lớp học</Text>
        <View style={styles.pickerContainer}>
          {classes.map((c) => (
            <TouchableOpacity 
              key={c._id} 
              style={[styles.pickerItem, selectedClassId === c._id && styles.pickerItemActive]}
              onPress={() => setSelectedClassId(c._id)}
            >
              <Text style={[styles.pickerItemText, selectedClassId === c._id && styles.pickerItemTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Chọn chủ đề bài học</Text>
        <View style={styles.pickerContainer}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat._id} 
              style={[styles.pickerItem, selectedCatId === cat._id && styles.pickerItemActive]}
              onPress={() => setSelectedCatId(cat._id)}
            >
              <Text style={[styles.pickerItemText, selectedCatId === cat._id && styles.pickerItemTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.quizSection}>
        <View style={styles.quizHeader}>
          <Text style={styles.quizTitle}>Soạn bộ câu hỏi cho bài tập</Text>
          <TouchableOpacity style={styles.addQBtn} onPress={handleAddQuestion}>
            <Ionicons name="add" size={16} color="#4F46E5" />
            <Text style={styles.addQBtnText}>Thêm câu</Text>
          </TouchableOpacity>
        </View>

        {questions.map((q: any, qIndex: number) => (
          <View key={qIndex} style={styles.questionCard}>
            <View style={styles.qCardHeader}>
              <Text style={styles.qIndex}>Câu hỏi {qIndex + 1}</Text>
              <TouchableOpacity onPress={() => handleRemoveQuestion(qIndex)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <TextInput 
              style={[styles.input, { marginBottom: 12, height: 50 }]}
              placeholder="Nhập nội dung câu hỏi bài tập..."
              value={q.questionText}
              onChangeText={(val) => handleQuestionChange(qIndex, 'questionText', val)}
            />

            <View style={styles.optionsGrid}>
              {q.options.map((opt: string, oIndex: number) => (
                <View key={oIndex} style={[styles.optionItem, q.correctAnswerIndex === oIndex && styles.optionItemActive]}>
                  <TouchableOpacity 
                    style={[styles.radio, q.correctAnswerIndex === oIndex && styles.radioActive]}
                    onPress={() => handleQuestionChange(qIndex, 'correctAnswerIndex', oIndex)}
                  >
                    {q.correctAnswerIndex === oIndex && <View style={styles.radioInner} />}
                  </TouchableOpacity>
                  <TextInput 
                    style={styles.optionInput}
                    placeholder={`Đáp án ${String.fromCharCode(65 + oIndex)}`}
                    value={opt}
                    onChangeText={(val) => handleOptionChange(qIndex, oIndex, val)}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Thiết lập phần thưởng & Độ khó</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subLabel}>XP Thưởng</Text>
            <TextInput 
              style={styles.smallInput}
              keyboardType="numeric"
              value={xpReward}
              onChangeText={setXpReward}
              placeholder="Ví dụ: 100"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.subLabel}>Thời gian (phút)</Text>
            <TextInput 
              style={styles.smallInput}
              keyboardType="numeric"
              value={estimatedMinutes}
              onChangeText={setEstimatedMinutes}
              placeholder="Ví dụ: 15"
            />
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={styles.subLabel}>Độ khó</Text>
          <View style={styles.pickerContainer}>
            {["Dễ", "Trung bình", "Khó"].map((d) => (
              <TouchableOpacity 
                key={d} 
                style={[styles.pickerItem, difficulty === d && styles.pickerItemActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.pickerItemText, difficulty === d && styles.pickerItemTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Hạn chót & Ghi chú</Text>
        <TextInput 
          placeholder="Nhập ghi chú hoặc yêu cầu cụ thể cho bài tập này..." 
          style={styles.textInput}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <TouchableOpacity 
        style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
        onPress={handleAssign}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Giao bài ngay</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  tabContainer: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#FEF9C3", backgroundColor: "#FFFDF0" },
  tab: { flex: 1, paddingVertical: 16, alignItems: "center" },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#2E7D32" },
  tabText: { fontSize: 15, fontWeight: "bold", color: "#94a3b8" },
  activeTabText: { color: "#2E7D32" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100, backgroundColor: "#FFFDF0" },
  libraryCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", borderRadius: 24, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#FEF9C3" },
  catImg: { width: 80, height: 80, borderRadius: 16 },
  catInfo: { flex: 1, marginLeft: 16 },
  catTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  catSub: { fontSize: 12, color: "#64748b", marginVertical: 4 },
  catFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  deleteActionBtn: { padding: 8, backgroundColor: "#FEF2F2", borderRadius: 10 },
  previewBtn: { backgroundColor: "#FFFDF0", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: "flex-start", borderWidth: 1, borderColor: "#FEF9C3" },
  previewBtnText: { fontSize: 12, color: "#475569", fontWeight: "bold" },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  formGroup: { marginBottom: 32 },
  label: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 16 },
  pickerContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pickerItem: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#FEF9C3", backgroundColor: "#FFFBEB" },
  pickerItemActive: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  pickerItemText: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  pickerItemTextActive: { color: "#fff" },
  textInput: { backgroundColor: "#FFFBEB", borderRadius: 16, padding: 16, fontSize: 14, borderWidth: 1, borderColor: "#FEF9C3", color: "#1e293b", minHeight: 100, textAlignVertical: "top" },
  quizSection: { marginTop: 10, marginBottom: 20 },
  quizHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  quizTitle: { fontSize: 16, fontWeight: "900", color: "#1e293b", textTransform: "uppercase", letterSpacing: 1 },
  addQBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFDF0", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: "#FEF9C3" },
  addQBtnText: { fontSize: 12, fontWeight: "bold", color: "#2E7D32", marginLeft: 4 },
  questionCard: { backgroundColor: "#FFFBEB", borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#FEF9C3" },
  qCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  qIndex: { fontSize: 13, fontWeight: "900", color: "#64748b" },
  optionsGrid: { gap: 8 },
  optionItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFDF0", borderRadius: 12, padding: 8, borderWidth: 1, borderColor: "#FEF9C3" },
  optionItemActive: { borderColor: "#10B981", backgroundColor: "#F0FDF4" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#FEF9C3", justifyContent: "center", alignItems: "center", marginRight: 10 },
  radioActive: { borderColor: "#10B981" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10B981" },
  optionInput: { flex: 1, fontSize: 13, fontWeight: "bold", color: "#1e293b", padding: 0 },
  row: { flexDirection: "row", gap: 12 },
  subLabel: { fontSize: 12, fontWeight: "bold", color: "#64748b", marginBottom: 6, marginLeft: 4 },
  smallInput: { backgroundColor: "#FFFBEB", borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#FEF9C3", color: "#1e293b" },
  submitBtn: { backgroundColor: "#2E7D32", height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginTop: 20, shadowColor: "#2E7D32", shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  submitBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: "#1e293b" },
  addBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "#FEF9C3" },
  addBtnText: { fontSize: 13, fontWeight: "bold", color: "#2E7D32", marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFDF0", borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 24, paddingBottom: 40, maxHeight: "90%", borderWidth: 1, borderColor: "#FEF9C3" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  inputLabel: { fontSize: 14, fontWeight: "bold", color: "#64748b", marginBottom: 8 },
  input: { backgroundColor: "#FFFBEB", borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#FEF9C3", color: "#1e293b", marginBottom: 20 },
  imagePickerBtn: { width: "100%", height: 180, borderRadius: 24, backgroundColor: "#FFFBEB", borderWidth: 2, borderColor: "#FEF9C3", borderStyle: "dashed", overflow: "hidden", marginBottom: 20 },
  pickedImage: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: { fontSize: 14, color: "#94a3b8", fontWeight: "bold", marginTop: 8 },
  uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" }
});
