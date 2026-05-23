import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function TeacherClassroom() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}><Text style={styles.title}>Quản lý lớp học</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>Tính năng quản lý danh sách lớp học đang được phát triển...</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF0" },
  header: { padding: 24, borderBottomWidth: 1, borderBottomColor: "#FEF9C3", backgroundColor: "#FFFDF0" },
  title: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  content: { padding: 24, alignItems: "center" },
  text: { color: "#64748b", textAlign: "center", fontWeight: "500" }
});
