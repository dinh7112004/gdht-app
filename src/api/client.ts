import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3001' 
  : 'http://192.168.1.186:3001';

export const resolveImageUrl = (url: string | null | undefined) => {
  if (!url) return "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  if (url.startsWith('http')) return url;
  // Handle local uploads if any legacy ones exist
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${BASE_URL}${cleanUrl}`;
};

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Add a request interceptor to attach the token
client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;
