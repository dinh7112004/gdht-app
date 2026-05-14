import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import client from "../../../src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSound } from "../../../src/context/SoundContext";

const { width } = Dimensions.get("window");

export default function QuizScreen() {
  const { id, mode, preview } = useLocalSearchParams();
  const router = useRouter();
  const { playSound } = useSound();
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false); // Trạng thái đã ấn "Kiểm tra"
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const scoreRef = useRef(0);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const isReviewMode = mode === "review";
  const isPreviewMode = preview === "true";

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/quizzes?lessonId=${id}`);
      const quizData = Array.isArray(res.data) ? res.data[0] : res.data;
      setQuiz(quizData);

      // Kiểm tra xem có phải chế độ luyện tập không
      const userDataStr = await AsyncStorage.getItem("userData");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const progress = userData.completedLessons?.find((l: any) => 
            (typeof l === 'string' ? l === id : l.lessonId === id)
        );
        
        if (progress) {
            setIsPracticeMode(true);
            // Nếu đang xem lại, lấy các câu trả lời cũ
            if (isReviewMode && progress.answers) {
                setUserAnswers(progress.answers);
            }
        }
      }
    } catch (e) {
      console.error("Failed to fetch quiz", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#2E7D32" /></View>;

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyText}>Chưa có câu hỏi nào cho bài học này.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  
  // Trong chế độ review, lấy câu trả lời đã lưu. Ở chế độ làm bài, lấy state hiện tại.
  const currentSelection = isReviewMode ? userAnswers[currentQuestionIndex] : selectedOption;
  const isCorrect = currentSelection != null && currentSelection == currentQuestion.correctAnswerIndex;
  
  // Nếu là chế độ xem lại, luôn coi như đã trả lời để hiện đáp án
  const showResults = isAnswered || isReviewMode;

  const handleOptionSelect = (index: number) => {
    if (showResults) return; // Nếu đã kiểm tra hoặc đang review thì không cho chọn
    setSelectedOption(index);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    
    // Lưu câu trả lời vào mảng
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedOption;
    setUserAnswers(newAnswers);

    // Dùng == để tự động ép kiểu và cập nhật Ref ngay lập tức
    if (selectedOption == currentQuestion.correctAnswerIndex) {
      scoreRef.current += 1;
      playSound({ uri: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' }); // Correct
    } else {
      playSound({ uri: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' }); // Incorrect
    }
  };

  const handleFinishQuiz = async () => {
    // Nếu đang ở chế độ xem lại hoặc xem trước, không gửi điểm lên server
    if (isReviewMode || isPreviewMode) {
      if (isPreviewMode) {
        router.push({
          pathname: "/learning/result/[id]",
          params: { 
              id, 
              score: scoreRef.current, 
              total: quiz.questions.length,
              xp: quiz.xpReward || 50,
              preview: "true"
          }
        });
      } else {
        router.back();
      }
      return;
    }

    playSound({ uri: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3' }); // Celebration

    try {
      const finalScore = scoreRef.current;
      const totalQuestions = quiz.questions.length;
      const xpReward = quiz.xpReward || 50;

      // Gửi cả score, total, xpReward và answers lên server để cộng điểm thật
      const response = await client.post(`/users/complete-lesson/${id}`, {
        score: finalScore,
        total: totalQuestions,
        xpReward: xpReward,
        answers: userAnswers
      });
      
      const updatedUser = response.data;
      if (updatedUser) {
        // Lưu toàn bộ thông tin user mới nhất từ server vào AsyncStorage
        await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
        console.log("[DEBUG] Updated AsyncStorage with server data");
      }

      router.push({
        pathname: "/learning/result/[id]",
        params: { 
            id, 
            score: finalScore, 
            total: totalQuestions,
            xp: xpReward 
        }
      });
    } catch (e) {
      console.error("Failed to mark lesson as completed", e);
      // Vẫn cho sang trang kết quả để người dùng thấy điểm của họ dù lưu thất bại
      router.push({
        pathname: "/learning/result/[id]",
        params: { 
            id, 
            score: scoreRef.current, 
            total: quiz.questions.length,
            xp: quiz.xpReward || 50 
        }
      });
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      handleFinishQuiz();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.progressWrapper}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>Câu {currentQuestionIndex + 1} / {quiz.questions.length}</Text>
        </View>
        <View style={styles.xpBadge}>
           <Ionicons name="star" size={16} color="#F59E0B" />
           <Text style={styles.xpBadgeText}>{isPracticeMode ? "Luyện tập" : `+${quiz.xpReward || 50} XP`}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Question Section */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>{currentQuestion.questionText}</Text>
          
          {showResults && (
            <View style={[styles.explanationCard, isCorrect ? styles.correctBg : styles.wrongBg]}>
               <Ionicons 
                name={isCorrect ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={isCorrect ? "#059669" : "#DC2626"} 
               />
               <Text style={[styles.explanationText, isCorrect ? styles.correctText : styles.wrongText]}>
                {isCorrect 
                  ? (currentQuestion.explanation || "Chính xác! Làm tốt lắm.") 
                  : (currentSelection === undefined && isReviewMode 
                      ? "Không tìm thấy lịch sử lựa chọn cho câu hỏi này." 
                      : `Bạn đã chọn sai. ${currentQuestion.explanation || ""}`)
                }
               </Text>
            </View>
          )}
        </View>

        {/* Options Section */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option: string, index: number) => {
            const isSelected = (isReviewMode ? currentSelection === index : selectedOption === index);
            const isCorrectAnswer = index === currentQuestion.correctAnswerIndex;
            
            let borderColor = "#E2E8F0";
            let backgroundColor = "#FFF";
            let labelColor = "#3B82F6";

            if (showResults) {
              if (isCorrectAnswer) {
                // Đáp án ĐÚNG luôn hiện màu xanh
                borderColor = "#10B981";
                backgroundColor = "#ECFDF5";
                labelColor = "#10B981";
              } else if (isSelected) {
                // Nếu người dùng chọn trúng câu này và nó SAI (vì đã check isCorrectAnswer ở trên)
                borderColor = "#EF4444";
                backgroundColor = "#FEF2F2";
                labelColor = "#EF4444";
              }
            } else if (isSelected) {
              borderColor = "#3B82F6";
              backgroundColor = "#EFF6FF";
              labelColor = "#3B82F6";
            }

            return (
              <TouchableOpacity 
                key={index}
                activeOpacity={0.7}
                onPress={() => handleOptionSelect(index)}
                style={[styles.optionBtn, { borderColor, backgroundColor, borderWidth: isSelected || (showResults && isCorrectAnswer) ? 2.5 : 1 }]}
              >
                <View style={[styles.optionLabel, { backgroundColor: labelColor }]}>
                  <Text style={styles.optionLabelText}>{String.fromCharCode(65 + index)}</Text>
                </View>
                <Text style={[styles.optionText, isSelected && { fontWeight: "bold" }]}>{option}</Text>
                {showResults && isCorrectAnswer && (
                   <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
                {showResults && isSelected && !isCorrectAnswer && (
                   <Ionicons name="close-circle" size={24} color="#EF4444" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.footer}>
        {(!showResults) ? (
            <TouchableOpacity 
                style={[styles.nextBtn, selectedOption === null && styles.disabledBtn]} 
                onPress={handleCheckAnswer}
                disabled={selectedOption === null}
            >
                <Text style={styles.nextBtnText}>Kiểm tra</Text>
                <Ionicons name="search" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        ) : (
            <TouchableOpacity 
                style={styles.nextBtn} 
                onPress={handleNext}
            >
                <Text style={styles.nextBtnText}>
                    {currentQuestionIndex === quiz.questions.length - 1 ? (isReviewMode ? "Thoát xem lại" : "Hoàn thành") : "Tiếp theo"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 15, gap: 15 },
  progressWrapper: { flex: 1, alignItems: 'center' },
  progressBar: { width: '100%', height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: "#10B981" },
  progressText: { fontSize: 12, fontWeight: "bold", color: "#94A3B8" },
  xpBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  xpBadgeText: { fontSize: 12, fontWeight: '900', color: '#B45309', marginLeft: 4 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 100 },
  questionSection: { marginBottom: 30 },
  questionTitle: { fontSize: 22, fontWeight: "900", color: "#1e293b", lineHeight: 32, textAlign: 'center', marginBottom: 20 },
  
  explanationCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 12 },
  correctBg: { backgroundColor: '#ECFDF5' },
  wrongBg: { backgroundColor: '#FEF2F2' },
  explanationText: { flex: 1, fontSize: 14, fontWeight: '600' },
  correctText: { color: '#059669' },
  wrongText: { color: '#DC2626' },

  optionsContainer: { gap: 16 },
  optionBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 18, 
    borderRadius: 24, 
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  optionLabel: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 16 },
  optionLabelText: { color: "#FFF", fontWeight: "900", fontSize: 16 },
  optionText: { flex: 1, fontSize: 17, fontWeight: "700", color: "#334155" },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  nextBtn: { backgroundColor: "#059669", height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: "center", alignItems: "center", shadowColor: "#059669", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  disabledBtn: { backgroundColor: "#CBD5E1", shadowOpacity: 0 },
  nextBtnText: { color: "#FFF", fontSize: 18, fontWeight: "900" },

  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyText: { fontSize: 16, color: "#64748B", textAlign: "center", marginTop: 20, marginBottom: 30, fontWeight: '600' },
  backBtn: { backgroundColor: "#3B82F6", paddingHorizontal: 30, paddingVertical: 12, borderRadius: 15 },
  backBtnText: { color: "#FFF", fontWeight: "bold" }
});
