import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, useWindowDimensions, Dimensions, ActivityIndicator, Modal, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import client, { BASE_URL, resolveImageUrl } from "../../../src/api/client";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ClassDetailScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('students');

  useEffect(() => {
    fetchClassDetail();
    fetchLessons();
  }, [id]);

  const fetchClassDetail = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/classes/${id}`);
      setClassData(res.data);
    } catch (error) {
      console.error("Failed to fetch class detail", error);
    } finally {
      setLoading(false);
    }
  };

  // Assignment Creation & Edit States
  const [createAssignmentModalVisible, setCreateAssignmentModalVisible] = useState(false);
  const [editAssignmentModalVisible, setEditAssignmentModalVisible] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([
    { questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }
  ]);
  const [xpReward, setXpReward] = useState("100");
  const [estimatedMinutes, setEstimatedMinutes] = useState("15");
  const [difficulty, setDifficulty] = useState("Trung bình");
  const [notes, setNotes] = useState("");
  const [selectedCatIdForNew, setSelectedCatIdForNew] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);

  useEffect(() => {
    if ((categoryModalVisible || createAssignmentModalVisible) && categories.length === 0) fetchCategories();
  }, [categoryModalVisible, createAssignmentModalVisible]);

  useEffect(() => {
    if (activeTab === 'lessons' || lessonModalVisible) fetchLessons();
  }, [activeTab, lessonModalVisible]);

  const fetchCategories = async () => {
    try {
      const res = await client.get('/categories');
      setCategories(res.data);
    } catch (error) { }
  };

  const fetchLessons = async () => {
    try {
      const res = await client.get('/lessons');
      setLessons(res.data);
    } catch (error) { }
  };

  const handleToggleFeatured = async (lesson: any) => {
    const cat = categories.find(c => c.name === lesson.category || c._id === lesson.categoryId);
    if (!cat) {
      // Nếu chưa có categories trong state, fetch rồi thử lại
      await fetchCategories();
      return;
    }
    try {
      await client.put(`/categories/${cat._id}`, { isFeatured: !cat.isFeatured });
      fetchCategories(); // Refresh categories để cập nhật UI
    } catch (e) {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái nổi bật");
    }
  };

  const handleAssignCategory = async (categoryId: string) => {
    try {
      setSubmitting(true);
      await client.post(`/classes/${id}/categories`, { categoryId });
      Alert.alert("Thành công", "Đã giao chủ đề cho lớp");
      setCategoryModalVisible(false);
      fetchClassDetail();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể giao chủ đề");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignLesson = async (lessonId: string) => {
    try {
      setSubmitting(true);
      await client.post(`/classes/${id}/lessons`, { lessonId });
      Alert.alert("Thành công", "Đã giao bài học cho lớp");
      fetchClassDetail();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể giao bài học");
    } finally {
      setSubmitting(false);
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

      const uploadedUrl = res.data.url;
      setImageUrl(uploadedUrl.startsWith('http') ? uploadedUrl : BASE_URL + uploadedUrl);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải ảnh lên máy chủ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditLesson = async (lesson: any) => {
    try {
      setSubmitting(true);
      setEditingLessonId(lesson._id);
      setTitle(lesson.title);
      setNotes(lesson.description || "");
      setXpReward(String(lesson.xpReward || 100));
      setEstimatedMinutes(String(lesson.estimatedMinutes || 15));
      setDifficulty(lesson.difficulty || "Trung bình");
      setSelectedCatIdForNew(lesson.categoryId || "");

      // Lấy Quiz của Lesson này
      try {
        console.log("=== DEBUG EDIT LESSON ===");
        console.log("Target Lesson ID:", lesson._id);

        const quizRes = await client.get(`/quizzes/lesson/${lesson._id}`);
        console.log("Direct API Quiz Response:", quizRes.data);

        if (quizRes.data && Array.isArray(quizRes.data.questions) && quizRes.data.questions.length > 0) {
          setQuestions(quizRes.data.questions);
          setEditingQuizId(quizRes.data._id); // Ghi nhớ ID Quiz
        } else {
          throw { response: { status: 404 } };
        }
      } catch (quizErr: any) {
        console.log("Direct fetch failed or empty, trying fallback search...");
        const allQuizzes = await client.get('/quizzes');

        const foundQuiz = allQuizzes.data.find((q: any) => {
          const qLessonId = q.lessonId?._id || q.lessonId;
          return String(qLessonId) === String(lesson._id);
        });

        if (foundQuiz) {
          console.log("FOUND QUIZ IN FALLBACK:", foundQuiz._id);
          setQuestions(foundQuiz.questions);
          setEditingQuizId(foundQuiz._id); // Ghi nhớ ID Quiz
        } else {
          setEditingQuizId(null);
          setQuestions([{ questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }]);
        }
      }

      setEditAssignmentModalVisible(true);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải thông tin bài giảng");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignLesson = async (lessonId: string) => {
    try {
      setSubmitting(true);
      await client.delete(`/classes/${id}/lessons/${lessonId}`);
      Alert.alert("Thành công", "Đã gỡ bài học khỏi lớp");
      fetchClassDetail();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gỡ bài học");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    Alert.alert("Xác nhận", "Thầy/Cô có chắc chắn muốn xóa bài giảng này khỏi thư viện?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await client.delete(`/lessons/${lessonId}`);
            Alert.alert("Thành công", "Đã xóa bài giảng");
            fetchLessons();
            fetchClassDetail();
          } catch (error) {
            Alert.alert("Lỗi", "Không thể xóa bài giảng");
          }
        }
      }
    ]);
  };

  const handleUpdateAssignment = async () => {
    if (!editingLessonId) return;
    setSubmitting(true);
    try {
      // 1. Cập nhật Lesson (Dùng PUT theo Backend)
      await client.put(`/lessons/${editingLessonId}`, {
        title,
        description: notes,
        content: notes,
        xpReward: parseInt(xpReward),
        estimatedMinutes: parseInt(estimatedMinutes),
        difficulty,
        categoryId: selectedCatIdForNew
      });

      // 2. Cập nhật Quiz (Chiến thuật Xóa cũ - Tạo mới để tránh lỗi đồng bộ)
      if (editingQuizId) {
        try {
          await client.delete(`/quizzes/${editingQuizId}`);
        } catch (e) { }
      }

      await client.post("/quizzes", {
        lessonId: editingLessonId,
        questions: questions,
        xpReward: parseInt(xpReward)
      });

      Alert.alert("Thành công", "Đã cập nhật bài giảng");
      setEditAssignmentModalVisible(false);
      fetchLessons();
      fetchClassDetail();
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể lưu thay đổi bài giảng");
    } finally {
      setSubmitting(false);
    }
  };

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
    setQuestions(prev => {
      const newQuestions = [...prev];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      return newQuestions;
    });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    setQuestions(prev => {
      const newQuestions = [...prev];
      const newOptions = [...newQuestions[qIndex].options];
      newOptions[oIndex] = value;
      newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
      return newQuestions;
    });
  };

  const handleCreateAndAssign = async () => {
    if (!selectedCatIdForNew) {
      Alert.alert("Lỗi", "Vui lòng chọn một chủ đề cho bài học");
      return;
    }
    if (!title.trim() || !content.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tiêu đề và nội dung bài học");
      return;
    }
    if (!imageUrl) {
      Alert.alert("Lỗi", "Vui lòng chọn hoặc tải lên ảnh minh họa cho bài học");
      return;
    }
    if (questions.some(q => !q.questionText.trim())) {
      Alert.alert("Lỗi", "Vui lòng hoàn thiện nội dung câu hỏi");
      return;
    }

    setSubmitting(true);
    try {
      const cat = categories.find(c => c._id === selectedCatIdForNew);
      const catName = cat?.name || "Chủ đề";

      // 1. Tạo Lesson mới
      const lessonRes = await client.post("/lessons", {
        title,
        description: description || `Bài học mới cho lớp ${classData?.name}`,
        content,
        category: catName,
        categoryId: selectedCatIdForNew,
        imageUrl: imageUrl,
        xpReward: parseInt(xpReward) || 100,
        estimatedMinutes: parseInt(estimatedMinutes) || 15,
        difficulty: difficulty,
        subject: cat?.subject || "Toán học",
        targetClassIds: [id] 
      });

      const lessonId = lessonRes.data._id;

      // 2. Tạo Quiz
      await client.post("/quizzes", {
        lessonId: lessonId,
        questions: questions,
        xpReward: parseInt(xpReward) || 100
      });

      // 3. Giao Lesson cho Lớp hiện tại
      await client.post(`/classes/${id}/lessons`, { lessonId });

      Alert.alert("Thành công", "Đã tạo và xuất bản bài học mới thành công!");
      setCreateAssignmentModalVisible(false);
      fetchLessons();
      fetchClassDetail();

      // Reset
      setTitle("");
      setDescription("");
      setContent("");
      setImageUrl("");
      setQuestions([{ questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }]);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tạo bài học lúc này.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !classData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.newHeader}>
        <View>
          <Text style={styles.newClassTitle}>{classData?.name}</Text>
          <TouchableOpacity
            style={styles.newHeaderSub}
            onPress={() => setActiveTab('students')}
          >
            <Ionicons name="person" size={16} color="#64748b" />
            <Text style={styles.newStudentCount}>{classData?.studentIds?.length || 0} học sinh</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push("/(teacher)/class-list")}>
          <Text style={styles.xemLopKhac}>Xem lớp khác</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.newScrollContent}>

        {/* New Stats Row */}
        <View style={styles.newStatsRow}>
          <View style={[styles.newStatCard, { borderLeftColor: '#4CAF50', borderLeftWidth: 4 }]}>
            <Text style={[styles.newStatLabel, { color: '#4CAF50' }]}>Tiến độ lớp</Text>
            <Text style={[styles.newStatValue, { color: '#4CAF50' }]}>{classData?.progress || 0}%</Text>
          </View>

          <View style={[styles.newStatCard, { borderLeftColor: '#3B82F6', borderLeftWidth: 4 }]}>
            <Text style={[styles.newStatLabel, { color: '#3B82F6' }]}>Bài đã giao</Text>
            <Text style={[styles.newStatValue, { color: '#3B82F6' }]}>{classData?.assignedLessons?.length || 0}</Text>
          </View>

          <View style={[styles.newStatCard, { borderLeftColor: '#8B5CF6', borderLeftWidth: 4 }]}>
            <Text style={[styles.newStatLabel, { color: '#8B5CF6' }]}>Bài nộp đủ</Text>
            <Text style={[styles.newStatValue, { color: '#8B5CF6' }]}>{Math.floor((classData?.studentIds?.length || 0) * 0.8)}</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.newSection}>
          {activeTab === 'overview' && (
            <>
              <Text style={styles.newSectionTitle}>Bài tập gần đây</Text>
              {classData?.assignedLessons?.map((lesson: any) => {
                // Tính toán số lượng học sinh đã làm bài (nếu có dữ liệu, mặc định là 0)
                const submittedCount = lesson.completedStudentIds?.length || 0;
                const totalStudents = classData?.studentIds?.length || 0;

                // Giả định hạn nộp được lưu trong bài giảng hoặc mặc định là 7 ngày sau khi giao
                const deadline = lesson.dueDate ? new Date(lesson.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                return (
                  <NewAssignmentItem
                    key={lesson._id}
                    title={lesson.title}
                    dueDate={deadline}
                    submitted={`${submittedCount}/${totalStudents}`}
                    img={lesson.imageUrl || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400"}
                  />
                );
              })}
              {classData?.assignedLessons?.length === 0 && (
                <Text style={styles.emptyText}>Chưa có bài tập nào gần đây.</Text>
              )}
            </>
          )}

          {activeTab === 'lessons' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quản lý bài giảng</Text>
                <TouchableOpacity onPress={() => setCreateAssignmentModalVisible(true)} style={styles.addBtn}>
                  <Ionicons name="add" size={20} color="#2E7D32" />
                </TouchableOpacity>
              </View>

              {/* Hiển thị Bài học từ thư viện */}
              {lessons
                .map((lesson: any) => {
                  const isAssigned = classData?.assignedLessons?.some((al: any) => al._id === lesson._id);
                  const cat = categories.find(c => c.name === lesson.category || c._id === lesson.categoryId);
                  const isFeatured = cat?.isFeatured || false;

                  return (
                    <ManageLessonItem
                      key={lesson._id}
                      title={lesson.title}
                      category={lesson.category || "Bài lẻ"}
                      img={lesson.imageUrl || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400"}
                      isAssigned={isAssigned}
                      isFeatured={isFeatured}
                      onAssign={() => isAssigned ? handleUnassignLesson(lesson._id) : handleAssignLesson(lesson._id)}
                      onToggleFeatured={() => handleToggleFeatured(lesson)}
                      onEdit={() => handleEditLesson(lesson)}
                      onDelete={() => handleDeleteLesson(lesson._id)}
                    />
                  );
                })}

              {lessons.length === 0 && (
                <Text style={styles.emptyText}>Thư viện của Thầy/Cô đang trống.</Text>
              )}
            </View>
          )}

          {activeTab === 'students' && (
            <View style={styles.studentsList}>
              <Text style={styles.newSectionTitle}>Danh sách học sinh ({classData?.studentIds?.length || 0})</Text>
              {classData?.studentIds?.map((student: any) => (
                <StudentItem
                  key={student._id}
                  name={student.fullName}
                  email={student.email}
                  onPress={() => router.push({ pathname: "/(teacher)/student/[id]", params: { id: student._id } })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* New Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TabItem icon="create-outline" label="Tổng quan" active={activeTab === 'overview'} onPress={() => setActiveTab('overview')} />
        <TabItem icon="book-outline" label="Bài học" active={activeTab === 'lessons'} onPress={() => setActiveTab('lessons')} />
        <TabItem icon="people-outline" label="Học sinh" active={activeTab === 'students'} onPress={() => setActiveTab('students')} />
        <TabItem icon="add-circle-outline" label="Giao bài" active={lessonModalVisible} onPress={() => setLessonModalVisible(true)} />
      </View>

      {/* Assign Lesson Modal (Danh sách bài có sẵn) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={lessonModalVisible}
        onRequestClose={() => setLessonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn bài học để giao</Text>
              <TouchableOpacity onPress={() => setLessonModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Nút để chuyển sang soạn bài mới nếu muốn */}
            <TouchableOpacity
              style={styles.createNewBtn}
              onPress={() => {
                setLessonModalVisible(false);
                setCreateAssignmentModalVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={20} color="#2E7D32" />
              <Text style={styles.createNewBtnText}>Hoặc soạn bài tập mới tại đây</Text>
            </TouchableOpacity>

            <ScrollView style={styles.modalList}>
              {lessons
                .map((lesson: any) => {
                  const isAssigned = classData?.assignedLessons?.some((al: any) => al._id === lesson._id);
                  return (
                    <View key={lesson._id} style={styles.modalItem}>
                      <View style={styles.modalItemInfo}>
                        <Text style={styles.modalItemTitle}>{lesson.title}</Text>
                        <Text style={styles.modalItemSub}>{lesson.category}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.modalAddBtn, isAssigned && { backgroundColor: '#cbd5e1' }]}
                        onPress={() => handleAssignLesson(lesson._id)}
                        disabled={submitting || isAssigned}
                      >
                        <Text style={styles.modalAddBtnText}>{isAssigned ? 'Đã giao' : 'Giao'}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              {lessons.length === 0 && (
                <Text style={[styles.emptyText, { textAlign: 'center', marginTop: 20 }]}>Thư viện của Thầy/Cô đang trống.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={createAssignmentModalVisible}
        onRequestClose={() => setCreateAssignmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo bài học mới</Text>
              <TouchableOpacity onPress={() => setCreateAssignmentModalVisible(false)}>
                <Ionicons name="close" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Ảnh minh họa bài học</Text>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                  {imageUrl ? (
                    <Image source={{ uri: resolveImageUrl(imageUrl) }} style={styles.pickedImage} />
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
                <Text style={styles.inputLabel}>Chọn chủ đề</Text>
                <View style={styles.pickerContainer}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat._id}
                      style={[styles.pickerItem, selectedCatIdForNew === cat._id && styles.pickerItemActive]}
                      onPress={() => setSelectedCatIdForNew(cat._id)}
                    >
                      <Text style={[styles.pickerItemText, selectedCatIdForNew === cat._id && styles.pickerItemTextActive]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Tiêu đề bài học</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Ví dụ: Phép cộng trong phạm vi 10"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Giới thiệu ngắn</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Giới thiệu về bài học..."
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Nội dung bài học (Story)</Text>
                <TextInput 
                  style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                  placeholder="Viết nội dung bài học tại đây..."
                  multiline
                  value={content}
                  onChangeText={setContent}
                />
              </View>

              <View style={styles.quizSection}>
                <View style={styles.quizHeader}>
                  <Text style={styles.quizTitle}>Bộ câu hỏi trắc nghiệm</Text>
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
                      style={[styles.input, { marginBottom: 12 }]}
                      placeholder="Nhập nội dung câu hỏi..."
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
                    value={xpReward}
                    onChangeText={setXpReward}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Thời gian (phút)</Text>
                  <TextInput 
                    style={styles.input}
                    keyboardType="numeric"
                    value={estimatedMinutes}
                    onChangeText={setEstimatedMinutes}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, (submitting || !selectedCatIdForNew) && { opacity: 0.7 }]} 
                onPress={handleCreateAndAssign}
                disabled={submitting || !selectedCatIdForNew}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Xuất bản bài học</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Assignment Modal - BẢNG SỬA BÀI GIẢNG */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editAssignmentModalVisible}
        onRequestClose={() => setEditAssignmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sửa bài giảng</Text>
              <TouchableOpacity onPress={() => setEditAssignmentModalVisible(false)}>
                <Ionicons name="close" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Tiêu đề bài học</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Nhập tên bài học..."
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Chọn chủ đề</Text>
                <View style={styles.pickerContainer}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat._id}
                      style={[styles.pickerItem, selectedCatIdForNew === cat._id && styles.pickerItemActive]}
                      onPress={() => setSelectedCatIdForNew(cat._id)}
                    >
                      <Text style={[styles.pickerItemText, selectedCatIdForNew === cat._id && styles.pickerItemTextActive]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.quizSection}>
                <View style={styles.quizHeader}>
                  <Text style={styles.quizTitle}>Bộ câu hỏi trắc nghiệm</Text>
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
                      style={[styles.input, { marginBottom: 12 }]}
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
                            value={opt}
                            onChangeText={(val) => handleOptionChange(qIndex, oIndex, val)}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>XP Thưởng</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={xpReward} onChangeText={setXpReward} />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Thời gian (phút)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={estimatedMinutes} onChangeText={setEstimatedMinutes} />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleUpdateAssignment}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Lưu thay đổi</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function NewAssignmentItem({ title, dueDate, submitted, img }: any) {
  const isExpired = new Date() > new Date(dueDate);
  const formattedDate = new Date(dueDate).toLocaleDateString('vi-VN');

  return (
    <View style={[styles.newHwCard, isExpired && { opacity: 0.8 }]}>
      <Image source={{ uri: img }} style={styles.newHwImg} />
      <View style={styles.newHwInfo}>
        <Text style={styles.newHwTitle}>{title}</Text>
        <Text style={[styles.newHwDate, isExpired && { color: '#EF4444', fontWeight: 'bold' }]}>
          {isExpired ? `Đã quá hạn (${formattedDate})` : `Hạn nộp: ${formattedDate}`}
        </Text>
      </View>
      <View style={styles.newHwStatus}>
        <Text style={[styles.newHwSubmittedText, isExpired && { color: '#64748b' }]}>{submitted} nộp</Text>
      </View>
    </View>
  );
}

function TabItem({ icon, label, active, onPress }: any) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={active ? "#2E7D32" : "#94a3b8"} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ManageLessonItem({ lessonId, title, category, img, isAssigned, isFeatured, onAssign, onToggleFeatured, onEdit, onDelete }: any) {
  const router = useRouter();

  const handlePress = () => {
    Alert.alert(
      "Quản lý bài giảng",
      `Thầy/Cô muốn làm gì với bài "${title}"?`,
      [
        {
          text: "Học thử (Xem trước)",
          onPress: () => router.push({
            pathname: "/learning/story/[id]",
            params: { id: lessonId, preview: "true" }
          })
        },
        { text: "Chỉnh sửa bài học", onPress: onEdit },
        { text: "Xóa bài học", style: "destructive", onPress: onDelete },
        { text: "Đóng", style: "cancel" }
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.hwCard} onPress={handlePress}>
      <Image source={{ uri: img }} style={styles.hwImg} />
      <View style={styles.hwInfo}>
        <Text style={styles.hwTitle}>{title}</Text>
        <Text style={styles.hwDate}>{category}</Text>
      </View>
      <View style={styles.hwActions}>
        <TouchableOpacity onPress={(e: any) => { e.stopPropagation(); onAssign(); }} style={{ marginRight: 15 }}>
          <Ionicons
            name={isAssigned ? "checkmark-circle" : "add-circle-outline"}
            size={24}
            color={isAssigned ? "#10B981" : "#94a3b8"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={(e: any) => { e.stopPropagation(); handlePress(); }}>
          <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function StudentItem({ name, email, onPress }: any) {
  return (
    <TouchableOpacity style={styles.studentCard} onPress={onPress}>
      <View style={styles.studentAvatarBox}>
        <Text style={styles.avatarInitial}>{name ? name[0].toUpperCase() : 'U'}</Text>
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{name}</Text>
        <Text style={styles.studentEmail}>{email}</Text>
      </View>
      <TouchableOpacity style={styles.moreBtn}>
        <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFDF0" },
  newHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: "#FFFDF0" },
  newClassTitle: { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  newHeaderSub: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  newStudentCount: { fontSize: 14, fontWeight: '700', color: '#64748b', marginLeft: 4 },
  xemLopKhac: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
  newScrollContent: { padding: 20, paddingBottom: 100 },
  newStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  newStatCard: { flex: 1, backgroundColor: '#FFFBEB', padding: 12, borderRadius: 16, justifyContent: 'center', borderWidth: 1, borderColor: "#FEF9C3" },
  newStatLabel: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  newStatValue: { fontSize: 24, fontWeight: '900' },
  newSection: { marginBottom: 30 },
  newSectionTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 20 },
  newHwCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#FFFBEB', borderRadius: 20, padding: 4, borderWidth: 1, borderColor: "#FEF9C3" },
  newHwImg: { width: 48, height: 48, borderRadius: 12 },
  newHwInfo: { flex: 1, marginLeft: 12 },
  newHwTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  newHwDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  newHwStatus: { alignItems: 'flex-end', paddingRight: 8 },
  newHwSubmittedText: { fontSize: 13, fontWeight: 'bold', color: '#4CAF50' },
  bottomTabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: '#FFFDF0', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#FEF9C3', paddingBottom: 20 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', marginTop: 4 },
  tabLabelActive: { color: '#2E7D32' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#FFFBEB", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "#FEF9C3" },
  addBtnText: { fontSize: 13, fontWeight: "bold", color: "#2E7D32", marginLeft: 4 },
  hwCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", padding: 12, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: "#FEF9C3" },
  hwImg: { width: 50, height: 50, borderRadius: 12 },
  hwInfo: { flex: 1, marginLeft: 12 },
  hwTitle: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  hwDate: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  hwActions: { flexDirection: 'row', alignItems: 'center' },
  emptyText: { fontSize: 14, color: "#94a3b8", fontStyle: "italic" },
  studentsList: { gap: 12 },
  studentCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 20, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FEF9C3" },
  studentAvatarBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFDF0", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#FEF9C3" },
  avatarInitial: { fontSize: 16, fontWeight: "bold", color: "#64748b" },
  studentInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: "bold", color: "#1e293b" },
  studentEmail: { fontSize: 12, color: "#64748b" },
  moreBtn: { padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFFDF0", borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 24, paddingBottom: 40, maxHeight: "90%", borderWidth: 1, borderColor: "#FEF9C3" },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "bold", color: "#1e293b", marginBottom: 16 },
  pickerContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pickerItem: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#FEF9C3", backgroundColor: "#FFFBEB" },
  pickerItemActive: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  pickerItemText: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  pickerItemTextActive: { color: "#fff" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  modalList: { flexGrow: 1 },
  modalItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#FFFBEB", borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: "#FEF9C3" },
  modalItemInfo: { flex: 1, marginRight: 12 },
  modalItemTitle: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  modalItemSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  modalAddBtn: { backgroundColor: "#2E7D32", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  modalAddBtnText: { color: "#fff", fontSize: 14, fontWeight: "bold" },

  // Create Assignment Styles
  quizSection: { marginTop: 10, marginBottom: 20 },
  quizHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  quizTitle: { fontSize: 16, fontWeight: "900", color: "#1e293b", textTransform: "uppercase", letterSpacing: 1 },
  addQBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFDF0", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: "#FEF9C3" },
  addQBtnText: { fontSize: 12, fontWeight: "bold", color: "#2E7D32", marginLeft: 4 },
  questionCard: { backgroundColor: "#FFFBEB", borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#FEF9C3" },
  qCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  qIndex: { fontSize: 13, fontWeight: "900", color: "#64748b" },
  inputField: { backgroundColor: "#FFFDF0", borderRadius: 16, padding: 12, fontSize: 14, borderWidth: 1, borderColor: "#FEF9C3", color: "#1e293b" },
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
  textInput: { backgroundColor: "#FFFBEB", borderRadius: 16, padding: 16, fontSize: 14, borderWidth: 1, borderColor: "#FEF9C3", color: "#1e293b", minHeight: 80, textAlignVertical: "top" },
  submitBtn: { backgroundColor: "#2E7D32", height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginTop: 20, shadowColor: "#2E7D32", shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  submitBtnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  createNewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 16, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#FEF9C3', borderStyle: 'dashed' },
  createNewBtnText: { marginLeft: 10, fontSize: 15, fontWeight: 'bold', color: '#2E7D32' },

  inputLabel: { fontSize: 14, fontWeight: "bold", color: "#64748b", marginBottom: 8 },
  input: { backgroundColor: "#FFFBEB", borderRadius: 16, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#FEF9C3", color: "#1e293b" },
  imagePickerBtn: { width: "100%", height: 180, borderRadius: 24, backgroundColor: "#FFFBEB", borderWidth: 2, borderColor: "#FEF9C3", borderStyle: "dashed", overflow: "hidden", marginBottom: 20 },
  pickedImage: { width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: { fontSize: 14, color: "#94a3b8", fontWeight: "bold", marginTop: 8 },
  uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
});
