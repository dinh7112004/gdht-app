import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions, Modal, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import client, { BASE_URL } from "../../src/api/client";
import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function CategoryDetailScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const [lessons, setLessons] = useState<any[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: name as string,
    imageUrl: "",
    xpReward: 100,
    estimatedMinutes: 15,
    difficulty: "Dễ",
    subject: "Toán học",
    questions: [
      { questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }
    ]
  });

  useEffect(() => {
    fetchData();

    // Socket.io để cập nhật bài học thời gian thực
    const socket = io(BASE_URL);
    socket.on("dataChanged", (data) => {
      console.log("Category refresh triggered by:", data.event);
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, [id, name]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Lấy thông tin người dùng từ API trước
      const profileRes = await client.get("/auth/profile");
      const user = profileRes.data;
      setUserData(user);

      const isStudent = user?.role === 'STUDENT';
      
      // Lấy thông tin category trước để lấy ID thật
      const categoriesEndpoint = isStudent ? "/categories/for-student" : "/categories";
      const categoriesRes = await client.get(categoriesEndpoint);
      // Tìm category theo ID (id từ params) hoặc theo tên (name từ params)
      const currentCat = categoriesRes.data.find((c: any) => c._id === id || c.name === name);
      setCategoryInfo(currentCat);

      // Tuyệt chiêu: Gửi category lên backend để backend lọc thông minh (khớp tên OR khớp bài được giao)
      const currentName = (name as string || "").trim();
      const lessonsEndpoint = isStudent 
        ? `/lessons/for-student?category=${encodeURIComponent(currentName)}` 
        : `/lessons?category=${encodeURIComponent(currentName)}`;
        
      const lessonsRes = await client.get(lessonsEndpoint);
      setLessons(lessonsRes.data);
      
    } catch (e) {
      console.error("Failed to fetch category lessons", e);
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

  const handleDeleteLesson = async (lessonId: string) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa bài học này? Mọi câu hỏi liên quan cũng sẽ bị xóa.",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive", 
          onPress: async () => {
            try {
              await client.delete(`/lessons/${lessonId}`);
              fetchData();
              Alert.alert("Thành công", "Đã xóa bài học!");
            } catch (error) {
              Alert.alert("Lỗi", "Không thể xóa bài học này.");
            }
          }
        }
      ]
    );
  };

  const handleCreateLesson = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tiêu đề và nội dung bài học");
      return;
    }

    if (!formData.imageUrl) {
      Alert.alert("Lỗi", "Vui lòng chọn hoặc tải lên ảnh minh họa cho bài học");
      return;
    }

    if (formData.questions.some(q => !q.questionText.trim())) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ nội dung cho tất cả các câu hỏi");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Tạo bài học
      const lessonRes = await client.post("/lessons", {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        category: formData.category, // Tên
        categoryId: categoryInfo?._id, // Gắn ID thật vào đây
        imageUrl: formData.imageUrl,
        xpReward: formData.xpReward,
        estimatedMinutes: formData.estimatedMinutes,
        difficulty: formData.difficulty,
        subject: formData.subject
      });

      const lessonId = lessonRes.data._id;

      // 2. Tạo bộ câu hỏi (Quiz) gán cho bài học vừa tạo
      await client.post("/quizzes", {
        lessonId: lessonId,
        questions: formData.questions,
        xpReward: formData.xpReward
      });

      setModalVisible(false);
      setFormData({
        title: "",
        description: "",
        content: "",
        category: name as string,
        imageUrl: "",
        xpReward: 100,
        estimatedMinutes: 15,
        difficulty: "Dễ",
        subject: "Toán học",
        questions: [{ questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }]
      });
      fetchData();
      Alert.alert("Thành công", "Bài học và bộ câu hỏi đã được xuất bản!");
    } catch (error) {
      console.error("Failed to create lesson and quiz", error);
      Alert.alert("Lỗi", "Không thể tạo bài học lúc này.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }]
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (formData.questions.length <= 1) return;
    const newQuestions = [...formData.questions];
    newQuestions.splice(index, 1);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  if (loading && lessons.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{name}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Category Hero */}
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: categoryInfo?.imageUrl?.trim() || "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=400" }} 
            style={styles.heroImg} 
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.catName}>{name}</Text>
            <Text style={styles.catDesc}>{categoryInfo?.description || "Khám phá những bài học thú vị về di sản."}</Text>
          </View>
        </View>

        {/* Lessons List */}
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Danh sách bài học</Text>
              <Text style={styles.lessonCount}>{lessons.length} bài</Text>
            </View>
            {userData?.role !== 'STUDENT' && (
              <TouchableOpacity 
                style={styles.addLessonBtn}
                onPress={() => setModalVisible(true)}
              >
                <Ionicons name="add-circle" size={20} color="#2E7D32" />
                <Text style={styles.addLessonBtnText}>Tạo bài học</Text>
              </TouchableOpacity>
            )}
          </View>

          {lessons.map((lesson) => {
            const progress = userData?.completedLessons?.find((l: any) => 
                (typeof l === 'string' ? l === lesson._id : l.lessonId === lesson._id)
            );
            const isCompleted = !!progress;

            return (
              <TouchableOpacity 
                key={lesson._id} 
                style={styles.lessonCard}
                onPress={() => router.push(`/lesson/${lesson._id}`)}
              >
                <Image source={{ uri: lesson.imageUrl }} style={styles.lessonThumb} />
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <View style={styles.lessonMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#666" />
                      <Text style={styles.metaText}>{lesson.estimatedMinutes} phút</Text>
                    </View>
                    <View style={styles.metaItem}>
                      {isCompleted ? (
                         <>
                           <Ionicons name="checkmark-done" size={14} color="#10B981" />
                           <Text style={[styles.metaText, { color: '#10B981', fontWeight: 'bold' }]}>
                             Đã hoàn thành • {progress.score}/{progress.total}
                           </Text>
                         </>
                      ) : (
                         <>
                           <Ionicons name="star" size={14} color="#FF9800" />
                           <Text style={styles.metaText}>{lesson.xpReward} XP</Text>
                         </>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.lessonActions}>
                  <View style={[styles.playIcon, isCompleted && { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons 
                      name={isCompleted ? "checkmark-circle" : "play"} 
                      size={20} 
                      color={isCompleted ? "#10B981" : "#FFF"} 
                    />
                  </View>
                  {userData?.role !== 'STUDENT' && (
                    <TouchableOpacity 
                      style={styles.deleteBtnSmall}
                      onPress={() => handleDeleteLesson(lesson._id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {lessons.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color="#E0E0E0" />
              <Text style={styles.emptyText}>Chủ đề này chưa có bài học nào.</Text>
            </View>
          )}
        </View>

        {/* Create Lesson Modal */}
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tạo bài học mới</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Ảnh minh họa bài học</Text>
                  <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                    {formData.imageUrl ? (
                      <Image source={{ uri: formData.imageUrl }} style={styles.pickedImage} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={40} color="#cbd5e1" />
                        <Text style={styles.imagePlaceholderText}>Chọn ảnh cho bài học</Text>
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
                  <Text style={styles.inputLabel}>Tiêu đề bài học</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="Ví dụ: Phép cộng trong phạm vi 10"
                    value={formData.title}
                    onChangeText={(val) => setFormData({...formData, title: val})}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Giới thiệu ngắn</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="Giới thiệu về bài học..."
                    value={formData.description}
                    onChangeText={(val) => setFormData({...formData, description: val})}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Nội dung bài học (Story)</Text>
                  <TextInput 
                    style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                    placeholder="Viết nội dung bài học tại đây..."
                    multiline
                    value={formData.content}
                    onChangeText={(val) => setFormData({...formData, content: val})}
                  />
                </View>

                {/* Question Management Section */}
                <View style={styles.quizSection}>
                  <View style={styles.quizHeader}>
                    <Text style={styles.quizTitle}>Bộ câu hỏi trắc nghiệm</Text>
                    <TouchableOpacity style={styles.addQBtn} onPress={handleAddQuestion}>
                      <Ionicons name="add" size={16} color="#4F46E5" />
                      <Text style={styles.addQBtnText}>Thêm câu</Text>
                    </TouchableOpacity>
                  </View>

                  {formData.questions.map((q, qIndex) => (
                    <View key={qIndex} style={styles.questionCard}>
                      <View style={styles.qCardHeader}>
                        <Text style={styles.qIndex}>Câu hỏi {qIndex + 1}</Text>
                        <TouchableOpacity onPress={() => handleRemoveQuestion(qIndex)}>
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>

                      <TextInput 
                        style={[styles.input, { marginBottom: 12 }]}
                        placeholder="Nhập nội dung câu hỏi..."
                        value={q.questionText}
                        onChangeText={(val) => handleQuestionChange(qIndex, 'questionText', val)}
                      />

                      <View style={styles.optionsGrid}>
                        {q.options.map((opt, oIndex) => (
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

                      <TextInput 
                        style={[styles.input, { height: 60, marginTop: 10, fontSize: 13 }]}
                        placeholder="Giải thích tại sao đúng (Tùy chọn)..."
                        multiline
                        value={q.explanation}
                        onChangeText={(val) => handleQuestionChange(qIndex, 'explanation', val)}
                      />
                    </View>
                  ))}
                </View>

                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>XP Thưởng</Text>
                    <TextInput 
                      style={styles.input}
                      keyboardType="numeric"
                      value={formData.xpReward.toString()}
                      onChangeText={(val) => setFormData({...formData, xpReward: parseInt(val) || 0})}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Thời gian (phút)</Text>
                    <TextInput 
                      style={styles.input}
                      keyboardType="numeric"
                      value={formData.estimatedMinutes.toString()}
                      onChangeText={(val) => setFormData({...formData, estimatedMinutes: parseInt(val) || 0})}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                  onPress={handleCreateLesson}
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Xuất bản bài học</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFDF0",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#1A1A1A" },
  heroSection: { padding: 20 },
  heroImg: { width: "100%", height: 200, borderRadius: 32, backgroundColor: "#F5F5F5" },
  heroOverlay: {
    backgroundColor: "#FFFDF0",
    padding: 20,
    borderRadius: 24,
    marginTop: -40,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  catName: { fontSize: 24, fontWeight: "900", color: "#1A1A1A", marginBottom: 8 },
  catDesc: { fontSize: 14, color: "#666", lineHeight: 20 },
  content: { padding: 20, paddingBottom: 100 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1A1A1A" },
  lessonCount: { fontSize: 14, color: "#2E7D32", fontWeight: "bold" },
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F1F1",
  },
  lessonThumb: { width: 70, height: 70, borderRadius: 16, backgroundColor: "#F5F5F5" },
  lessonInfo: { flex: 1, marginLeft: 16, marginRight: 8 },
  lessonTitle: { fontSize: 15, fontWeight: "bold", color: "#1A1A1A", marginBottom: 6 },
  lessonMeta: { flexDirection: "row", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#666", fontWeight: "500" },
  playIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#2E7D32", justifyContent: "center", alignItems: "center" },
  lessonActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  deleteBtnSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FEF2F2", justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: "#999", marginTop: 16, fontWeight: "500" },
  addLessonBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#E8F5E9", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  addLessonBtnText: { fontSize: 13, fontWeight: "bold", color: "#2E7D32", marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 24, paddingBottom: 40, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  formGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "bold", color: "#64748b", marginBottom: 8 },
  input: { backgroundColor: "#F8FAFC", borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#E2E8F0", color: "#1e293b" },
  row: { flexDirection: "row", gap: 10 },
  submitBtn: { backgroundColor: "#2E7D32", height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginTop: 10 },
  submitBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  imagePickerBtn: { width: "100%", height: 180, borderRadius: 24, backgroundColor: "#F8FAFC", borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed", overflow: "hidden", marginBottom: 20 },
  pickedImage: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: { fontSize: 14, color: "#94a3b8", fontWeight: "bold", marginTop: 8 },
  uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  quizSection: { marginTop: 10, marginBottom: 20 },
  quizHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  quizTitle: { fontSize: 16, fontWeight: "900", color: "#1e293b", textTransform: "uppercase", letterSpacing: 1 },
  addQBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  addQBtnText: { fontSize: 12, fontWeight: "bold", color: "#4F46E5", marginLeft: 4 },
  questionCard: { backgroundColor: "#F8FAFC", borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  qCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  qIndex: { fontSize: 13, fontWeight: "900", color: "#64748b" },
  optionsGrid: { gap: 8 },
  optionItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  optionItemActive: { borderColor: "#10B981", backgroundColor: "#F0FDF4" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#CBD5E1", justifyContent: "center", alignItems: "center", marginRight: 10 },
  radioActive: { borderColor: "#10B981" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10B981" },
  optionInput: { flex: 1, fontSize: 13, fontWeight: "bold", color: "#1e293b", padding: 0 }
});
