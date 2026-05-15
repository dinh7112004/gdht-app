import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, Image, TextInput, TouchableOpacity, ScrollView, useWindowDimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { GoogleGenerativeAI } from "@google/generative-ai";
import client from "../../src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "../../src/context/LanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// INITIALIZE GEMINI
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const GET_SYSTEM_PROMPT = (lang: string) => `BẠN LÀ: '${lang === 'vi' ? 'Chú Rồng Di Sản' : 'Heritage Dragon'}' - Trợ lý trí tuệ nhân tạo chuyên sâu về giáo dục Toán học và Văn hóa Di sản Việt Nam dành cho học sinh tiểu học và trung học cơ sở.

NHIỆM VỤ CỦA BẠN:
1. Hỗ trợ giải đáp các thắc mắc về toán học (Số học, Hình học, Logic) một cách dễ hiểu và sư phạm.
2. Lồng ghép khéo léo các yếu tố di sản Việt Nam (Di tích lịch sử, danh nhân, ca dao, tục ngữ, làng nghề truyền thống) vào các ví dụ hoặc bài toán đố.
3. Khơi gợi lòng tự hào dân tộc và niềm yêu thích môn Toán thông qua kiến thức văn hóa.

QUY TẮC PHẢN HỒI (BẮT BUỘC):
- PHẢN HỒI BẰNG NGÔN NGỮ: ${lang === 'vi' ? 'Tiếng Việt' : 'English'}.
- KHÔNG sử dụng bất kỳ biểu tượng cảm xúc (emoji) hoặc ký tự icon nào trong toàn bộ câu trả lời.
- Sử dụng ngôn ngữ chuẩn mực, lễ phép, thân thiện nhưng vẫn giữ được sự chuyên nghiệp của một người thầy/người bạn đồng hành.
- Cấu trúc câu trả lời rõ ràng bằng cách sử dụng các đoạn văn hoặc danh sách gạch đầu dòng (nếu cần).
- Nếu học sinh hỏi một bài toán, hãy hướng dẫn các bước tư duy thay vì chỉ đưa ra đáp án cuối cùng.
- Luôn gọi học sinh là 'bạn' hoặc 'em' và xưng là '${lang === 'vi' ? 'Chú Rồng' : 'Dragon'}' hoặc 'mình'.`;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AIScreen() {
  const { width } = useWindowDimensions();
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: t('ai_greeting'), sender: 'ai', timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load User and History
  useEffect(() => {
    const initChat = async () => {
      try {
        const profileRes = await client.get("/auth/profile");
        const id = profileRes.data._id;
        setUserId(id);

        const savedChat = await AsyncStorage.getItem(`chat_history_${id}`);
        if (savedChat) {
          const parsed = JSON.parse(savedChat);
          // Chuyển string timestamp lại thành Date object
          const formatted = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
          setMessages(formatted);
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
      }
    };
    initChat();
  }, []);

  // Save History whenever messages change
  useEffect(() => {
    if (userId && messages.length > 1) {
      AsyncStorage.setItem(`chat_history_${userId}`, JSON.stringify(messages));
    }
  }, [messages, userId]);

  const prompts = [
    { label: t('suggest_solve'), prompt: language === 'vi' ? "Hãy tạo cho mình một bài toán đố liên quan đến Di tích Lịch sử Việt Nam (như Văn Miếu hoặc Kinh thành Huế)" : "Create a math riddle related to Vietnamese Historical Sites (like Temple of Literature or Hue Citadel)" },
    { label: t('suggest_story'), prompt: language === 'vi' ? "Kể cho mình một câu chuyện về trạng nguyên toán học Việt Nam nào!" : "Tell me a story about a Vietnamese math scholar!" },
    { label: t('suggest_riddle'), prompt: language === 'vi' ? "Đố mình một câu đố toán học dựa trên một bài ca dao tục ngữ nhé" : "Give me a math puzzle based on a Vietnamese folk song" },
    { label: t('help_center'), prompt: language === 'vi' ? "Giúp mình giải thích một bài toán khó mà mình đang gặp phải" : "Help me explain a difficult math problem I'm facing" }
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: GET_SYSTEM_PROMPT(language) }] },
          { role: 'model', parts: [{ text: language === 'vi' ? "Tôi đã hiểu! Tôi là Chú Rồng Di Sản, sẵn sàng đồng hành cùng bạn nhỏ." : "I understand! I am the Heritage Dragon, ready to accompany the little friend." }] },
          ...messages.slice(1).map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          }))
        ],
      });

      const result = await chat.sendMessage(text);
      const response = await result.response;
      const aiText = response.text();

      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: aiText, sender: 'ai', timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Gemini Error:", error);
      
      const errorMsg: Message = { id: `err-${Date.now()}`, text: language === 'vi' ? "Ối, Chú Rồng đang bận một chút, bạn thử lại sau nhé!" : "Oops, the Dragon is a bit busy, please try again later!", sender: 'ai', timestamp: new Date() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  const clearChat = async () => {
    if (userId) {
      await AsyncStorage.removeItem(`chat_history_${userId}`);
      setMessages([
        { id: '1', text: t('ai_greeting'), sender: 'ai', timestamp: new Date() }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiInfo}>
          <Image 
            source={require("../../assets/img3.jpg")} 
            style={styles.aiHeaderAvatar}
          />
          <View>
            <Text style={styles.aiTitle}>{t('ai_assistant_name')}</Text>
            <Text style={styles.aiStatus}>{t('ai_status')} 🐉</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat}>
          <Ionicons name="refresh-circle" size={28} color="#2E7D32" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.messageWrapper, msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
              {msg.sender === 'ai' && (
                <Image source={require("../../assets/img3.jpg")} style={styles.msgAvatar} />
              )}
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
              <Text style={styles.loadingText}>{language === 'vi' ? 'Chú Rồng đang suy nghĩ...' : 'Dragon is thinking...'}</Text>
            </View>
          )}
        </ScrollView>

        {/* Suggestion Prompts */}
        <View style={styles.promptArea}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptScroll}>
            {prompts.map((p, index) => (
              <TouchableOpacity key={index} style={styles.promptBtn} onPress={() => sendMessage(p.prompt)}>
                <Text style={styles.promptBtnText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="happy-outline" size={24} color="#64748b" />
          </TouchableOpacity>
          <TextInput 
            placeholder={t('ai_input_placeholder')} 
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
    borderBottomColor: "#FEF9C3"
  },
  aiInfo: { flexDirection: "row", alignItems: "center" },
  aiHeaderAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, borderWidth: 2, borderColor: "#FEF9C3" },
  aiTitle: { fontSize: 17, fontWeight: "800", color: "#1e293b" },
  aiStatus: { fontSize: 12, color: "#2E7D32", fontWeight: "600" },
  chatContent: { padding: 20, paddingBottom: 10 },
  messageWrapper: { flexDirection: "row", marginBottom: 20, maxWidth: "88%" },
  userWrapper: { alignSelf: "flex-end" },
  aiWrapper: { alignSelf: "flex-start" },
  msgAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, alignSelf: "flex-end" },
  msgBubble: { padding: 14, borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 5, elevation: 1 },
  userBubble: { backgroundColor: "#2E7D32", borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: "#FFFBEB", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#FEF9C3" },
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#FFFFFF", fontWeight: "500" },
  aiText: { color: "#334155", fontSize: SCREEN_WIDTH < 380 ? 14 : 15 },
  loadingRow: { flexDirection: "row", alignItems: "center", marginLeft: 40, marginBottom: 20 },
  loadingText: { marginLeft: 10, fontSize: 13, color: "#64748b", fontStyle: "italic" },
  promptArea: { backgroundColor: "#FFFDF0", paddingVertical: 10 },
  promptScroll: { paddingHorizontal: 20, gap: 10 },
  promptBtn: { backgroundColor: "#FFFBEB", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 15, borderWidth: 1, borderColor: "#FEF9C3" },
  promptBtnText: { fontSize: 13, color: "#1e293b", fontWeight: "700" },
  inputArea: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: "#FFFDF0",
    borderTopWidth: 1, 
    borderTopColor: "#FEF9C3" 
  },
  attachBtn: { marginRight: 8 },
  input: { 
    flex: 1, 
    backgroundColor: "#FFFBEB", 
    minHeight: 48, 
    maxHeight: 100,
    borderRadius: 24, 
    paddingHorizontal: 20, 
    paddingVertical: 10,
    fontSize: 15, 
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#FEF9C3"
  },
  sendBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: "#2E7D32", 
    justifyContent: "center", 
    alignItems: "center", 
    marginLeft: 8 
  },
  sendBtnDisabled: { backgroundColor: "#cbd5e1" }
});
