import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, Image, TextInput, TouchableOpacity, ScrollView, useWindowDimensions, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { GoogleGenerativeAI } from "@google/generative-ai";
import client from "../../src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "../../src/context/LanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// INITIALIZE GEMINI (Sử dụng cùng Key với học sinh)
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const GET_TEACHER_SYSTEM_PROMPT = (lang: string) => `BẠN LÀ: 'Cố Vấn Di Sản' - Chuyên gia giáo dục và Trợ lý Trí tuệ Nhân tạo cao cấp dành riêng cho các Thầy Cô giáo trong hệ thống Heritage Math.

NHIỆM VỤ CỦA BẠN:
1. Hỗ trợ soạn giáo án: Gợi ý các phương pháp giảng dạy tích cực, tích hợp liên môn (Toán học và Văn hóa Di sản).
2. Sáng tạo nội dung: Tạo ra các bài toán đố, câu chuyện lịch sử, hoặc các hoạt động gamification hấp dẫn phù hợp với chương trình tiểu học/THCS.
3. Tư vấn sư phạm: Giải đáp các thắc mắc về cách truyền đạt kiến thức khó, cách quản lý lớp học và khích lệ học sinh.
4. Bảo mật & Chuyên nghiệp: Luôn giữ thái độ của một đồng nghiệp am tường kiến thức.

QUY TẮC PHẢN HỒI (BẮT BUỘC):
- PHẢN HỒI BẰNG NGÔN NGỮ: ${lang === 'vi' ? 'Tiếng Việt' : 'English'}.
- XƯNG HÔ: Gọi giáo viên là 'Thầy/Cô' hoặc 'Quý Thầy/Cô'. Tuyệt đối không gọi là 'bạn'. Xưng là 'Cố vấn' hoặc 'Mình'.
- TÔNG GIỌNG: Chuyên nghiệp, tôn trọng, đồng hành và giàu kiến thức chuyên môn.
- CẤU TRÚC: Trình bày khoa học, rõ ràng bằng các gạch đầu dòng, tiêu đề hoặc bảng biểu (nếu cần).
- KHÔNG lạm dụng biểu tượng cảm xúc. Sử dụng ngôn ngữ chuẩn mực sư phạm.`;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function TeacherAIScreen() {
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Xin chào Quý Thầy/Cô. Tôi là Cố Vấn Di Sản, rất vinh dự được đồng hành cùng Thầy/Cô trong việc sáng tạo bài giảng và quản lý lớp học. Tôi có thể giúp gì cho Thầy/Cô hôm nay?", sender: 'ai', timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const profileRes = await client.get("/auth/profile");
        const id = profileRes.data._id;
        setUserId(id);

        const savedChat = await AsyncStorage.getItem(`teacher_chat_history_${id}`);
        if (savedChat) {
          const parsed = JSON.parse(savedChat);
          const formatted = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
          setMessages(formatted);
        }
      } catch (error) {
        console.error("Failed to load teacher chat history", error);
      }
    };
    initChat();
  }, []);

  useEffect(() => {
    if (userId && messages.length > 1) {
      AsyncStorage.setItem(`teacher_chat_history_${userId}`, JSON.stringify(messages));
    }
  }, [messages, userId]);

  const teacherPrompts = [
    { label: "Soạn giáo án", prompt: "Gợi ý cho tôi một giáo án dạy về Số học lớp 5 tích hợp với di sản Văn Miếu Quốc Tử Giám." },
    { label: "Tạo bài tập", prompt: "Tạo 5 câu đố toán học vui nhộn liên quan đến trang phục dân tộc Việt Nam." },
    { label: "Tư vấn lớp", prompt: "Làm thế nào để khích lệ học sinh trầm tính tham gia phát biểu trong tiết Toán?" },
    { label: "Game lớp học", prompt: "Gợi ý một trò chơi gamification nhanh trong 5 phút để khởi động tiết học." }
  ];

  const simulateTyping = async (fullText: string, msgId: string) => {
    let currentText = "";
    const words = fullText.split(" ");
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? "" : " ") + words[i];
      setMessages(prev => {
        const exists = prev.find(m => m.id === msgId);
        if (exists) {
          return prev.map(m => m.id === msgId ? { ...m, text: currentText } : m);
        } else {
          return [...prev, { id: msgId, text: currentText, sender: 'ai', timestamp: new Date() }];
        }
      });
      // Tốc độ đánh máy
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || isThinking) return;

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);
    setIsThinking(true);

    try {
      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: GET_TEACHER_SYSTEM_PROMPT(language) }] },
          { role: 'model', parts: [{ text: "Tôi đã hiểu nhiệm vụ. Tôi là Cố Vấn Di Sản, sẵn sàng hỗ trợ Quý Thầy/Cô một cách chuyên nghiệp nhất." }] },
          ...messages.slice(1).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          }))
        ],
      });

      const result = await chat.sendMessage(text);
      const response = await result.response;
      const aiFullText = response.text();

      // Xong bước suy nghĩ -> Bắt đầu bước đánh máy
      setIsThinking(false);
      const aiMsgId = (Date.now() + 1).toString();
      await simulateTyping(aiFullText, aiMsgId);

    } catch (error) {
      console.error("Teacher Gemini Error:", error);
      const errorMsg: Message = { id: `err-${Date.now()}`, text: "Thành thật xin lỗi Thầy/Cô, kết nối với hệ thống cố vấn đang bị gián đoạn. Thầy/Cô vui lòng thử lại sau giây lát.", sender: 'ai', timestamp: new Date() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setIsThinking(false);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const clearChat = async () => {
    Alert.alert("Xóa lịch sử", "Thầy/Cô muốn xóa toàn bộ nội dung hội thoại này?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: async () => {
        if (userId) {
          await AsyncStorage.removeItem(`teacher_chat_history_${userId}`);
          setMessages([{ id: '1', text: "Lịch sử đã được làm mới. Tôi sẵn sàng hỗ trợ Thầy/Cô.", sender: 'ai', timestamp: new Date() }]);
        }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiInfo}>
          <View style={styles.avatarCircle}>
             <Ionicons name="school" size={24} color="#2E7D32" />
          </View>
          <View>
            <Text style={styles.aiTitle}>Cố Vấn Di Sản</Text>
            <Text style={styles.aiStatus}>Đang trực tuyến 🏛️</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat}>
          <Ionicons name="trash-outline" size={22} color="#64748b" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.messageWrapper, msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
              <View style={[styles.msgBubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.msgText, msg.sender === 'user' ? styles.userText : styles.aiText]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#2E7D32" size="small" />
              <Text style={styles.loadingText}>Cố vấn đang phân tích...</Text>
            </View>
          )}
        </ScrollView>

        {/* Suggestion Prompts */}
        <View style={styles.promptArea}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptScroll}>
            {teacherPrompts.map((p, index) => (
              <TouchableOpacity key={index} style={styles.promptBtn} onPress={() => sendMessage(p.prompt)}>
                <Text style={styles.promptBtnText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <TextInput 
            placeholder="Hỏi ý kiến cố vấn..." 
            style={styles.input}
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 15,
    backgroundColor: "#FFFDF0",
    borderBottomWidth: 1,
    borderBottomColor: "#FEF9C3",
  },
  aiInfo: { flexDirection: "row", alignItems: "center" },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFBEB", justifyContent: "center", alignItems: "center", marginRight: 12, borderWidth: 1, borderColor: "#FEF9C3" },
  aiTitle: { fontSize: 17, fontWeight: "800", color: "#1e293b" },
  aiStatus: { fontSize: 12, color: "#2E7D32", fontWeight: "600" },
  chatContent: { padding: 20, paddingBottom: 10 },
  messageWrapper: { marginBottom: 20, maxWidth: "85%" },
  userWrapper: { alignSelf: "flex-end" },
  aiWrapper: { alignSelf: "flex-start" },
  msgBubble: { padding: 15, borderRadius: 22, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  userBubble: { backgroundColor: "#1e293b", borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: "#FFFBEB", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#FEF9C3" },
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#FFFFFF", fontWeight: "500" },
  aiText: { color: "#334155" },
  loadingRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  loadingText: { marginLeft: 10, fontSize: 13, color: "#64748b", fontStyle: "italic" },
  promptArea: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#FEF9C3", backgroundColor: "#FFFDF0" },
  promptScroll: { paddingHorizontal: 20, gap: 10 },
  promptBtn: { backgroundColor: "#FFFBEB", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 15, borderWidth: 1, borderColor: "#FEF9C3" },
  promptBtnText: { fontSize: 13, color: "#2E7D32", fontWeight: "700" },
  inputArea: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: "#FFFDF0",
    borderTopWidth: 1, 
    borderTopColor: "#FEF9C3",
    paddingBottom: Platform.OS === 'ios' ? 30 : 12
  },
  input: { 
    flex: 1, 
    backgroundColor: "#FFFBEB", 
    minHeight: 48, 
    maxHeight: 120,
    borderRadius: 24, 
    paddingHorizontal: 20, 
    paddingVertical: 12,
    fontSize: 15, 
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#FEF9C3"
  },
  sendBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: "#2E7D32", 
    justifyContent: "center", 
    alignItems: "center", 
    marginLeft: 8 
  },
  sendBtnDisabled: { backgroundColor: "#cbd5e1" }
});
