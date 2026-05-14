import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, Dimensions, ImageBackground, ActivityIndicator, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import Svg, { Path } from "react-native-svg";
import client from "../../../src/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const DRAGON_ASSET = require("../../../assets/icon1.png"); 
const CHEST_ICON = "https://cdn-icons-png.flaticon.com/512/11529/11529141.png";
const DRAGON_GREEN = "#8AC73E"; 

export default function StoryModeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [lesson, setLesson] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [storyParts, setStoryParts] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lessonRes, quizRes] = await Promise.all([
        client.get(`/lessons/${id}`),
        client.get(`/quizzes?lessonId=${id}`)
      ]);
      
      const lessonData = lessonRes.data;
      setLesson(lessonData);
      
      if (lessonData && lessonData.content) {
        const content = lessonData.content;
        const parts = content.split(/\n?(?=\d+\.)/).map((p: string) => p.trim()).filter((p: string) => p.length > 0);
        setStoryParts(parts.length > 0 ? parts : ["Nội dung đang được cập nhật..."]);
      }

      setQuiz(quizRes.data[0] || quizRes.data);

      // KIỂM TRA TRẠNG THÁI HOÀN THÀNH
      const userStr = await AsyncStorage.getItem("userData");
      if (userStr) {
        const uData = JSON.parse(userStr);
        setUserData(uData);
        const completed = uData.completedLessons?.some((l: any) => 
            (typeof l === 'string' ? l === id : l.lessonId === id)
        );
        setIsCompleted(!!completed);
        if (completed) {
            setMaxReached(storyParts.length > 0 ? storyParts.length - 1 : 100);
        }
      }
    } catch (e) {
      console.error("Failed to fetch story data", e);
    } finally {
      setLoading(false);
    }
  };

  const jumpToStep = (index: number) => {
    if (index <= maxReached) {
      setCurrentStep(index);
      scrollRef.current?.scrollTo({ x: index * 150 - (width/2 - 75), animated: true });
    }
  };

  const handleNextStep = () => {
    if (currentStep < storyParts.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (next > maxReached) setMaxReached(next);
      scrollRef.current?.scrollTo({ x: next * 150 - (width/2 - 75), animated: true });
    } else {
      if (isCompleted) {
        const progress = userData?.completedLessons?.find((l: any) => 
            (typeof l === 'string' ? l === id : l.lessonId === id)
        );
        router.push({
          pathname: "/learning/result/[id]",
          params: { 
              id, 
              score: progress?.score || 0, 
              total: progress?.total || 1,
              xp: quiz?.xpReward || 50 
          }
        });
      } else {
        router.push({ pathname: `/learning/quiz/[id]`, params: { id: lesson?._id } });
      }
    }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#FFF" /></View>;

  const isFinalStep = currentStep === storyParts.length - 1;

  // Thuật toán vẽ dây "Hẳn hoi": Đi xuyên qua tâm các nút
  const generatePremiumPath = () => {
    if (storyParts.length < 2) return "";
    let d = "M 75 45"; // Tâm điểm đầu tiên (Node 1)
    for (let i = 0; i < storyParts.length - 1; i++) {
        const x1 = 75 + i * 150;
        const y1 = i % 2 === 0 ? 45 : 105;
        const x2 = 75 + (i + 1) * 150;
        const y2 = (i + 1) % 2 === 0 ? 45 : 105;
        
        // Tạo đường cong mượt mà giữa 2 điểm
        const cx1 = x1 + 50;
        const cy1 = y1;
        const cx2 = x2 - 50;
        const cy2 = y2;
        
        d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
    }
    return d;
  };

  const getNodeIcon = (index: number) => {
      const icons = ["baby", "person", "mail", "car", "airplane", "trophy"];
      return icons[index % icons.length];
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground source={{ uri: lesson?.imageUrl }} style={styles.background}>
        <View style={styles.overlay} />
        
        <SafeAreaView style={styles.premiumHeader}>
           <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backFab}>
                    <Ionicons name="arrow-back" size={26} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleBox}>
                    <Text style={styles.headerMainTitle} numberOfLines={1}>{lesson?.title}</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={[styles.timerBadge, timer > 1800 && styles.timerAlert]}>
                        <Ionicons name="time-outline" size={14} color="#FFF" />
                        <Text style={styles.timerText}>{formatTime(timer)}</Text>
                    </View>
                </View>
           </View>
        </SafeAreaView>

        <SafeAreaView style={styles.scrollableContent}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            
            {/* Completion Banner */}
            {isCompleted && (
                <View style={styles.completedBanner}>
                    <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
                    <Text style={styles.completedBannerText}>BẠN ĐÃ HOÀN THÀNH BÀI HỌC NÀY</Text>
                </View>
            )}

            {/* The Heritage String - Passing THROUGH Node Centers */}
            <View style={styles.heritagePathArea}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    ref={scrollRef}
                    contentContainerStyle={{ paddingHorizontal: 40, paddingTop: 100, paddingBottom: 60 }}
                >
                    <Svg height="160" width={storyParts.length * 150 + 100} style={styles.svgStringLayer}>
                        {/* Shadow Path */}
                        <Path
                            d={generatePremiumPath()}
                            fill="none"
                            stroke="rgba(0,0,0,0.2)"
                            strokeWidth="14"
                            strokeLinecap="round"
                        />
                        {/* Base Rope */}
                        <Path
                            d={generatePremiumPath()}
                            fill="none"
                            stroke="rgba(255,255,255,0.25)"
                            strokeWidth="10"
                            strokeLinecap="round"
                        />
                        {/* Active Progress Line */}
                        <Path
                            d={generatePremiumPath()}
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray="3000"
                            strokeDashoffset={3000 - (maxReached * 165)} // Ước tính chiều dài
                        />
                    </Svg>

                    {storyParts.map((_, index) => {
                        const isActive = currentStep === index;
                        const isUnlocked = index <= maxReached;
                        const isHigh = index % 2 === 0;
                        return (
                            <View key={index} style={[styles.nodePoint, { marginTop: isHigh ? 0 : 60 }]}>
                                {isActive && (
                                    <View style={styles.heroDragonBadge}>
                                        <Image source={DRAGON_ASSET} style={styles.heroDragonImg} />
                                    </View>
                                )}
                                
                                <TouchableOpacity 
                                    style={[
                                        styles.nodeHexagon, 
                                        isUnlocked && styles.nodeHexagonUnlocked,
                                        isActive && styles.nodeHexagonActive
                                    ]}
                                    onPress={() => jumpToStep(index)}
                                    activeOpacity={isUnlocked ? 0.7 : 1}
                                >
                                    <View style={styles.hexContent}>
                                        <Ionicons 
                                            name={getNodeIcon(index) as any} 
                                            size={24} 
                                            color={isUnlocked ? "#6B4226" : "rgba(255,255,255,0.3)"} 
                                        />
                                    </View>
                                    
                                    {/* Small Number Badge below Node */}
                                    <View style={[styles.numBadge, isUnlocked && styles.numBadgeUnlocked, isActive && styles.numBadgeActive]}>
                                        <Text style={styles.numBadgeText}>{index + 1}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Premium Dialogue Card */}
            <View style={styles.premiumCard}>
                <View style={styles.avatarSticker}>
                    <Image source={DRAGON_ASSET} style={styles.avatarStickerImg} />
                </View>
                <View style={styles.characterLabel}>
                    <Text style={styles.characterLabelText}>RỒNG CON DẪN CHUYỆN</Text>
                </View>
                <View style={styles.cardMainBody}>
                    <Text style={styles.cardTitle}>{currentStep === 0 ? "BỐI CẢNH" : isFinalStep ? "THỬ THÁCH" : "DIỄN BIẾN"}</Text>
                    <Text style={styles.cardTextContent}>{storyParts[currentStep]}</Text>
                </View>
            </View>

          </ScrollView>

          {/* Sticky Bottom Actions */}
          <View style={styles.bottomActions}>
             <View style={styles.rewardBadge}>
                <Ionicons name="gift-outline" size={24} color="#6B4226" />
                <View>
                    <Text style={styles.rewardLabel}>PHẦN THƯỞNG</Text>
                    <Text style={styles.rewardValue}>+{lesson?.xpReward || 50} XP</Text>
                </View>
             </View>
             
             <TouchableOpacity 
                style={[styles.btnPrimary, isCompleted && isFinalStep && styles.btnPractice]} 
                onPress={handleNextStep}
             >
                <Text style={styles.actionButtonText}>
                    {isFinalStep ? (isCompleted ? "Xem kết quả" : "Bắt đầu") : "Tiếp tục"}
                </Text>
                <View style={styles.actionIconCircle}>
                    <Ionicons 
                        name={isCompleted && isFinalStep ? "bar-chart" : "arrow-forward"} 
                        size={22} 
                        color={isCompleted && isFinalStep ? "#6B4226" : "#10B981"} 
                    />
                </View>
             </TouchableOpacity>
          </View>

        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, backgroundColor: '#052229', justifyContent: 'center', alignItems: 'center' },
  background: { width: width, height: height },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 34, 41, 0.75)' },
  
  premiumHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 15, 
    paddingBottom: 10,
    zIndex: 10 // Đảm bảo luôn nằm trên
  },
  backFab: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitleBox: { flex: 1, alignItems: 'center' },
  headerMainTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  headerRight: { width: 80, alignItems: 'flex-end' },
  timerBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12,
    gap: 4
  },
  timerAlert: { backgroundColor: '#EF4444' },
  timerText: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  scrollableContent: { flex: 1, paddingTop: 10 },
  heritagePathArea: { height: 280, marginTop: 0 },
  svgStringLayer: { position: 'absolute', top: 30, left: 30 },
  
  nodePoint: { width: 150, alignItems: 'center', position: 'relative' },
  heroDragonBadge: { width: 85, height: 85, borderRadius: 42.5, backgroundColor: DRAGON_GREEN, borderWidth: 3, borderColor: '#FFF', position: 'absolute', top: -90, zIndex: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15 },
  heroDragonImg: { width: 85, height: 85, resizeMode: 'contain', transform: [{ scale: 2.2 }] },
  
  nodeHexagon: { width: 70, height: 70, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(212, 163, 115, 0.4)', position: 'relative' },
  nodeHexagonUnlocked: { backgroundColor: '#EAD7BB', borderColor: '#D4A373' },
  nodeHexagonActive: { backgroundColor: '#FFF', borderColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 0.6, shadowRadius: 20 },
  hexContent: { zIndex: 5 },
  
  numBadge: { position: 'absolute', bottom: -12, width: 28, height: 28, borderRadius: 14, backgroundColor: '#6B4226', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', zIndex: 10 },
  numBadgeUnlocked: { backgroundColor: '#D4A373' },
  numBadgeActive: { backgroundColor: '#10B981' },
  numBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  premiumCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 35, marginTop: 50, padding: 25, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, elevation: 20, position: 'relative' },
  avatarSticker: { position: 'absolute', top: -45, left: 15, width: 100, height: 100, borderRadius: 50, backgroundColor: DRAGON_GREEN, borderWidth: 4, borderColor: '#FFF', zIndex: 30, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarStickerImg: { width: 100, height: 100, resizeMode: 'contain', transform: [{ scale: 2.5 }] },
  characterLabel: { position: 'absolute', top: -18, left: 120, backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, zIndex: 20 },
  characterLabelText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  cardMainBody: { marginTop: 40 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#10B981', marginBottom: 12 },
  cardTextContent: { fontSize: 16, color: '#1e293b', lineHeight: 28, fontWeight: '800' },

  bottomActions: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    flexDirection: 'row', alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20,
    backgroundColor: 'rgba(5, 34, 41, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)'
  },
  rewardBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 20, 
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4
  },
  rewardLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8' },
  rewardValue: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  xpTextValue: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  btnPrimary: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingLeft: 25, paddingRight: 8, paddingVertical: 8, borderRadius: 32, gap: 12, shadowColor: '#10B981', shadowOpacity: 0.5, shadowRadius: 15 },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  actionIconCircle: { backgroundColor: '#FFF', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  btnPractice: { backgroundColor: '#D4A373', shadowColor: '#D4A373' },
  
  completedBanner: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 30,
    marginTop: 60, // Đẩy xuống để không đè vào tiêu đề
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  completedBannerText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  }
});
