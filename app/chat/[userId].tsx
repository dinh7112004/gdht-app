import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
import client, { BASE_URL, resolveImageUrl } from "../../src/api/client";

interface Message {
  _id: string;
  senderId: { _id: string; fullName: string; avatar?: string } | string;
  receiverId: { _id: string; fullName: string; avatar?: string } | string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

function timeLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  return (
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}

function getSenderId(senderId: Message["senderId"]): string {
  if (typeof senderId === "string") return senderId;
  return senderId?._id ?? "";
}

export default function ChatScreen() {
  const router = useRouter();
  const { userId, userName, userAvatar } = useLocalSearchParams<{
    userId: string;
    userName: string;
    userAvatar?: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myId, setMyId] = useState<string>("");
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<Socket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("userData").then((data) => {
      if (data) {
        const user = JSON.parse(data) as { _id?: string; id?: string };
        setMyId(user._id ?? user.id ?? "");
      }
    });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await client.get<Message[]>(`/chat/messages/${userId}`);
      setMessages(res.data ?? []);
    } catch (e) {
      console.error("fetchMessages error", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markRead = useCallback(async () => {
    if (!userId) return;
    try {
      await client.put(`/chat/read/${userId}`);
    } catch (_) {}
  }, [userId]);

  // Socket.IO real-time
  useEffect(() => {
    if (!myId || !userId) return;
    const socket = io(BASE_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register", myId);
    });

    socket.on("newMessage", (msg: Message) => {
      const sId = getSenderId(msg.senderId);
      const rId = getSenderId(msg.receiverId);
      if (
        (sId === userId && rId === myId) ||
        (sId === myId && rId === userId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        void markRead();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [myId, userId, markRead]);

  // Initial load + polling fallback every 5s
  useEffect(() => {
    if (!userId) return;
    void fetchMessages().then(() => markRead());
    pollRef.current = setInterval(() => void fetchMessages(), 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages, markRead, userId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !userId || sending) return;
    setSending(true);
    setInputText("");
    try {
      const res = await client.post<Message>("/chat/send", {
        receiverId: userId,
        content: text,
      });
      setMessages((prev) => {
        if (prev.some((m) => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message ?? "Không thể gửi tin nhắn");
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = getSenderId(item.senderId) === myId;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <Image
            source={{ uri: resolveImageUrl(userAvatar) }}
            style={styles.avatar}
          />
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextOther]}>
            {item.content}
          </Text>
          <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther]}>
            {timeLabel(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1e293b" />
        </TouchableOpacity>
        <Image
          source={{ uri: resolveImageUrl(userAvatar) }}
          style={styles.headerAvatar}
        />
        <Text style={styles.headerName} numberOfLines={1}>
          {userName ?? "Tin nhắn"}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>Bắt đầu cuộc trò chuyện</Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || sending) && styles.sendBtnDisabled,
            ]}
            onPress={() => void sendMessage()}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FEF9C3",
    backgroundColor: "#FFFDF0",
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#e2e8f0",
  },
  headerName: { flex: 1, fontSize: 16, fontWeight: "700", color: "#1e293b" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  messageList: { padding: 16, paddingBottom: 8 },
  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowOther: { justifyContent: "flex-start" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    marginRight: 8,
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: "#2E7D32",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#FEF9C3",
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: "#fff" },
  bubbleTextOther: { color: "#1e293b" },
  timeText: { fontSize: 10, marginTop: 4 },
  timeTextMe: { color: "rgba(255,255,255,0.7)", textAlign: "right" },
  timeTextOther: { color: "#94a3b8" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: "#94a3b8" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#FEF9C3",
    backgroundColor: "#FFFDF0",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 15,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#FEF9C3",
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#94a3b8" },
});